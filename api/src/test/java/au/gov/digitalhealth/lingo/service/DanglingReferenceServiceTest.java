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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
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
import au.gov.digitalhealth.lingo.traceability.Activity;
import au.gov.digitalhealth.lingo.traceability.ComponentChange;
import au.gov.digitalhealth.lingo.traceability.ComponentChange.ChangeType;
import au.gov.digitalhealth.lingo.traceability.ComponentChange.ComponentType;
import au.gov.digitalhealth.lingo.traceability.ConceptChange;
import au.gov.digitalhealth.lingo.traceability.TraceabilityServiceClient;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class DanglingReferenceServiceTest {

  private static final String BRANCH = "MAIN/SNOMIO-PROJECT/SNOMIO-1";

  private static final org.apache.commons.validator.routines.checkdigit.VerhoeffCheckDigit
      VERHOEFF = new org.apache.commons.validator.routines.checkdigit.VerhoeffCheckDigit();

  // Real-format SCTIDs with valid Verhoeff checksums. Partition digit 0 = concept, 1 = description.
  private static final String C_RETIRED = sctid("1000", "0");
  private static final String C_DELETED = sctid("2000", "0");
  private static final String C_ACTIVE = sctid("3000", "0");
  private static final String C_REFSET = sctid("4000", "0");
  private static final String C_TYPE = sctid("5000", "0");

  @SuppressWarnings("unused")
  private static final String C_OTHER = sctid("6000", "0");

  // A description-format SCTID — must be filtered out by detect/tidy.
  private static final String D_DESCRIPTION = sctid("7000", "1");

  private static String sctid(String prefix, String partition) {
    String body =
        prefix + "0" + partition; // <prefix>0<partition>, partition: 0=concept,1=description
    try {
      return body + VERHOEFF.calculate(body);
    } catch (org.apache.commons.validator.routines.checkdigit.CheckDigitException e) {
      throw new RuntimeException(e);
    }
  }

  @Mock(strictness = org.mockito.Mock.Strictness.LENIENT)
  SnowstormClient snowstormClient;

  @Mock(strictness = org.mockito.Mock.Strictness.LENIENT)
  TraceabilityServiceClient traceabilityServiceClient;

  @InjectMocks DanglingReferenceService service;

  @org.junit.jupiter.api.BeforeEach
  void stubDefaultEmptyResponses() {
    // Default everything to empty so each test can opt in to populated lists. Without these
    // defaults the detect() Mono.zip NPEs on the unstubbed methods.
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of()));
    when(snowstormClient.fetchRelationshipsByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of()));
    when(snowstormClient.findActiveRefsetMembersForConcepts(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of()));
    when(snowstormClient.findActiveNonDefiningRelationshipsForConcepts(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of()));
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(List.of());
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any())).thenReturn(List.of());
  }

  // Build a single-activity log scoping the named members and relationships as still-present
  // (last change CREATE, not subsequently DELETEd).
  private static List<Activity> traceabilityScope(
      List<String> memberIds, List<String> relationshipIds) {
    List<ComponentChange> changes = new ArrayList<>();
    for (String memberId : memberIds) {
      changes.add(
          new ComponentChange(
              memberId, ChangeType.CREATE, ComponentType.REFERENCE_SET_MEMBER, null, true, false));
    }
    for (String relId : relationshipIds) {
      changes.add(
          new ComponentChange(
              relId, ChangeType.CREATE, ComponentType.RELATIONSHIP, null, true, false));
    }
    return List.of(
        new Activity(
            "act-1",
            "tester",
            BRANCH,
            BRANCH,
            OffsetDateTime.parse("2026-05-01T00:00:00Z"),
            "CONTENT_CHANGE",
            List.of(new ConceptChange("concept-1", changes))));
  }

  private static SnowstormConceptMini concept(String id, Boolean active, String pt) {
    SnowstormConceptMini c = new SnowstormConceptMini().conceptId(id).active(active);
    if (pt != null) c.setPt(new SnowstormTermLangPojo().term(pt));
    return c;
  }

  private static SnowstormReferenceSetMember member(
      String id, String refsetId, String refConceptId, boolean released) {
    return new SnowstormReferenceSetMember()
        .memberId(id)
        .refsetId(refsetId)
        .referencedComponentId(refConceptId)
        .released(released)
        .active(true);
  }

  private static SnowstormRelationship relationship(
      String id, String src, String dst, String type, boolean released) {
    return new SnowstormRelationship()
        .relationshipId(id)
        .sourceId(src)
        .destinationId(dst)
        .typeId(type)
        .released(released)
        .active(true);
  }

  @Test
  void detect_returnsEmptySummaryWhenTraceabilityIsEmpty() {
    // No traceability activities at all → empty id set passed to fetchRefsetMembersByIds /
    // fetchRelationshipsByIds, no scenario-B fan-out, no concepts looked up. The default mock
    // setup already returns empty for all four; assert the summary is empty.
    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers()).isEmpty();
    assertThat(summary.danglingNonDefiningRelationships()).isEmpty();
  }

  @Test
  void detect_flagsRefsetMemberReferencingRetiredConcept() {
    SnowstormReferenceSetMember m = member("m1", C_REFSET, C_RETIRED, true);
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of("m1"), List.of()));
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(m)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(
            List.of(
                concept(C_RETIRED, false, "Retired thing"), concept(C_REFSET, true, "My refset")));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers()).hasSize(1);
    DanglingRefsetMember d = summary.danglingRefsetMembers().get(0);
    assertThat(d.memberId()).isEqualTo("m1");
    assertThat(d.refsetPt()).isEqualTo("My refset");
    assertThat(d.referencedConceptStatus()).isEqualTo(ConceptStatus.RETIRED);
    assertThat(d.referencedConceptPt()).isEqualTo("Retired thing");
    assertThat(d.released()).isTrue();
  }

  @Test
  void detect_flagsRefsetMemberReferencingDeletedConcept() {
    SnowstormReferenceSetMember m = member("m2", C_REFSET, C_DELETED, false);
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of("m2"), List.of()));
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(m)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(List.of(concept(C_REFSET, true, "My refset")));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers()).hasSize(1);
    DanglingRefsetMember d = summary.danglingRefsetMembers().get(0);
    assertThat(d.referencedConceptStatus()).isEqualTo(ConceptStatus.DELETED);
    assertThat(d.referencedConceptPt()).isNull();
    assertThat(d.refsetPt()).isEqualTo("My refset");
    assertThat(d.released()).isFalse();
  }

  @Test
  void detect_filtersOutMembersWhoseReferencedComponentIsADescription() {
    // Language and acceptability refsets target descriptions, not concepts. Including these in
    // the lookup blew up the URL length on real branches with hundreds of authoring changes.
    SnowstormReferenceSetMember conceptMember = member("m-concept", C_REFSET, C_RETIRED, true);
    SnowstormReferenceSetMember descriptionMember =
        member("m-description", C_REFSET, D_DESCRIPTION, true);
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of("m-concept", "m-description"), List.of()));
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(conceptMember, descriptionMember)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(List.of(concept(C_RETIRED, false, null), concept(C_REFSET, true, null)));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers())
        .as("description-targeting members must be filtered out before detection")
        .extracting(DanglingRefsetMember::memberId)
        .containsExactly("m-concept");
  }

  @Test
  void detect_skipsMembersInExpectedInactiveReferenceRefsets() {
    // Inactivation indicator and historical association refsets reference inactive concepts by
    // design — flagging them would delete the very metadata that records why a concept was
    // retired. They must always be skipped, even when the referenced concept is retired.
    SnowstormReferenceSetMember inactivationIndicator =
        member("m-ii", "900000000000489007", C_RETIRED, false);
    SnowstormReferenceSetMember sameAsAssociation =
        member("m-sameas", "900000000000527005", C_RETIRED, false);
    // An OWL axiom member is definitional (owned by classification) — even active and pointing at
    // a retired concept it must never be flagged as a dangling reference to tidy.
    SnowstormReferenceSetMember owlAxiom = member("m-owl", "733073007", C_RETIRED, true);
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of("m-ii", "m-sameas", "m-owl"), List.of()));
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(inactivationIndicator, sameAsAssociation, owlAxiom)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(List.of(concept(C_RETIRED, false, "Retired thing")));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers()).isEmpty();
  }

  @Test
  void detect_acrossActivities_createThenDeleteNetsToOutOfScope() {
    // The IEDC-7374 case in miniature: a member is CREATEd in activity A and DELETEd in
    // activity B. Traceability says it's gone, so collect() never asks Snowstorm for it.
    List<Activity> twoActivities =
        List.of(
            new Activity(
                "act-create",
                "tester",
                BRANCH,
                BRANCH,
                OffsetDateTime.parse("2026-05-01T00:00:00Z"),
                "CONTENT_CHANGE",
                List.of(
                    new ConceptChange(
                        "concept-1",
                        List.of(
                            new ComponentChange(
                                "m-zombie",
                                ChangeType.CREATE,
                                ComponentType.REFERENCE_SET_MEMBER,
                                null,
                                true,
                                false))))),
            new Activity(
                "act-delete",
                "tester",
                BRANCH,
                BRANCH,
                OffsetDateTime.parse("2026-05-01T00:01:00Z"),
                "CONTENT_CHANGE",
                List.of(
                    new ConceptChange(
                        "concept-1",
                        List.of(
                            new ComponentChange(
                                "m-zombie",
                                ChangeType.DELETE,
                                ComponentType.REFERENCE_SET_MEMBER,
                                null,
                                true,
                                false))))));
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(twoActivities);

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers())
        .as("create-then-delete must net to out-of-scope")
        .isEmpty();
    // The id should never have been fetched — traceability said it's gone.
    verify(snowstormClient).fetchRefsetMembersByIds(BRANCH, java.util.Set.of());
  }

  @Test
  void detect_ignoresInheritedMemberNotInTraceabilityScope() {
    // No traceability activity → no fetch by id → inherited members on the branch are out of
    // scope. The new architecture doesn't even pull the unreleased+active surface, so there's
    // no Snowstorm interaction to mock — the empty traceability log is enough.
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(List.of()); // empty traceability — task authored nothing

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers()).isEmpty();
    verify(snowstormClient).fetchRefsetMembersByIds(BRANCH, java.util.Set.of());
  }

  @Test
  void detect_scenarioB_conceptInactivatedOnTask_flagsInheritedReferences() {
    // The task INACTIVATEd a pre-existing concept. Inherited refset members and non-defining
    // relationships referencing it (which the task didn't itself touch) need cleanup, so the
    // scenario-B fan-out via findActiveRefsetMembersForConcepts /
    // findActiveNonDefiningRelationshipsForConcepts should pull them in and detect should flag
    // them as dangling.
    Activity inactivateActivity =
        new Activity(
            "act-inactivate",
            "tester",
            BRANCH,
            BRANCH,
            OffsetDateTime.parse("2026-05-01T00:00:00Z"),
            "CONTENT_CHANGE",
            List.of(
                new ConceptChange(
                    C_RETIRED,
                    List.of(
                        new ComponentChange(
                            C_RETIRED,
                            ChangeType.INACTIVATE,
                            ComponentType.CONCEPT,
                            null,
                            true,
                            false)))));
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(List.of(inactivateActivity));

    SnowstormReferenceSetMember inheritedMember = member("m-inherited", C_REFSET, C_RETIRED, true);
    SnowstormRelationship inheritedRel =
        relationship("r-inherited", C_RETIRED, C_ACTIVE, C_TYPE, true);
    when(snowstormClient.findActiveRefsetMembersForConcepts(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(inheritedMember)));
    when(snowstormClient.findActiveNonDefiningRelationshipsForConcepts(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(inheritedRel)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(
            List.of(
                concept(C_RETIRED, false, "Retired thing"),
                concept(C_REFSET, true, "My refset"),
                concept(C_ACTIVE, true, "Other end"),
                concept(C_TYPE, true, "Type")));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers())
        .extracting(DanglingRefsetMember::memberId)
        .containsExactly("m-inherited");
    assertThat(summary.danglingNonDefiningRelationships())
        .extracting(DanglingNonDefiningRelationship::relationshipId)
        .containsExactly("r-inherited");
    // Verify the fan-out was driven by the right id set: the inactivated concept.
    verify(snowstormClient).findActiveRefsetMembersForConcepts(BRANCH, java.util.Set.of(C_RETIRED));
    verify(snowstormClient)
        .findActiveNonDefiningRelationshipsForConcepts(BRANCH, java.util.Set.of(C_RETIRED));
  }

  @Test
  void detect_conceptInactivatedAsTraceabilityUpdate_iedc7423() {
    // IEDC-7423 end to end. A VTM (here C_RETIRED) is retired in the Authoring Platform. The
    // traceability service records that inactivation as a CONCEPT *UPDATE* (active flag flipped),
    // never an INACTIVATE — and also logs the retire's effect on the concept's own OWL axiom
    // member as an UPDATE. The AP does NOT touch the concept's other refset memberships or its
    // non-defining relationships, so those are inherited and only reachable via the scenario-B
    // fan-out.
    //
    // Expected after the fix:
    //   * the inherited VTM-refset membership and the inherited "Has NMPC product type"
    //     non-defining relationship ARE flagged (the UPDATE concept is recognised as inactive via
    //     Snowstorm's status, re-enabling the fan-out), and
    //   * the concept's own OWL axiom member is NOT flagged (it's inactive and definitional).
    Activity retireAsUpdate =
        new Activity(
            "act-retire",
            "sdoyle1",
            BRANCH,
            BRANCH,
            OffsetDateTime.parse("2026-06-08T09:37:41Z"),
            "CONTENT_CHANGE",
            List.of(
                new ConceptChange(
                    C_RETIRED,
                    List.of(
                        new ComponentChange(
                            "m-owl",
                            ChangeType.UPDATE,
                            ComponentType.REFERENCE_SET_MEMBER,
                            "733073007",
                            true,
                            false),
                        new ComponentChange(
                            C_RETIRED,
                            ChangeType.UPDATE, // real traceability: inactivation is an UPDATE
                            ComponentType.CONCEPT,
                            null,
                            true,
                            false)))));
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(List.of(retireAsUpdate));

    // Source 1 (authored on task): the concept's own OWL axiom member, now inactive.
    SnowstormReferenceSetMember owlAxiom =
        new SnowstormReferenceSetMember()
            .memberId("m-owl")
            .refsetId("733073007")
            .referencedComponentId(C_RETIRED)
            .released(true)
            .active(false);
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(owlAxiom)));

    // Source 2 (inherited references the AP left behind): the VTM-refset membership and the
    // Has NMPC product type relationship, both still active and pointing at the retired concept.
    SnowstormReferenceSetMember vtmMember = member("m-vtm", C_REFSET, C_RETIRED, true);
    SnowstormRelationship nmpcRel = relationship("r-nmpc", C_RETIRED, C_ACTIVE, C_TYPE, true);
    when(snowstormClient.findActiveRefsetMembersForConcepts(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(vtmMember)));
    when(snowstormClient.findActiveNonDefiningRelationshipsForConcepts(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(nmpcRel)));

    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(
            List.of(
                concept(C_RETIRED, false, "Quizartinib"),
                concept(C_REFSET, true, "VTM reference set"),
                concept(C_ACTIVE, true, "Other end"),
                concept(C_TYPE, true, "Has NMPC product type")));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    // The fan-out ran for the concept whose inactivation was only an UPDATE in traceability.
    verify(snowstormClient).findActiveRefsetMembersForConcepts(BRANCH, java.util.Set.of(C_RETIRED));
    verify(snowstormClient)
        .findActiveNonDefiningRelationshipsForConcepts(BRANCH, java.util.Set.of(C_RETIRED));

    // Inherited references are flagged; the definitional/inactive OWL axiom member is not.
    assertThat(summary.danglingRefsetMembers())
        .extracting(DanglingRefsetMember::memberId)
        .containsExactly("m-vtm");
    assertThat(summary.danglingRefsetMembers().get(0).refsetPt()).isEqualTo("VTM reference set");
    assertThat(summary.danglingNonDefiningRelationships())
        .extracting(DanglingNonDefiningRelationship::relationshipId)
        .containsExactly("r-nmpc");
  }

  @Test
  void detect_conceptDeletedOnTask_flagsInheritedReferencesViaFanOut() {
    // A concept the task changed that Snowstorm no longer returns at all (deleted, not merely
    // retired) must still drive the scenario-B fan-out: statusOf treats an absent concept as
    // DELETED, which is != ACTIVE, so inactiveOrMissing includes it and the inherited reference is
    // flagged.
    Activity changed =
        new Activity(
            "act-del",
            "tester",
            BRANCH,
            BRANCH,
            OffsetDateTime.parse("2026-05-01T00:00:00Z"),
            "CONTENT_CHANGE",
            List.of(
                new ConceptChange(
                    C_DELETED,
                    List.of(
                        new ComponentChange(
                            C_DELETED,
                            ChangeType.UPDATE,
                            ComponentType.CONCEPT,
                            null,
                            true,
                            false)))));
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(List.of(changed));

    SnowstormReferenceSetMember inheritedMember = member("m-inh", C_REFSET, C_DELETED, true);
    when(snowstormClient.findActiveRefsetMembersForConcepts(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(inheritedMember)));
    // C_DELETED is deliberately absent from the concept fetch → statusOf treats it as DELETED.
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(List.of(concept(C_REFSET, true, "My refset")));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    // The fan-out was seeded by the deleted (absent) concept.
    verify(snowstormClient).findActiveRefsetMembersForConcepts(BRANCH, java.util.Set.of(C_DELETED));
    assertThat(summary.danglingRefsetMembers())
        .extracting(DanglingRefsetMember::memberId)
        .containsExactly("m-inh");
    assertThat(summary.danglingRefsetMembers().get(0).referencedConceptStatus())
        .isEqualTo(ConceptStatus.DELETED);
  }

  @Test
  void detect_skipsInactiveMemberEvenWhenReferencedConceptRetired() {
    // An already-inactive member is not a dangling reference, even in an ordinary refset pointing
    // at a retired concept — an inactive member referencing an inactive concept is a consistent
    // end state, and re-flagging it would have us try to "tidy" something already tidied.
    SnowstormReferenceSetMember inactiveMember =
        new SnowstormReferenceSetMember()
            .memberId("m-inactive")
            .refsetId(C_REFSET)
            .referencedComponentId(C_RETIRED)
            .released(true)
            .active(false);
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of("m-inactive"), List.of()));
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(inactiveMember)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(
            List.of(
                concept(C_RETIRED, false, "Retired thing"), concept(C_REFSET, true, "My refset")));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers()).isEmpty();
  }

  @Test
  void detect_dedupesMembersInBothAuthoredAndScenarioBSets() {
    // A member can show up in both fetches: authored on the task (fetchRefsetMembersByIds) AND
    // referencing a concept the task inactivated (findActiveRefsetMembersForConcepts). The merge
    // must dedupe by memberId so the dangling list doesn't carry duplicates AND the authored-on-
    // task copy must win — its bookkeeping (e.g. released flag drives whether tidy inactivates or
    // deletes) is what the audit log surfaces. Distinguish the two copies by `released` so the
    // assertion can prove which one made it through.
    SnowstormReferenceSetMember authored = member("m-dual", C_REFSET, C_RETIRED, true);
    SnowstormReferenceSetMember referencingInactivated =
        member("m-dual", C_REFSET, C_RETIRED, false);
    Activity activity =
        new Activity(
            "act-1",
            "tester",
            BRANCH,
            BRANCH,
            OffsetDateTime.parse("2026-05-01T00:00:00Z"),
            "CONTENT_CHANGE",
            List.of(
                new ConceptChange(
                    C_RETIRED,
                    List.of(
                        new ComponentChange(
                            "m-dual",
                            ChangeType.CREATE,
                            ComponentType.REFERENCE_SET_MEMBER,
                            null,
                            true,
                            false),
                        new ComponentChange(
                            C_RETIRED,
                            ChangeType.INACTIVATE,
                            ComponentType.CONCEPT,
                            null,
                            true,
                            false)))));
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(List.of(activity));
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(authored)));
    when(snowstormClient.findActiveRefsetMembersForConcepts(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(referencingInactivated)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(
            List.of(
                concept(C_RETIRED, false, "Retired thing"), concept(C_REFSET, true, "My refset")));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers())
        .as("merge must dedupe by memberId AND keep the authored-on-task copy")
        .extracting(DanglingRefsetMember::memberId, DanglingRefsetMember::released)
        .containsExactly(tuple("m-dual", true));
  }

  @Test
  void detect_ignoresRefsetMemberWhereReferencedConceptIsActive() {
    SnowstormReferenceSetMember m = member("m3", C_REFSET, C_ACTIVE, true);
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of("m3"), List.of()));
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(m)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(List.of(concept(C_ACTIVE, true, null), concept(C_REFSET, true, null)));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers()).isEmpty();
  }

  @Test
  void detect_handlesNonDefiningRelationshipWithNullDestination() {
    // Concrete-value relationships have a non-null sourceId/typeId but a null destinationId.
    // The DTO must accept this and the source's RETIRED status must still flag it as dangling.
    SnowstormRelationship rel =
        new SnowstormRelationship()
            .relationshipId("r-concrete")
            .sourceId(C_RETIRED)
            .destinationId(null)
            .typeId(C_TYPE)
            .released(false)
            .active(true);
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of(), List.of("r-concrete")));
    when(snowstormClient.fetchRelationshipsByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(rel)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(List.of(concept(C_RETIRED, false, null), concept(C_TYPE, true, null)));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingNonDefiningRelationships()).hasSize(1);
    DanglingNonDefiningRelationship d = summary.danglingNonDefiningRelationships().get(0);
    assertThat(d.destinationId()).isNull();
    assertThat(d.destinationStatus()).isEqualTo(ConceptStatus.ACTIVE);
    assertThat(d.sourceStatus()).isEqualTo(ConceptStatus.RETIRED);
  }

  @Test
  void detect_flagsNonDefiningRelationshipWhenSourceRetired() {
    SnowstormRelationship rel = relationship("r1", C_RETIRED, C_ACTIVE, C_TYPE, false);
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of(), List.of("r1")));
    when(snowstormClient.fetchRelationshipsByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(rel)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(
            List.of(
                concept(C_RETIRED, false, "Retired source"),
                concept(C_ACTIVE, true, null),
                concept(C_TYPE, true, "My type")));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingNonDefiningRelationships()).hasSize(1);
    DanglingNonDefiningRelationship d = summary.danglingNonDefiningRelationships().get(0);
    assertThat(d.sourceStatus()).isEqualTo(ConceptStatus.RETIRED);
    assertThat(d.destinationStatus()).isEqualTo(ConceptStatus.ACTIVE);
    assertThat(d.typePt()).isEqualTo("My type");
  }

  @Test
  void detect_flagsNonDefiningRelationshipWhenDestinationDeleted() {
    SnowstormRelationship rel = relationship("r2", C_ACTIVE, C_DELETED, C_TYPE, false);
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of(), List.of("r2")));
    when(snowstormClient.fetchRelationshipsByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(rel)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(List.of(concept(C_ACTIVE, true, null), concept(C_TYPE, true, null)));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingNonDefiningRelationships()).hasSize(1);
    DanglingNonDefiningRelationship d = summary.danglingNonDefiningRelationships().get(0);
    assertThat(d.sourceStatus()).isEqualTo(ConceptStatus.ACTIVE);
    assertThat(d.destinationStatus()).isEqualTo(ConceptStatus.DELETED);
  }

  @Test
  void detect_isReadOnly_evenWithDanglingResults() throws Exception {
    SnowstormReferenceSetMember m = member("m1", C_REFSET, C_RETIRED, true);
    SnowstormRelationship rel = relationship("r1", C_RETIRED, C_ACTIVE, "t", true);
    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of("m1"), List.of("r1")));
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(m)));
    when(snowstormClient.fetchRelationshipsByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(rel)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(
            List.of(
                concept(C_RETIRED, false, null),
                concept(C_ACTIVE, true, null),
                concept(C_REFSET, true, null),
                concept("t", true, null)));

    service.detect(BRANCH);

    verify(snowstormClient, never()).deleteRefsetMember(any(), any());
    verify(snowstormClient, never()).inactivateRefsetMember(any(), any());
    verify(snowstormClient, never()).deleteRelationship(any(), any());
    verify(snowstormClient, never()).inactivateRelationship(any(), any());
  }

  @Test
  void tidy_releasedMemberInactivated_unreleasedDeleted() {
    SnowstormReferenceSetMember released = member("m-released", C_REFSET, C_RETIRED, true);
    SnowstormReferenceSetMember unreleased = member("m-unreleased", C_REFSET, C_DELETED, false);

    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of("m-released", "m-unreleased"), List.of()));
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(released, unreleased)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(List.of(concept(C_RETIRED, false, null), concept(C_REFSET, true, null)));

    TidyResult result = service.tidy(BRANCH);

    assertThat(result.failed()).isEmpty();
    assertThat(result.succeeded())
        .extracting(TidySuccess::id, TidySuccess::action)
        .containsExactlyInAnyOrder(
            tuple("m-released", TidyAction.INACTIVATED), tuple("m-unreleased", TidyAction.DELETED));
    verify(snowstormClient).inactivateRefsetMember(eq(BRANCH), eq(released));
    verify(snowstormClient).deleteRefsetMember(eq(BRANCH), eq("m-unreleased"));
  }

  @Test
  void tidy_releasedRelationshipInactivated_unreleasedDeleted() {
    SnowstormRelationship released = relationship("r-rel", C_RETIRED, C_ACTIVE, "t", true);
    SnowstormRelationship unreleased = relationship("r-unrel", C_ACTIVE, C_DELETED, "t", false);

    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of(), List.of("r-rel", "r-unrel")));
    when(snowstormClient.fetchRelationshipsByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(released, unreleased)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(List.of(concept(C_RETIRED, false, null), concept(C_ACTIVE, true, null)));

    TidyResult result = service.tidy(BRANCH);

    assertThat(result.failed()).isEmpty();
    assertThat(result.succeeded())
        .extracting(TidySuccess::id, TidySuccess::action)
        .containsExactlyInAnyOrder(
            tuple("r-rel", TidyAction.INACTIVATED), tuple("r-unrel", TidyAction.DELETED));
    verify(snowstormClient).inactivateRelationship(eq(BRANCH), eq(released));
    verify(snowstormClient).deleteRelationship(eq(BRANCH), eq("r-unrel"));
  }

  @Test
  void tidy_handlesBothKindsInOneCall() {
    SnowstormReferenceSetMember releasedMember = member("m-released", C_REFSET, C_RETIRED, true);
    SnowstormReferenceSetMember unreleasedMember =
        member("m-unreleased", C_REFSET, C_DELETED, false);
    SnowstormRelationship releasedRel = relationship("r-released", C_RETIRED, C_ACTIVE, "t", true);
    SnowstormRelationship unreleasedRel =
        relationship("r-unreleased", C_ACTIVE, C_DELETED, "t", false);

    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(
            traceabilityScope(
                List.of("m-released", "m-unreleased"), List.of("r-released", "r-unreleased")));
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(releasedMember, unreleasedMember)));
    when(snowstormClient.fetchRelationshipsByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(releasedRel, unreleasedRel)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(
            List.of(
                concept(C_RETIRED, false, null),
                concept(C_ACTIVE, true, null),
                concept(C_REFSET, true, null),
                concept("t", true, null)));

    TidyResult result = service.tidy(BRANCH);

    assertThat(result.failed()).isEmpty();
    assertThat(result.succeeded())
        .extracting(TidySuccess::kind, TidySuccess::id, TidySuccess::action)
        .containsExactlyInAnyOrder(
            tuple(TidyKind.REFSET_MEMBER, "m-released", TidyAction.INACTIVATED),
            tuple(TidyKind.REFSET_MEMBER, "m-unreleased", TidyAction.DELETED),
            tuple(TidyKind.NON_DEFINING_RELATIONSHIP, "r-released", TidyAction.INACTIVATED),
            tuple(TidyKind.NON_DEFINING_RELATIONSHIP, "r-unreleased", TidyAction.DELETED));
    verify(snowstormClient).inactivateRefsetMember(eq(BRANCH), eq(releasedMember));
    verify(snowstormClient).deleteRefsetMember(eq(BRANCH), eq("m-unreleased"));
    verify(snowstormClient).inactivateRelationship(eq(BRANCH), eq(releasedRel));
    verify(snowstormClient).deleteRelationship(eq(BRANCH), eq("r-unreleased"));
  }

  @Test
  void tidy_partialFailureRefsetMember() {
    SnowstormReferenceSetMember m1 = member("m1", C_REFSET, C_DELETED, false);
    SnowstormReferenceSetMember m2 = member("m2", C_REFSET, C_DELETED, false);

    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of("m1", "m2"), List.of()));
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(m1, m2)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any())).thenReturn(List.of());

    doAnswer(
            invocation -> {
              if ("m2".equals(invocation.getArgument(1))) {
                throw WebClientResponseException.create(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "snowstorm exploded",
                    null,
                    null,
                    null);
              }
              return null;
            })
        .when(snowstormClient)
        .deleteRefsetMember(eq(BRANCH), any());

    TidyResult result = service.tidy(BRANCH);

    assertThat(result.succeeded()).extracting(TidySuccess::id).containsExactly("m1");
    assertThat(result.failed())
        .extracting(TidyFailure::id, TidyFailure::attemptedAction)
        .containsExactly(tuple("m2", TidyAction.DELETED));
    assertThat(result.failed().get(0).errorMessage()).contains("500");
  }

  @Test
  void tidy_partialFailureRelationshipReportsError() {
    SnowstormRelationship r1 = relationship("r1", C_RETIRED, C_ACTIVE, "t", false);
    SnowstormRelationship r2 = relationship("r2", C_RETIRED, C_ACTIVE, "t", false);

    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of(), List.of("r1", "r2")));
    when(snowstormClient.fetchRelationshipsByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(r1, r2)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(List.of(concept(C_RETIRED, false, null), concept(C_ACTIVE, true, null)));

    doAnswer(
            invocation -> {
              if ("r2".equals(invocation.getArgument(1))) {
                throw WebClientResponseException.create(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(), "rel boom", null, null, null);
              }
              return null;
            })
        .when(snowstormClient)
        .deleteRelationship(eq(BRANCH), any());

    TidyResult result = service.tidy(BRANCH);

    assertThat(result.succeeded()).extracting(TidySuccess::id).containsExactly("r1");
    assertThat(result.failed())
        .extracting(TidyFailure::id, TidyFailure::attemptedAction)
        .containsExactly(tuple("r2", TidyAction.DELETED));
    assertThat(result.failed().get(0).errorMessage()).contains("500");
  }

  // tidy() catches HTTP errors (WebClientException + LingoProblem) and records them as
  // TidyFailure rows; everything else (programming bugs, SecurityException, ...) must
  // propagate so the caller sees the real problem instead of a routine "this id failed" entry.
  @Test
  void tidy_propagatesNonHttpErrors() {
    SnowstormReferenceSetMember m1 = member("m1", C_REFSET, C_DELETED, false);

    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of("m1"), List.of()));
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(m1)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any())).thenReturn(List.of());

    doAnswer(
            invocation -> {
              throw new NullPointerException("programming bug");
            })
        .when(snowstormClient)
        .deleteRefsetMember(eq(BRANCH), any());

    org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.tidy(BRANCH))
        .isInstanceOf(NullPointerException.class)
        .hasMessageContaining("programming bug");
  }

  // typeId must be non-null upstream of toDanglingRel, which @NonNull-asserts each of the three
  // IDs.
  @Test
  void detect_skipsMalformedRelationshipMissingTypeId() {
    SnowstormRelationship malformed =
        new SnowstormRelationship()
            .relationshipId("r-malformed")
            .sourceId(C_RETIRED)
            .destinationId(C_ACTIVE)
            .released(true)
            .active(true);
    // typeId deliberately omitted — should be filtered out by isWellFormed and never reach the
    // dangling list.

    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of(), List.of("r-malformed")));
    when(snowstormClient.fetchRelationshipsByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(malformed)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(List.of(concept(C_RETIRED, false, null), concept(C_ACTIVE, true, null)));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingNonDefiningRelationships())
        .as("malformed relationship without typeId must not surface as dangling")
        .isEmpty();
  }

  // SnowstormClient's mutation methods catch RuntimeException internally and rethrow as
  // LingoProblem (sibling of WebClientException, not subclass) — so tidy() must catch both or
  // every Snowstorm-side failure aborts the loop on the first error instead of being recorded
  // as a TidyFailure.
  @Test
  void tidy_recordsLingoProblemAsFailure() {
    SnowstormReferenceSetMember m1 = member("m1", C_REFSET, C_DELETED, false);
    SnowstormReferenceSetMember m2 = member("m2", C_REFSET, C_DELETED, false);

    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of("m1", "m2"), List.of()));
    when(snowstormClient.fetchRefsetMembersByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(m1, m2)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any())).thenReturn(List.of());

    doAnswer(
            invocation -> {
              if ("m2".equals(invocation.getArgument(1))) {
                throw new LingoProblem(
                    "delete-failed",
                    "Failed to delete refset member",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "snowstorm rejected the delete");
              }
              return null;
            })
        .when(snowstormClient)
        .deleteRefsetMember(eq(BRANCH), any());

    TidyResult result = service.tidy(BRANCH);

    assertThat(result.succeeded()).extracting(TidySuccess::id).containsExactly("m1");
    assertThat(result.failed())
        .as("tidy must record LingoProblem as a per-id failure, not abort the whole loop")
        .extracting(TidyFailure::id, TidyFailure::attemptedAction)
        .containsExactly(tuple("m2", TidyAction.DELETED));
  }

  // mergeRelationships uses Precedence.AUTHORED_WINS — pin it so a future swap of the call
  // ordering in mergeRelationships shows up as a test failure (otherwise tidy could end up
  // operating on the inherited copy whose released flag may differ, flipping a
  // delete-vs-inactivate decision).
  @Test
  void detect_dedupesRelationshipsAndKeepsAuthoredCopy() {
    SnowstormRelationship authored = relationship("r-dual", C_RETIRED, C_ACTIVE, "t", true);
    SnowstormRelationship referencingInactivated =
        relationship("r-dual", C_RETIRED, C_ACTIVE, "t", false);

    when(traceabilityServiceClient.getContentChangeActivitiesOnBranch(BRANCH))
        .thenReturn(traceabilityScope(List.of(), List.of("r-dual")));
    when(snowstormClient.fetchRelationshipsByIds(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(authored)));
    when(snowstormClient.findActiveNonDefiningRelationshipsForConcepts(eq(BRANCH), any()))
        .thenReturn(Mono.just(List.of(referencingInactivated)));
    when(snowstormClient.getConceptsByIdViaSearch(eq(BRANCH), any()))
        .thenReturn(List.of(concept(C_RETIRED, false, null), concept(C_ACTIVE, true, null)));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingNonDefiningRelationships())
        .extracting(
            DanglingNonDefiningRelationship::relationshipId,
            DanglingNonDefiningRelationship::released)
        .containsExactly(tuple("r-dual", true));
  }
}
