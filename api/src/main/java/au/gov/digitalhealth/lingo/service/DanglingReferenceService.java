/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.lingo.service;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.promotion.ConceptStatus;
import au.gov.digitalhealth.lingo.promotion.DanglingNonDefiningRelationship;
import au.gov.digitalhealth.lingo.promotion.DanglingReferenceSummary;
import au.gov.digitalhealth.lingo.promotion.DanglingRefsetMember;
import au.gov.digitalhealth.lingo.promotion.TidyAction;
import au.gov.digitalhealth.lingo.promotion.TidyFailure;
import au.gov.digitalhealth.lingo.promotion.TidyKind;
import au.gov.digitalhealth.lingo.promotion.TidyResult;
import au.gov.digitalhealth.lingo.promotion.TidySuccess;
import au.gov.digitalhealth.lingo.traceability.BranchChangeSummary;
import au.gov.digitalhealth.lingo.traceability.TraceabilityServiceClient;
import au.gov.digitalhealth.lingo.util.PartitionIdentifier;
import au.gov.digitalhealth.lingo.util.SnomedIdentifierUtil;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.logging.Level;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

/**
 * Detects and tidies dangling reference set members and non-defining relationships on a task
 * branch.
 *
 * <p>Detection scope is the union of two sources, both anchored on the SNOMED CT
 * authoring-traceability-service:
 *
 * <ul>
 *   <li><b>Authored on this task</b> — refset members and non-defining relationships whose
 *       traceability log entry's latest non-superseded change isn't a {@code DELETE}. Any of these
 *       that point at an inactive or missing concept are flagged.
 *   <li><b>Inherited references to concepts inactivated on this task</b> — for every concept the
 *       task changed on this branch that Snowstorm now reports inactive or deleted, fan out via
 *       Snowstorm to find any active refset member or non-defining relationship anywhere on the
 *       branch that still references it. Those are dangling and need cleanup too. The inactive
 *       decision uses Snowstorm's authoritative {@code active} status, deliberately NOT the
 *       traceability change type — the traceability service records a concept inactivation as an
 *       {@code UPDATE}, not an {@code INACTIVATE}, so keying on the label missed every retire.
 * </ul>
 *
 * <p>Tidy mirrors the rule: released components are inactivated (we keep the audit trail);
 * unreleased components are deleted outright. Tidy never disagrees with detect about scope — it
 * consumes detect's {@link DanglingReferenceSummary} and looks the source objects back up via
 * id-indexed maps from the same {@link DetectionContext}.
 */
@Log
@Service
public class DanglingReferenceService {

  // Refsets a member can belong to that must NEVER be flagged as a dangling reference, for one of
  // two reasons:
  //   1. They legitimately reference inactive concepts as part of their normal function (flagging
  //      them would delete the very metadata that records why a concept was retired).
  //   2. They are definitional and owned by classification, not by this tidy feature — an OWL
  //      axiom member is the concept's logic definition; when the concept is retired its axiom is
  //      inactivated by the platform/classifier, so it is not a stray reference we should touch.
  static final Set<String> EXPECTED_INACTIVE_REFERENCE_REFSETS =
      Set.of(
          "900000000000489007", // Concept inactivation indicator attribute value reference set
          "900000000000523009", // POSSIBLY EQUIVALENT TO association reference set
          "900000000000524003", // MOVED FROM association reference set
          "900000000000525002", // MOVED TO association reference set
          "900000000000526001", // REPLACED BY association reference set
          "900000000000527005", // SAME AS association reference set
          "900000000000528000", // WAS A association reference set
          "900000000000530003", // ALTERNATIVE association reference set
          "900000000000531004", // REFERS TO concept association reference set
          "1186921009", // PARTIALLY EQUIVALENT TO association reference set
          "1186924001", // PARTIALLY OVERLAPS THE MEANING OF association reference set
          "1193550005", // POSSIBLY REPLACED BY association reference set
          "733073007"); // OWL axiom reference set — definitional, owned by classification

  private final SnowstormClient snowstormClient;
  private final TraceabilityServiceClient traceabilityServiceClient;

  public DanglingReferenceService(
      SnowstormClient snowstormClient, TraceabilityServiceClient traceabilityServiceClient) {
    this.snowstormClient = snowstormClient;
    this.traceabilityServiceClient = traceabilityServiceClient;
  }

  public DanglingReferenceSummary detect(String branch) {
    return detectFromContext(branch, collect(branch));
  }

