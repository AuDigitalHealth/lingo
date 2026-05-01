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
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * Detects and tidies dangling reference set members and non-defining relationships left behind by
 * authoring activity on a task branch.
 *
 * <p>Two scenarios are checked, both in a single end-to-end flow:
 *
 * <ul>
 *   <li><b>Scenario 1</b> — items new on this task whose referenced concept is missing or inactive.
 *       The members and relationships are unreleased on this task, so the tidy action is to delete
 *       them outright.
 *   <li><b>Scenario 2</b> — concepts retired on this task. Any active refset member or non-defining
 *       relationship referencing them (on any path the task can see) is dangling. If the
 *       member/relationship was previously released it is inactivated; if not, it is deleted.
 * </ul>
 *
 * <p>Three top-level Snowstorm queries (members modified on task, non-defining relationships
 * modified on task, concepts modified on task) run in parallel via {@link Mono#zip}; the scenario-1
 * concept resolution and the two scenario-2 reference queries also run in parallel.
 */
@Log
@Service
public class DanglingReferenceService {

  private final SnowstormClient snowstormClient;

  public DanglingReferenceService(SnowstormClient snowstormClient) {
    this.snowstormClient = snowstormClient;
  }

  public DanglingReferenceSummary detect(String branch) {
    DetectionContext ctx = collect(branch);

    List<DanglingRefsetMember> danglingMembers = new ArrayList<>();
    List<DanglingNonDefiningRelationship> danglingRels = new ArrayList<>();

    // Scenario 1 — items new on this task referencing a missing/inactive concept.
    for (SnowstormReferenceSetMember m : ctx.taskMembers) {
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

    // Scenario 2 — items anywhere on the branch referencing a concept retired on this task.
    Set<String> seenMembers =
        danglingMembers.stream().map(DanglingRefsetMember::memberId).collect(Collectors.toSet());
    for (SnowstormReferenceSetMember m : ctx.scenario2Members) {
      if (m.getMemberId() == null || !seenMembers.add(m.getMemberId())) continue;
      // referencedComponentId is one of the retired concepts on task → status RETIRED.
      danglingMembers.add(toDanglingMember(m, ConceptStatus.RETIRED, ctx.byId));
    }
    Set<String> seenRels =
        danglingRels.stream()
            .map(DanglingNonDefiningRelationship::relationshipId)
            .collect(Collectors.toSet());
    for (SnowstormRelationship r : ctx.scenario2Rels) {
      if (!isWellFormed(r, branch)) continue;
      if (!seenRels.add(r.getRelationshipId())) continue;
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

    // Build the same combined member/rel sets as detect() so we tidy exactly what we summarised.
    LinkedHashMap<String, SnowstormReferenceSetMember> members = new LinkedHashMap<>();
    for (SnowstormReferenceSetMember m : ctx.taskMembers) {
      if (m.getMemberId() == null) continue;
      if (statusOf(m.getReferencedComponentId(), ctx.byId) == ConceptStatus.ACTIVE) continue;
      members.put(m.getMemberId(), m);
    }
    for (SnowstormReferenceSetMember m : ctx.scenario2Members) {
      if (m.getMemberId() == null) continue;
      members.putIfAbsent(m.getMemberId(), m);
    }

    LinkedHashMap<String, SnowstormRelationship> rels = new LinkedHashMap<>();
    for (SnowstormRelationship r : ctx.taskRels) {
      if (!isWellFormed(r, branch)) continue;
      ConceptStatus s = statusOf(r.getSourceId(), ctx.byId);
      ConceptStatus d = statusOf(r.getDestinationId(), ctx.byId);
      if (s == ConceptStatus.ACTIVE && d == ConceptStatus.ACTIVE) continue;
      rels.put(r.getRelationshipId(), r);
    }
    for (SnowstormRelationship r : ctx.scenario2Rels) {
      if (!isWellFormed(r, branch)) continue;
      rels.putIfAbsent(r.getRelationshipId(), r);
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

  // Holds everything detect/tidy need after the parallel Snowstorm fan-out.
  private static final class DetectionContext {
    final List<SnowstormReferenceSetMember> taskMembers;
    final List<SnowstormRelationship> taskRels;
    final List<SnowstormReferenceSetMember> scenario2Members;
    final List<SnowstormRelationship> scenario2Rels;
    final Map<String, SnowstormConceptMini> byId;

    DetectionContext(
        List<SnowstormReferenceSetMember> taskMembers,
        List<SnowstormRelationship> taskRels,
        List<SnowstormReferenceSetMember> scenario2Members,
        List<SnowstormRelationship> scenario2Rels,
        Map<String, SnowstormConceptMini> byId) {
      this.taskMembers = taskMembers;
      this.taskRels = taskRels;
      this.scenario2Members = scenario2Members;
      this.scenario2Rels = scenario2Rels;
      this.byId = byId;
    }
  }

  private DetectionContext collect(String branch) {
    // Phase 1: three parallel queries against the task branch.
    return Mono.zip(
            snowstormClient.getRefsetMembersModifiedOnBranch(branch),
            snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(branch),
            snowstormClient.getConceptsModifiedOnBranch(branch))
        .flatMap(
            t -> {
              List<SnowstormReferenceSetMember> taskMembers =
                  t.getT1().stream().filter(DanglingReferenceService::referencesAConcept).toList();
              List<SnowstormRelationship> taskRels = t.getT2();
              List<SnowstormConceptMini> taskConcepts = t.getT3();

              Set<String> retiredOnTaskIds =
                  taskConcepts.stream()
                      .filter(c -> Boolean.FALSE.equals(c.getActive()))
                      .map(SnowstormConceptMini::getConceptId)
                      .filter(java.util.Objects::nonNull)
                      .collect(Collectors.toSet());

              // Phase 2: in parallel — resolve scenario 1 concepts, fetch scenario 2 references.
              Set<String> scenario1Ids = collectReferencedConceptIds(taskMembers, taskRels);
              Mono<List<SnowstormConceptMini>> scenario1Concepts =
                  Mono.fromCallable(
                          () -> snowstormClient.getConceptsByIdViaSearch(branch, scenario1Ids))
                      .subscribeOn(Schedulers.boundedElastic());
              Mono<List<SnowstormReferenceSetMember>> scenario2Members =
                  snowstormClient.findActiveRefsetMembersForConcepts(branch, retiredOnTaskIds);
              Mono<List<SnowstormRelationship>> scenario2Rels =
                  snowstormClient.findActiveNonDefiningRelationshipsForConcepts(
                      branch, retiredOnTaskIds);

              return Mono.zip(scenario1Concepts, scenario2Members, scenario2Rels)
                  .flatMap(
                      t2 -> {
                        Map<String, SnowstormConceptMini> byId = new HashMap<>();
                        for (SnowstormConceptMini c : taskConcepts) {
                          byId.put(c.getConceptId(), c);
                        }
                        for (SnowstormConceptMini c : t2.getT1()) {
                          byId.put(c.getConceptId(), c);
                        }
                        // Scenario 2 reference items may point at concepts not yet in byId (e.g.
                        // a relationship destination is some other concept). Resolve those too.
                        Set<String> extra = collectExtraIds(t2.getT2(), t2.getT3(), byId.keySet());
                        Mono<List<SnowstormConceptMini>> extras =
                            extra.isEmpty()
                                ? Mono.just(List.of())
                                : Mono.fromCallable(
                                        () ->
                                            snowstormClient.getConceptsByIdViaSearch(branch, extra))
                                    .subscribeOn(Schedulers.boundedElastic());
                        return extras.map(
                            xs -> {
                              for (SnowstormConceptMini c : xs) byId.put(c.getConceptId(), c);
                              return new DetectionContext(
                                  taskMembers, taskRels, t2.getT2(), t2.getT3(), byId);
                            });
                      });
            })
        .block();
  }

  private static boolean referencesAConcept(SnowstormReferenceSetMember m) {
    String id = m.getReferencedComponentId();
    return id != null && SnomedIdentifierUtil.isValid(id, PartitionIdentifier.CONCEPT);
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

  private static Set<String> collectExtraIds(
      List<SnowstormReferenceSetMember> members,
      List<SnowstormRelationship> rels,
      Set<String> already) {
    Set<String> extra = new HashSet<>();
    for (SnowstormReferenceSetMember m : members) {
      if (m.getRefsetId() != null && !already.contains(m.getRefsetId())) extra.add(m.getRefsetId());
    }
    for (SnowstormRelationship r : rels) {
      if (r.getTypeId() != null && !already.contains(r.getTypeId())) extra.add(r.getTypeId());
      if (r.getSourceId() != null && !already.contains(r.getSourceId())) extra.add(r.getSourceId());
      if (r.getDestinationId() != null && !already.contains(r.getDestinationId()))
        extra.add(r.getDestinationId());
    }
    return extra;
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
