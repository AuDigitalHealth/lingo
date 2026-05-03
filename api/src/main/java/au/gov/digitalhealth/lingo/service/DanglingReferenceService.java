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
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Level;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * Detects and tidies dangling reference set members and non-defining relationships authored on a
 * task branch.
 *
 * <p>Detection scope comes from the SNOMED CT authoring-traceability-service: only refset members
 * and non-defining relationships that the traceability log records as "currently present" on the
 * branch (i.e. their last non-superseded change isn't a {@code DELETE}) are considered. For each
 * such component we ask Snowstorm what its referenced concepts currently look like; anything
 * pointing at an inactive or missing concept is flagged.
 *
 * <p>Tidy mirrors the rule: released components are inactivated (we keep the audit trail);
 * unreleased components are deleted outright.
 */
@Log
@Service
public class DanglingReferenceService {

  // Refsets that legitimately reference inactive concepts as part of their normal function —
  // a member in any of these pointing to an inactive/retired concept is NOT dangling.
  // - 900000000000489007 |Concept inactivation indicator attribute value reference set|
  // - <<900000000000522004 |Historical association reference set| and its descendants
  // We hardcode the well-known SCTIDs rather than querying Snowstorm so detection is reliable
  // even if the project's view of the metadata hierarchy is incomplete.
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
          "1193550005"); // POSSIBLY REPLACED BY association reference set

  private final SnowstormClient snowstormClient;
  private final TraceabilityServiceClient traceabilityServiceClient;

  public DanglingReferenceService(
      SnowstormClient snowstormClient, TraceabilityServiceClient traceabilityServiceClient) {
    this.snowstormClient = snowstormClient;
    this.traceabilityServiceClient = traceabilityServiceClient;
  }

  public DanglingReferenceSummary detect(String branch) {
    DetectionContext ctx = collect(branch);

    List<DanglingRefsetMember> danglingMembers = new ArrayList<>();
    List<DanglingNonDefiningRelationship> danglingRels = new ArrayList<>();

    for (SnowstormReferenceSetMember m : ctx.taskMembers) {
      if (isExpectedInactiveReferenceRefset(m)) continue;
      ConceptStatus status = statusOf(m.getReferencedComponentId(), ctx.byId);
      if (status == ConceptStatus.ACTIVE) continue;
      danglingMembers.add(toDanglingMember(m, status, ctx.byId));
    }
    for (SnowstormRelationship r : ctx.taskRels) {
      if (!isWellFormed(r, branch)) continue;
      ConceptStatus srcStatus = statusOf(r.getSourceId(), ctx.byId);
      ConceptStatus dstStatus = statusOf(r.getDestinationId(), ctx.byId);
      if (srcStatus == ConceptStatus.ACTIVE && dstStatus == ConceptStatus.ACTIVE) continue;
      danglingRels.add(toDanglingRel(r, srcStatus, dstStatus, ctx.byId));
    }

    return new DanglingReferenceSummary(branch, danglingMembers, danglingRels);
  }

  public TidyResult tidy(String branch) {
    DetectionContext ctx = collect(branch);
    List<TidySuccess> succeeded = new ArrayList<>();
    List<TidyFailure> failed = new ArrayList<>();

    // Build the same member/rel set as detect() so we tidy exactly what we summarised.
    LinkedHashMap<String, SnowstormReferenceSetMember> members = new LinkedHashMap<>();
    for (SnowstormReferenceSetMember m : ctx.taskMembers) {
      if (m.getMemberId() == null) continue;
      if (isExpectedInactiveReferenceRefset(m)) continue;
      if (statusOf(m.getReferencedComponentId(), ctx.byId) == ConceptStatus.ACTIVE) continue;
      members.put(m.getMemberId(), m);
    }

    LinkedHashMap<String, SnowstormRelationship> rels = new LinkedHashMap<>();
    for (SnowstormRelationship r : ctx.taskRels) {
      if (!isWellFormed(r, branch)) continue;
      ConceptStatus s = statusOf(r.getSourceId(), ctx.byId);
      ConceptStatus d = statusOf(r.getDestinationId(), ctx.byId);
      if (s == ConceptStatus.ACTIVE && d == ConceptStatus.ACTIVE) continue;
      rels.put(r.getRelationshipId(), r);
    }

    for (SnowstormReferenceSetMember m : members.values()) {
      boolean released = isReleased(m.getReleased());
      TidyAction action = released ? TidyAction.INACTIVATED : TidyAction.DELETED;
      try {
        if (released) {
          snowstormClient.inactivateRefsetMember(branch, m);
        } else {
          snowstormClient.deleteRefsetMember(branch, m.getMemberId());
        }
        succeeded.add(new TidySuccess(TidyKind.REFSET_MEMBER, m.getMemberId(), action));
      } catch (RuntimeException e) {
        log.log(
            Level.SEVERE,
            "Tidy of refset member " + m.getMemberId() + " on branch " + branch + " failed",
            e);
        failed.add(
            new TidyFailure(TidyKind.REFSET_MEMBER, m.getMemberId(), action, errorMessage(e)));
      }
    }
    for (SnowstormRelationship r : rels.values()) {
      boolean released = isReleased(r.getReleased());
      TidyAction action = released ? TidyAction.INACTIVATED : TidyAction.DELETED;
      try {
        if (released) {
          snowstormClient.inactivateRelationship(branch, r);
        } else {
          snowstormClient.deleteRelationship(branch, r.getRelationshipId());
        }
        succeeded.add(
            new TidySuccess(TidyKind.NON_DEFINING_RELATIONSHIP, r.getRelationshipId(), action));
      } catch (RuntimeException e) {
        log.log(
            Level.SEVERE,
            "Tidy of non-defining relationship "
                + r.getRelationshipId()
                + " on branch "
                + branch
                + " failed",
            e);
        failed.add(
            new TidyFailure(
                TidyKind.NON_DEFINING_RELATIONSHIP,
                r.getRelationshipId(),
                action,
                errorMessage(e)));
      }
    }
    return new TidyResult(succeeded, failed);
  }

  // Holds everything detect/tidy need after the traceability + Snowstorm fan-out.
  private static final class DetectionContext {
    final List<SnowstormReferenceSetMember> taskMembers;
    final List<SnowstormRelationship> taskRels;
    final Map<String, SnowstormConceptMini> byId;

    DetectionContext(
        List<SnowstormReferenceSetMember> taskMembers,
        List<SnowstormRelationship> taskRels,
        Map<String, SnowstormConceptMini> byId) {
      this.taskMembers = taskMembers;
      this.taskRels = taskRels;
      this.byId = byId;
    }
  }

  private DetectionContext collect(String branch) {
    // Phase 1: parallel — fetch every unreleased active refset member and non-defining
    // relationship visible on the branch, plus the traceability log of what was actually
    // authored on it. The traceability log is the authoritative scope; the Snowstorm queries
    // give us the current state of those components.
    var phase1 =
        Mono.zip(
                snowstormClient.getUnreleasedActiveRefsetMembersOnBranch(branch),
                snowstormClient.getUnreleasedActiveNonDefiningRelationshipsOnBranch(branch),
                Mono.fromSupplier(
                    () -> traceabilityServiceClient.getContentChangeActivitiesOnBranch(branch)))
            .block();

    List<SnowstormReferenceSetMember> allActiveMembers = phase1.getT1();
    List<SnowstormRelationship> allActiveRels = phase1.getT2();
    BranchChangeSummary summary = BranchChangeSummary.from(phase1.getT3());

    // Phase 2: intersect the active components on the branch with the traceability scope. A
    // member that's active+unreleased on the branch but doesn't appear as still-present in the
    // traceability log was inherited (not authored on this task) — out of scope.
    Set<String> taskMemberIds = summary.refsetMemberIdsStillOnBranch();
    Set<String> taskRelationshipIds = summary.relationshipIdsStillOnBranch();
    List<SnowstormReferenceSetMember> taskMembers =
        allActiveMembers.stream()
            .filter(m -> m.getMemberId() != null && taskMemberIds.contains(m.getMemberId()))
            .filter(DanglingReferenceService::referencesAConcept)
            .toList();
    List<SnowstormRelationship> taskRels =
        allActiveRels.stream()
            .filter(
                r ->
                    r.getRelationshipId() != null
                        && taskRelationshipIds.contains(r.getRelationshipId()))
            .toList();

    // Phase 3: bulk-fetch the referenced concepts (refset, referencedComponent, source,
    // destination, type) so we can determine each component's status. Synchronous — runs on the
    // request thread because getConceptsByIdViaSearch depends on request-scoped beans.
    Set<String> referencedIds = collectReferencedConceptIds(taskMembers, taskRels);
    Map<String, SnowstormConceptMini> byId = new HashMap<>();
    if (!referencedIds.isEmpty()) {
      for (SnowstormConceptMini c :
          snowstormClient.getConceptsByIdViaSearch(branch, referencedIds)) {
        if (c.getConceptId() != null) byId.put(c.getConceptId(), c);
      }
    }

    return new DetectionContext(taskMembers, taskRels, byId);
  }

  private static boolean referencesAConcept(SnowstormReferenceSetMember m) {
    String id = m.getReferencedComponentId();
    return id != null && SnomedIdentifierUtil.isValid(id, PartitionIdentifier.CONCEPT);
  }

  // True for members whose refset is one of the well-known refsets that legitimately point to
  // inactive concepts. Such members must never be flagged as dangling — that would cause us to
  // delete the very metadata that records why a concept was retired.
  private static boolean isExpectedInactiveReferenceRefset(SnowstormReferenceSetMember m) {
    return m.getRefsetId() != null && EXPECTED_INACTIVE_REFERENCE_REFSETS.contains(m.getRefsetId());
  }

  private static Set<String> collectReferencedConceptIds(
      List<SnowstormReferenceSetMember> members, List<SnowstormRelationship> relationships) {
    Set<String> ids = new HashSet<>();
    for (SnowstormReferenceSetMember m : members) {
      if (m.getReferencedComponentId() != null) ids.add(m.getReferencedComponentId());
      if (m.getRefsetId() != null) ids.add(m.getRefsetId());
    }
    for (SnowstormRelationship r : relationships) {
      if (r.getSourceId() != null) ids.add(r.getSourceId());
      if (r.getDestinationId() != null) ids.add(r.getDestinationId());
      if (r.getTypeId() != null) ids.add(r.getTypeId());
    }
    return ids;
  }

  private DanglingRefsetMember toDanglingMember(
      SnowstormReferenceSetMember m, ConceptStatus status, Map<String, SnowstormConceptMini> byId) {
    SnowstormConceptMini refset = byId.get(m.getRefsetId());
    SnowstormConceptMini referenced = byId.get(m.getReferencedComponentId());
    return new DanglingRefsetMember(
        m.getMemberId(),
        m.getRefsetId(),
        ptOrNull(refset),
        m.getReferencedComponentId(),
        ptOrNull(referenced),
        status,
        isReleased(m.getReleased()));
  }

  private DanglingNonDefiningRelationship toDanglingRel(
      SnowstormRelationship r,
      ConceptStatus srcStatus,
      ConceptStatus dstStatus,
      Map<String, SnowstormConceptMini> byId) {
    SnowstormConceptMini type = byId.get(r.getTypeId());
    SnowstormConceptMini src = byId.get(r.getSourceId());
    SnowstormConceptMini dst = byId.get(r.getDestinationId());
    return new DanglingNonDefiningRelationship(
        r.getRelationshipId(),
        r.getTypeId(),
        ptOrNull(type),
        r.getSourceId(),
        ptOrNull(src),
        srcStatus,
        r.getDestinationId(),
        ptOrNull(dst),
        dstStatus,
        isReleased(r.getReleased()));
  }

  private boolean isWellFormed(SnowstormRelationship r, String branch) {
    if (r.getRelationshipId() == null || r.getTypeId() == null || r.getSourceId() == null) {
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
  private static boolean isReleased(Boolean released) {
    return !Boolean.FALSE.equals(released);
  }

  private static String errorMessage(Throwable e) {
    String msg = e.getMessage();
    return msg != null && !msg.isBlank() ? msg : e.getClass().getSimpleName();
  }
}