  /**
   * Detects dangling references in a given branch - used by both #detect() and #tidy().
   *
   * @param branch The branch to detect dangling references in.
   * @return A summary of dangling references found.
   */
  private DanglingReferenceSummary detectFromContext(String branch, DetectionContext ctx) {
    List<DanglingRefsetMember> danglingMembers = new ArrayList<>();
    List<DanglingNonDefiningRelationship> danglingRels = new ArrayList<>();

    for (SnowstormReferenceSetMember m : ctx.taskMembers) {
      // An inactive member is not dangling — an inactive member pointing at an inactive concept
      // is a consistent end state (e.g. a retired concept's own OWL axiom member, inactivated by
      // the platform). Only an ACTIVE member that still points at a gone concept needs tidying.
      if (isActive(m) && !isExpectedInactiveReferenceRefset(m)) {
        ConceptStatus status = statusOf(m.getReferencedComponentId(), ctx.byId);
        if (status != ConceptStatus.ACTIVE) {
          danglingMembers.add(toDanglingMember(m, status, ctx.byId));
        }
      }
    }
    for (SnowstormRelationship r : ctx.taskRels) {
      // Same rule as members: an already-inactive relationship is not a dangling reference.
      if (isActive(r) && isWellFormed(r, branch)) {
        ConceptStatus srcStatus = statusOf(r.getSourceId(), ctx.byId);
        ConceptStatus dstStatus = statusOf(r.getDestinationId(), ctx.byId);
        if (srcStatus != ConceptStatus.ACTIVE || dstStatus != ConceptStatus.ACTIVE) {
          danglingRels.add(toDanglingRel(r, srcStatus, dstStatus, ctx.byId));
        }
      }
    }

    log.info(
        "Dangling-reference detection on branch "
            + branch
            + ": "
            + danglingMembers.size()
            + " dangling refset member(s), "
            + danglingRels.size()
            + " dangling non-defining relationship(s)");
    return new DanglingReferenceSummary(branch, danglingMembers, danglingRels);
  }

  public TidyResult tidy(String branch) {
    // Detect first. tidy is acting on detect's output, so the two can never disagree.
    DetectionContext ctx = collect(branch);
    DanglingReferenceSummary summary = detectFromContext(branch, ctx);

    // Index source objects by id so we can recover the SnowstormReferenceSetMember /
    // SnowstormRelationship needed for the inactivate calls (the DTO carries the id but not the
    // full payload Snowstorm requires).
    Map<String, SnowstormReferenceSetMember> memberById = new HashMap<>();
    for (SnowstormReferenceSetMember m : ctx.taskMembers) {
      if (m.getMemberId() != null) memberById.put(m.getMemberId(), m);
    }
    Map<String, SnowstormRelationship> relationshipById = new HashMap<>();
    for (SnowstormRelationship r : ctx.taskRels) {
      if (r.getRelationshipId() != null) relationshipById.put(r.getRelationshipId(), r);
    }

    List<TidySuccess> succeeded = new ArrayList<>();
    List<TidyFailure> failed = new ArrayList<>();

    log.info(
        "Tidying "
            + summary.danglingRefsetMembers().size()
            + " dangling refset member(s) and "
            + summary.danglingNonDefiningRelationships().size()
            + " dangling non-defining relationship(s) on branch "
            + branch);

    // Every dangling.memberId() / .relationshipId() comes from the same ctx.taskMembers /
    // ctx.taskRels that the indices are built from — a missing lookup means the detect/tidy
    // contract is broken (e.g. a member with a null id slipped past upstream filters). Fail
    // loudly with branch context rather than silently dropping work the caller was told would
    // happen.
    for (DanglingRefsetMember dangling : summary.danglingRefsetMembers()) {
      SnowstormReferenceSetMember m =
          Objects.requireNonNull(
              memberById.get(dangling.memberId()),
              () ->
                  "memberId "
                      + dangling.memberId()
                      + " has no source SnowstormReferenceSetMember on branch "
                      + branch);
      tidyRefsetMember(branch, m, succeeded, failed);
    }
    for (DanglingNonDefiningRelationship dangling : summary.danglingNonDefiningRelationships()) {
      SnowstormRelationship r =
          Objects.requireNonNull(
              relationshipById.get(dangling.relationshipId()),
              () ->
                  "relationshipId "
                      + dangling.relationshipId()
                      + " has no source SnowstormRelationship on branch "
                      + branch);
      tidyRelationship(branch, r, succeeded, failed);
    }

    log.info(
        "Tidy complete on branch "
            + branch
            + ": "
            + succeeded.size()
            + " succeeded, "
            + failed.size()
            + " failed");
    return new TidyResult(succeeded, failed);
  }

