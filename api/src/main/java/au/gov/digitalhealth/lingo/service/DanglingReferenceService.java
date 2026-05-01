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
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Level;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

@Log
@Service
public class DanglingReferenceService {

  private final SnowstormClient snowstormClient;

  public DanglingReferenceService(SnowstormClient snowstormClient) {
    this.snowstormClient = snowstormClient;
  }

  public DanglingReferenceSummary detect(String branch) {
    Tuple2<List<SnowstormReferenceSetMember>, List<SnowstormRelationship>> data = fetch(branch);
    Map<String, SnowstormConceptMini> byId =
        resolveReferencedConcepts(branch, data.getT1(), data.getT2());

    List<DanglingRefsetMember> danglingMembers = new ArrayList<>();
    for (SnowstormReferenceSetMember m : data.getT1()) {
      ConceptStatus status = statusOf(m.getReferencedComponentId(), byId);
      if (status == ConceptStatus.ACTIVE) continue;
      SnowstormConceptMini refsetConcept = byId.get(m.getRefsetId());
      SnowstormConceptMini referenced = byId.get(m.getReferencedComponentId());
      danglingMembers.add(
          new DanglingRefsetMember(
              m.getMemberId(),
              m.getRefsetId(),
              ptOrNull(refsetConcept),
              m.getReferencedComponentId(),
              ptOrNull(referenced),
              status,
              isReleased(m.getReleased())));
    }

    List<DanglingNonDefiningRelationship> danglingRels = new ArrayList<>();
    for (SnowstormRelationship r : data.getT2()) {
      ConceptStatus srcStatus = statusOf(r.getSourceId(), byId);
      ConceptStatus dstStatus = statusOf(r.getDestinationId(), byId);
      if (srcStatus == ConceptStatus.ACTIVE && dstStatus == ConceptStatus.ACTIVE) continue;
      SnowstormConceptMini type = byId.get(r.getTypeId());
      SnowstormConceptMini src = byId.get(r.getSourceId());
      SnowstormConceptMini dst = byId.get(r.getDestinationId());
      danglingRels.add(
          new DanglingNonDefiningRelationship(
              r.getRelationshipId(),
              r.getTypeId(),
              ptOrNull(type),
              r.getSourceId(),
              ptOrNull(src),
              srcStatus,
              r.getDestinationId(),
              ptOrNull(dst),
              dstStatus,
              isReleased(r.getReleased())));
    }

    return new DanglingReferenceSummary(branch, danglingMembers, danglingRels);
  }

  public TidyResult tidy(String branch) {
    Tuple2<List<SnowstormReferenceSetMember>, List<SnowstormRelationship>> data = fetch(branch);
    Map<String, SnowstormConceptMini> byId =
        resolveReferencedConcepts(branch, data.getT1(), data.getT2());

    List<TidySuccess> succeeded = new ArrayList<>();
    List<TidyFailure> failed = new ArrayList<>();

    for (SnowstormReferenceSetMember m : data.getT1()) {
      if (statusOf(m.getReferencedComponentId(), byId) == ConceptStatus.ACTIVE) continue;
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

    for (SnowstormRelationship r : data.getT2()) {
      ConceptStatus srcStatus = statusOf(r.getSourceId(), byId);
      ConceptStatus dstStatus = statusOf(r.getDestinationId(), byId);
      if (srcStatus == ConceptStatus.ACTIVE && dstStatus == ConceptStatus.ACTIVE) continue;
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

  // Snowstorm's findConcepts uses repeated `conceptIds=` query params, so we batch lookups
  // to avoid blowing the request URI length budget when many ids need to be resolved.
  private static final int CONCEPT_LOOKUP_BATCH_SIZE = 200;

  private Tuple2<List<SnowstormReferenceSetMember>, List<SnowstormRelationship>> fetch(
      String branch) {
    Tuple2<List<SnowstormReferenceSetMember>, List<SnowstormRelationship>> raw =
        Mono.zip(
                snowstormClient.getRefsetMembersModifiedOnBranch(branch),
                snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(branch))
            .block();
    // A refset member's referencedComponent can be a concept, description, or relationship.
    // For dangling-reference detection we only care about concept-targeting members — language
    // and acceptability refsets target descriptions and are out of scope here, and including
    // them would also blow up the downstream concept lookup with thousands of description ids.
    List<SnowstormReferenceSetMember> conceptTargetingMembers =
        raw.getT1().stream().filter(DanglingReferenceService::referencesAConcept).toList();
    return reactor.util.function.Tuples.of(conceptTargetingMembers, raw.getT2());
  }

  private static boolean referencesAConcept(SnowstormReferenceSetMember m) {
    String id = m.getReferencedComponentId();
    return id != null && SnomedIdentifierUtil.isValid(id, PartitionIdentifier.CONCEPT);
  }

  private Map<String, SnowstormConceptMini> resolveReferencedConcepts(
      String branch,
      List<SnowstormReferenceSetMember> members,
      List<SnowstormRelationship> relationships) {
    Set<String> conceptIds = new HashSet<>();
    for (SnowstormReferenceSetMember m : members) {
      if (m.getReferencedComponentId() != null) conceptIds.add(m.getReferencedComponentId());
      if (m.getRefsetId() != null) conceptIds.add(m.getRefsetId());
    }
    for (SnowstormRelationship r : relationships) {
      if (r.getSourceId() != null) conceptIds.add(r.getSourceId());
      if (r.getDestinationId() != null) conceptIds.add(r.getDestinationId());
      if (r.getTypeId() != null) conceptIds.add(r.getTypeId());
    }
    Map<String, SnowstormConceptMini> byId = new HashMap<>();
    if (conceptIds.isEmpty()) return byId;
    List<String> all = new ArrayList<>(conceptIds);
    for (int from = 0; from < all.size(); from += CONCEPT_LOOKUP_BATCH_SIZE) {
      int to = Math.min(from + CONCEPT_LOOKUP_BATCH_SIZE, all.size());
      Set<String> batch = new HashSet<>(all.subList(from, to));
      for (SnowstormConceptMini c : snowstormClient.getConceptsById(branch, batch)) {
        byId.put(c.getConceptId(), c);
      }
    }
    return byId;
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