  private void tidyRefsetMember(
      String branch,
      SnowstormReferenceSetMember m,
      List<TidySuccess> succeeded,
      List<TidyFailure> failed) {

    TidyAction action = null;
    try {
      if (isReleased(m)) {
        action = TidyAction.INACTIVATED;
        snowstormClient.inactivateRefsetMember(branch, m);
      } else {
        action = TidyAction.DELETED;
        snowstormClient.deleteRefsetMember(branch, m.getMemberId());
      }
      log.info(
          "Tidied refset member "
              + m.getMemberId()
              + " (refset="
              + m.getRefsetId()
              + ", referencedComponent="
              + m.getReferencedComponentId()
              + ", released="
              + isReleased(m)
              + ") on branch "
              + branch
              + ": "
              + action);
      succeeded.add(new TidySuccess(TidyKind.REFSET_MEMBER, m.getMemberId(), action));
    } catch (WebClientException | LingoProblem e) {
      log.log(
          Level.SEVERE,
          "Tidy of refset member "
              + m.getMemberId()
              + " on branch "
              + branch
              + " failed for action "
              + action,
          e);
      failed.add(new TidyFailure(TidyKind.REFSET_MEMBER, m.getMemberId(), action, errorMessage(e)));
    }
  }

  private void tidyRelationship(
      String branch,
      SnowstormRelationship r,
      List<TidySuccess> succeeded,
      List<TidyFailure> failed) {
    TidyAction action = null;
    try {
      if (isReleased(r)) {
        action = TidyAction.INACTIVATED;
        snowstormClient.inactivateRelationship(branch, r);
      } else {
        action = TidyAction.DELETED;
        snowstormClient.deleteRelationship(branch, r.getRelationshipId());
      }
      log.info(
          "Tidied non-defining relationship "
              + r.getRelationshipId()
              + " (type="
              + r.getTypeId()
              + ", source="
              + r.getSourceId()
              + ", destination="
              + r.getDestinationId()
              + ", released="
              + isReleased(r)
              + ") on branch "
              + branch
              + ": "
              + action);
      succeeded.add(
          new TidySuccess(TidyKind.NON_DEFINING_RELATIONSHIP, r.getRelationshipId(), action));
    } catch (WebClientException | LingoProblem e) {
      log.log(
          Level.SEVERE,
          "Tidy of non-defining relationship "
              + r.getRelationshipId()
              + " on branch "
              + branch
              + " failed for action "
              + action,
          e);
      failed.add(
          new TidyFailure(
              TidyKind.NON_DEFINING_RELATIONSHIP, r.getRelationshipId(), action, errorMessage(e)));
    }
  }

  // Holds everything detect/tidy need after the traceability + Snowstorm fan-out.
  private record DetectionContext(
      List<SnowstormReferenceSetMember> taskMembers,
      List<SnowstormRelationship> taskRels,
      Map<String, SnowstormConceptMini> byId) {}

  // Which input wins when the same id appears in both lists during a merge. Authored-on-task
  // entries always overwrite references-to-inactivated entries (their bookkeeping is what tidy's
  // audit log surfaces), but never the other way round.
  private enum Precedence {
    AUTHORED_WINS,
    FIRST_WINS
  }

  private DetectionContext collect(String branch) {
    // Phase 1: traceability is the authoritative scope. Get it first; everything else flows
    // from the ids it returns.
    BranchChangeSummary summary =
        BranchChangeSummary.from(
            traceabilityServiceClient.getContentChangeActivitiesOnBranch(branch));

    // Phase 1.5: decide which concepts the task touched are now gone. We ask Snowstorm for the
    // authoritative active status rather than trusting the traceability change type — the
    // traceability service records a concept inactivation as an UPDATE, not an INACTIVATE, so
    // keying on the label misses every retire (the original cause of this detection silently
    // returning nothing). A changed concept that Snowstorm reports inactive or absent is the
    // trigger for the scenario-B fan-out below. The concept minis fetched here seed `byId` so the
    // phase-3 status lookup doesn't re-fetch the ones it also references (e.g. the retired concept
    // is both changed-on-branch and the referenced target of its own dangling references).
    Map<String, SnowstormConceptMini> byId = new HashMap<>();
    Set<String> inactivatedConceptIds =
        inactiveOrMissing(branch, summary.conceptIdsChangedOnBranch(), byId);

    // Phase 2: parallel — fetch the actual member/relationship payloads for the ids the task
    // authored, plus (in parallel) any active refset members and non-defining relationships
    // anywhere on the branch that reference a concept the task inactivated. Together these are
    // the candidate set: anything authored on the task whose target may be invalid, and any
    // existing reference to a concept the task just retired.
    var phase2 =
        Mono.zip(
                snowstormClient.fetchRefsetMembersByIds(
                    branch, summary.refsetMemberIdsStillOnBranch()),
                snowstormClient.fetchRelationshipsByIds(
                    branch, summary.relationshipIdsStillOnBranch()),
                snowstormClient.findActiveRefsetMembersForConcepts(branch, inactivatedConceptIds),
                snowstormClient.findActiveNonDefiningRelationshipsForConcepts(
                    branch, inactivatedConceptIds))
            .block();

    // Combine the authored-on-task and references-to-inactivated sets. Dedupe by id so we
    // don't double-flag a member that was both authored on the task and references an
    // inactivated concept.
    List<SnowstormReferenceSetMember> taskMembers = mergeMembers(phase2.getT1(), phase2.getT3());
    List<SnowstormRelationship> taskRels = mergeRelationships(phase2.getT2(), phase2.getT4());

    // Phase 3: bulk-fetch the referenced concepts (refset, referencedComponent, source,
    // destination, type) so we can determine each component's status — but only the ones phase 1.5
    // didn't already resolve. Synchronous — runs on the request thread because
    // getConceptsByIdViaSearch depends on request-scoped beans.
    Set<String> referencedIds = collectReferencedConceptIds(taskMembers, taskRels);
    Set<String> toFetch = new HashSet<>(referencedIds);
    toFetch.removeAll(byId.keySet());
    if (!toFetch.isEmpty()) {
      for (SnowstormConceptMini c : snowstormClient.getConceptsByIdViaSearch(branch, toFetch)) {
        if (c.getConceptId() != null) byId.put(c.getConceptId(), c);
      }
    }
    logBulkConceptFetchOutcome(branch, referencedIds, byId.keySet());

    return new DetectionContext(taskMembers, taskRels, byId);
  }

  // Of the concepts the task changed on this branch, the subset Snowstorm no longer reports as
  // ACTIVE — i.e. retired (active=false) or deleted (absent from the fetch). These, and only
  // these, drive the scenario-B fan-out for inherited dangling references. The decision is made
  // against Snowstorm's authoritative active status, never the traceability change type, so it is
  // immune to whether the service labels an inactivation UPDATE or INACTIVATE. Synchronous —
  // getConceptsByIdViaSearch depends on request-scoped beans and must run on the request thread.
  private Set<String> inactiveOrMissing(
      String branch, Set<String> conceptIds, Map<String, SnowstormConceptMini> outById) {
    if (conceptIds == null || conceptIds.isEmpty()) return Set.of();
    for (SnowstormConceptMini c : snowstormClient.getConceptsByIdViaSearch(branch, conceptIds)) {
      if (c.getConceptId() != null) outById.put(c.getConceptId(), c);
    }
    Set<String> result = new HashSet<>();
    for (String id : conceptIds) {
      if (statusOf(id, outById) != ConceptStatus.ACTIVE) result.add(id);
    }
    return result;
  }

  // statusOf() returns DELETED for any concept missing from the bulk fetch — that's correct when
  // the concept genuinely doesn't exist on the branch, but would silently mask a truncation bug
  // in the paginated search. Log the missing-id count so an unexpectedly large gap shows up in
  // ops logs even though the per-concept fallback to DELETED stays the same. `available` may be a
  // superset of `requested` (it also holds the phase-1.5 changed concepts), so compute "missing"
  // as a set difference rather than a size subtraction.
  private static void logBulkConceptFetchOutcome(
      String branch, Set<String> requested, Set<String> available) {
    Set<String> missingIds = new HashSet<>(requested);
    missingIds.removeAll(available);
    if (missingIds.isEmpty()) return;
    log.info(
        "Concept bulk fetch on branch "
            + branch
            + " resolved "
            + (requested.size() - missingIds.size())
            + "/"
            + requested.size()
            + " concepts; "
            + missingIds.size()
            + " absent (will be treated as DELETED): "
            + truncateForLog(missingIds));
  }

  private static String truncateForLog(Collection<String> ids) {
    int max = 50;
    if (ids.size() <= max) return ids.toString();
    List<String> head = new ArrayList<>(max);
    int i = 0;
    for (String id : ids) {
      if (i++ >= max) break;
      head.add(id);
    }
    return head + " (+" + (ids.size() - max) + " more)";
  }

  private static boolean referencesAConcept(SnowstormReferenceSetMember m) {
    String id = m.getReferencedComponentId();
    return SnomedIdentifierUtil.isValid(id, PartitionIdentifier.CONCEPT);
  }

  // Combine the authored-on-task members and the references-to-inactivated members, deduping by
  // memberId. Authored-on-task wins on collisions because we want detect() to operate on the
  // task's view of the member (the dangling-reference behaviour is identical either way; it's
  // bookkeeping that matters for the audit log in tidy()).
  private static List<SnowstormReferenceSetMember> mergeMembers(
      List<SnowstormReferenceSetMember> authoredOnTask,
      List<SnowstormReferenceSetMember> referencingInactivated) {
    Map<String, SnowstormReferenceSetMember> byId = new LinkedHashMap<>();
    addMembers(authoredOnTask, byId, Precedence.AUTHORED_WINS);
    addMembers(referencingInactivated, byId, Precedence.FIRST_WINS);
    return List.copyOf(byId.values());
  }

  private static void addMembers(
      List<SnowstormReferenceSetMember> source,
      Map<String, SnowstormReferenceSetMember> byId,
      Precedence precedence) {
    for (SnowstormReferenceSetMember m : source) {
      if (m.getMemberId() == null || !referencesAConcept(m)) continue;
      if (precedence == Precedence.FIRST_WINS) {
        byId.putIfAbsent(m.getMemberId(), m);
      } else {
        byId.put(m.getMemberId(), m);
      }
    }
  }

  private static List<SnowstormRelationship> mergeRelationships(
      List<SnowstormRelationship> authoredOnTask,
      List<SnowstormRelationship> referencingInactivated) {
    Map<String, SnowstormRelationship> byId = new LinkedHashMap<>();
    addRelationships(authoredOnTask, byId, Precedence.AUTHORED_WINS);
    addRelationships(referencingInactivated, byId, Precedence.FIRST_WINS);
    return List.copyOf(byId.values());
  }

  private static void addRelationships(
      List<SnowstormRelationship> source,
      Map<String, SnowstormRelationship> byId,
      Precedence precedence) {
    for (SnowstormRelationship r : source) {
      if (r.getRelationshipId() == null) continue;
      if (precedence == Precedence.FIRST_WINS) {
        byId.putIfAbsent(r.getRelationshipId(), r);
      } else {
        byId.put(r.getRelationshipId(), r);
      }
    }
  }

  // True for members whose refset is one of the well-known refsets that legitimately point to
  // inactive concepts. Such members must never be flagged as dangling — that would cause us to
  // delete the very metadata that records why a concept was retired.
  private static boolean isExpectedInactiveReferenceRefset(SnowstormReferenceSetMember m) {
    return EXPECTED_INACTIVE_REFERENCE_REFSETS.contains(m.getRefsetId());
  }

  private static Set<String> collectReferencedConceptIds(
      List<SnowstormReferenceSetMember> members, List<SnowstormRelationship> relationships) {
    Set<String> ids = new HashSet<>();
    for (SnowstormReferenceSetMember m : members) {
      ids.add(m.getReferencedComponentId());
      ids.add(m.getRefsetId());
    }
    for (SnowstormRelationship r : relationships) {
      if (r.getSourceId() != null) ids.add(r.getSourceId());
      if (r.getDestinationId() != null) ids.add(r.getDestinationId());
      ids.add(r.getTypeId());
    }
    return ids;
  }

  // Caller invariants (see mergeMembers / referencesAConcept): memberId, refsetId, and
  // referencedComponentId are all non-null by the time we reach this helper. Snowstorm's bean
  // accessors are nullable in their generated form so the IDE can't infer that — pull them into
  // locals via requireNonNull to assert the contract once and silence the warning at every
  // constructor argument.
  private DanglingRefsetMember toDanglingMember(
      SnowstormReferenceSetMember m, ConceptStatus status, Map<String, SnowstormConceptMini> byId) {
    String memberId = Objects.requireNonNull(m.getMemberId(), "memberId");
    String refsetId = Objects.requireNonNull(m.getRefsetId(), "refsetId");
    String referencedComponentId =
        Objects.requireNonNull(m.getReferencedComponentId(), "referencedComponentId");
    SnowstormConceptMini refset = byId.get(refsetId);
    SnowstormConceptMini referenced = byId.get(referencedComponentId);
    return new DanglingRefsetMember(
        memberId,
        refsetId,
        ptOrNull(refset),
        referencedComponentId,
        ptOrNull(referenced),
        status,
        isReleased(m));
  }

  // Caller invariants (see isWellFormed): relationshipId, typeId, and sourceId are non-null.
  // destinationId may legitimately be null (concrete-value relationships).
  private DanglingNonDefiningRelationship toDanglingRel(
      SnowstormRelationship r,
      ConceptStatus srcStatus,
      ConceptStatus dstStatus,
      Map<String, SnowstormConceptMini> byId) {
    String relationshipId = Objects.requireNonNull(r.getRelationshipId(), "relationshipId");
    String typeId = Objects.requireNonNull(r.getTypeId(), "typeId");
    String sourceId = Objects.requireNonNull(r.getSourceId(), "sourceId");
    SnowstormConceptMini type = byId.get(typeId);
    SnowstormConceptMini src = byId.get(sourceId);
    SnowstormConceptMini dst = r.getDestinationId() == null ? null : byId.get(r.getDestinationId());
    return new DanglingNonDefiningRelationship(
        relationshipId,
        typeId,
        ptOrNull(type),
        sourceId,
        ptOrNull(src),
        srcStatus,
        r.getDestinationId(),
        ptOrNull(dst),
        dstStatus,
        isReleased(r));
  }

  // The TidyFailure.errorMessage is the only thing the user sees per failed item, so we
  // surface as much detail as the WebClient throwable carries: the response body for 4xx/5xx
  // (often the only place Snowstorm returns the actual reason) plus the status, and a sensible
  // default for everything else.
  private static String errorMessage(Throwable e) {
    if (e instanceof WebClientResponseException wre) {
      String body = wre.getResponseBodyAsString();
      String prefix = wre.getStatusCode() + " from Snowstorm";
      return (!body.isBlank()) ? prefix + ": " + body : prefix;
    }
    String msg = e.getMessage();
    return msg != null && !msg.isBlank() ? msg : e.getClass().getSimpleName();
  }

  private static ConceptStatus statusOf(String id, Map<String, SnowstormConceptMini> byId) {
    if (id == null) return ConceptStatus.ACTIVE;
    SnowstormConceptMini concept = byId.get(id);
    if (concept == null) return ConceptStatus.DELETED;
    if (Boolean.FALSE.equals(concept.getActive())) return ConceptStatus.RETIRED;
    return ConceptStatus.ACTIVE;
  }

  private static String ptOrNull(SnowstormConceptMini c) {
    return c == null || c.getPt() == null ? null : c.getPt().getTerm();
  }

  // A null `released` flag from Snowstorm is unexpected. Treat it as released so we
  // attempt the safer "inactivate" path rather than a destructive delete.
  private static boolean isReleased(SnowstormReferenceSetMember m) {
    return !Boolean.FALSE.equals(m.getReleased());
  }

  private static boolean isReleased(SnowstormRelationship r) {
    return !Boolean.FALSE.equals(r.getReleased());
  }

  // A null `active` flag from Snowstorm is treated as active (the safe default — we only skip a
  // component from dangling detection when it is explicitly inactive).
  private static boolean isActive(SnowstormReferenceSetMember m) {
    return !Boolean.FALSE.equals(m.getActive());
  }

  private static boolean isActive(SnowstormRelationship r) {
    return !Boolean.FALSE.equals(r.getActive());
  }

  // The three required fields a non-defining relationship must have for us to act on it. The
  // toDanglingRel helper relies on each being non-null when constructing the DTO, so the
  // invariant must be enforced here.
  private boolean isWellFormed(SnowstormRelationship r, String branch) {
    if (r.getRelationshipId() == null || r.getSourceId() == null || r.getTypeId() == null) {
      log.warning(
          "Skipping malformed non-defining relationship on branch "
              + branch
              + ": relationshipId="
              + r.getRelationshipId()
              + ", sourceId="
              + r.getSourceId()
              + ", typeId="
              + r.getTypeId());
      return false;
    }
    return true;
  }
}
