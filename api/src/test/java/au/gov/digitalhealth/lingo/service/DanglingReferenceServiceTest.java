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
import au.gov.digitalhealth.lingo.promotion.ConceptStatus;
import au.gov.digitalhealth.lingo.promotion.DanglingNonDefiningRelationship;
import au.gov.digitalhealth.lingo.promotion.DanglingReferenceSummary;
import au.gov.digitalhealth.lingo.promotion.DanglingRefsetMember;
import au.gov.digitalhealth.lingo.promotion.TidyAction;
import au.gov.digitalhealth.lingo.promotion.TidyFailure;
import au.gov.digitalhealth.lingo.promotion.TidyKind;
import au.gov.digitalhealth.lingo.promotion.TidyResult;
import au.gov.digitalhealth.lingo.promotion.TidySuccess;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class DanglingReferenceServiceTest {

  private static final String BRANCH = "MAIN/SNOMIO-PROJECT/SNOMIO-1";

  @Mock SnowstormClient snowstormClient;
  @InjectMocks DanglingReferenceService service;

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
  void detect_returnsEmptySummaryWhenNoModifiedComponents() {
    when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH)).thenReturn(Mono.just(List.of()));
    when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of()));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers()).isEmpty();
    assertThat(summary.danglingNonDefiningRelationships()).isEmpty();
  }

  @Test
  void detect_flagsRefsetMemberReferencingRetiredConcept() {
    SnowstormReferenceSetMember m = member("m1", "refset-1", "c-retired", true);
    when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of(m)));
    when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of()));
    when(snowstormClient.getConceptsById(eq(BRANCH), any()))
        .thenReturn(
            List.of(
                concept("c-retired", false, "Retired thing"),
                concept("refset-1", true, "My refset")));

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
    SnowstormReferenceSetMember m = member("m2", "refset-1", "c-deleted", false);
    when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of(m)));
    when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of()));
    when(snowstormClient.getConceptsById(eq(BRANCH), any()))
        .thenReturn(List.of(concept("refset-1", true, "My refset")));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers()).hasSize(1);
    DanglingRefsetMember d = summary.danglingRefsetMembers().get(0);
    assertThat(d.referencedConceptStatus()).isEqualTo(ConceptStatus.DELETED);
    assertThat(d.referencedConceptPt()).isNull();
    assertThat(d.refsetPt()).isEqualTo("My refset");
    assertThat(d.released()).isFalse();
  }

  @Test
  void detect_ignoresRefsetMemberWhereReferencedConceptIsActive() {
    SnowstormReferenceSetMember m = member("m3", "refset-1", "c-active", true);
    when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of(m)));
    when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of()));
    when(snowstormClient.getConceptsById(eq(BRANCH), any()))
        .thenReturn(List.of(concept("c-active", true, null), concept("refset-1", true, null)));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingRefsetMembers()).isEmpty();
  }

  @Test
  void detect_flagsNonDefiningRelationshipWhenSourceRetired() {
    SnowstormRelationship rel = relationship("r1", "c-retired", "c-active", "type-1", false);
    when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH)).thenReturn(Mono.just(List.of()));
    when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of(rel)));
    when(snowstormClient.getConceptsById(eq(BRANCH), any()))
        .thenReturn(
            List.of(
                concept("c-retired", false, "Retired source"),
                concept("c-active", true, null),
                concept("type-1", true, "My type")));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingNonDefiningRelationships()).hasSize(1);
    DanglingNonDefiningRelationship d = summary.danglingNonDefiningRelationships().get(0);
    assertThat(d.sourceStatus()).isEqualTo(ConceptStatus.RETIRED);
    assertThat(d.destinationStatus()).isEqualTo(ConceptStatus.ACTIVE);
    assertThat(d.typePt()).isEqualTo("My type");
  }

  @Test
  void detect_flagsNonDefiningRelationshipWhenDestinationDeleted() {
    SnowstormRelationship rel = relationship("r2", "c-active", "c-deleted", "type-1", false);
    when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH)).thenReturn(Mono.just(List.of()));
    when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of(rel)));
    when(snowstormClient.getConceptsById(eq(BRANCH), any()))
        .thenReturn(List.of(concept("c-active", true, null), concept("type-1", true, null)));

    DanglingReferenceSummary summary = service.detect(BRANCH);

    assertThat(summary.danglingNonDefiningRelationships()).hasSize(1);
    DanglingNonDefiningRelationship d = summary.danglingNonDefiningRelationships().get(0);
    assertThat(d.sourceStatus()).isEqualTo(ConceptStatus.ACTIVE);
    assertThat(d.destinationStatus()).isEqualTo(ConceptStatus.DELETED);
  }

  @Test
  void detect_isReadOnly_evenWithDanglingResults() throws Exception {
    SnowstormReferenceSetMember m = member("m1", "refset-1", "c-retired", true);
    SnowstormRelationship rel = relationship("r1", "c-retired", "c-active", "t", true);
    when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of(m)));
    when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of(rel)));
    when(snowstormClient.getConceptsById(eq(BRANCH), any()))
        .thenReturn(
            List.of(
                concept("c-retired", false, null),
                concept("c-active", true, null),
                concept("refset-1", true, null),
                concept("t", true, null)));

    service.detect(BRANCH);

    verify(snowstormClient, never()).deleteRefsetMember(any(), any());
    verify(snowstormClient, never()).inactivateRefsetMember(any(), any());
    verify(snowstormClient, never()).deleteRelationship(any(), any());
    verify(snowstormClient, never()).inactivateRelationship(any(), any());
  }

  @Test
  void tidy_releasedMemberInactivated_unreleasedDeleted() {
    SnowstormReferenceSetMember released = member("m-released", "refset-1", "c-retired", true);
    SnowstormReferenceSetMember unreleased = member("m-unreleased", "refset-1", "c-deleted", false);

    when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of(released, unreleased)));
    when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of()));
    when(snowstormClient.getConceptsById(eq(BRANCH), any()))
        .thenReturn(List.of(concept("c-retired", false, null), concept("refset-1", true, null)));

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
    SnowstormRelationship released = relationship("r-rel", "c-retired", "c-active", "t", true);
    SnowstormRelationship unreleased = relationship("r-unrel", "c-active", "c-deleted", "t", false);

    when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH)).thenReturn(Mono.just(List.of()));
    when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of(released, unreleased)));
    when(snowstormClient.getConceptsById(eq(BRANCH), any()))
        .thenReturn(List.of(concept("c-retired", false, null), concept("c-active", true, null)));

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
    SnowstormReferenceSetMember releasedMember =
        member("m-released", "refset-1", "c-retired", true);
    SnowstormReferenceSetMember unreleasedMember =
        member("m-unreleased", "refset-1", "c-deleted", false);
    SnowstormRelationship releasedRel =
        relationship("r-released", "c-retired", "c-active", "t", true);
    SnowstormRelationship unreleasedRel =
        relationship("r-unreleased", "c-active", "c-deleted", "t", false);

    when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of(releasedMember, unreleasedMember)));
    when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of(releasedRel, unreleasedRel)));
    when(snowstormClient.getConceptsById(eq(BRANCH), any()))
        .thenReturn(
            List.of(
                concept("c-retired", false, null),
                concept("c-active", true, null),
                concept("refset-1", true, null),
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
    SnowstormReferenceSetMember m1 = member("m1", "r", "c-deleted", false);
    SnowstormReferenceSetMember m2 = member("m2", "r", "c-deleted", false);

    when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of(m1, m2)));
    when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of()));
    when(snowstormClient.getConceptsById(eq(BRANCH), any())).thenReturn(List.of());

    doAnswer(
            invocation -> {
              if ("m2".equals(invocation.getArgument(1))) {
                throw new RuntimeException("snowstorm exploded");
              }
              return null;
            })
        .when(snowstormClient)
        .deleteRefsetMember(eq(BRANCH), any());

    TidyResult result = service.tidy(BRANCH);

    assertThat(result.succeeded()).extracting(TidySuccess::id).containsExactly("m1");
    assertThat(result.failed())
        .extracting(TidyFailure::id, TidyFailure::attemptedAction, TidyFailure::errorMessage)
        .containsExactly(tuple("m2", TidyAction.DELETED, "snowstorm exploded"));
  }

  @Test
  void tidy_partialFailureRelationshipReportsError() {
    SnowstormRelationship r1 = relationship("r1", "c-retired", "c-active", "t", false);
    SnowstormRelationship r2 = relationship("r2", "c-retired", "c-active", "t", false);

    when(snowstormClient.getRefsetMembersModifiedOnBranch(BRANCH)).thenReturn(Mono.just(List.of()));
    when(snowstormClient.getNonDefiningRelationshipsModifiedOnBranch(BRANCH))
        .thenReturn(Mono.just(List.of(r1, r2)));
    when(snowstormClient.getConceptsById(eq(BRANCH), any()))
        .thenReturn(List.of(concept("c-retired", false, null), concept("c-active", true, null)));

    doAnswer(
            invocation -> {
              if ("r2".equals(invocation.getArgument(1))) {
                throw new RuntimeException("rel boom");
              }
              return null;
            })
        .when(snowstormClient)
        .deleteRelationship(eq(BRANCH), any());

    TidyResult result = service.tidy(BRANCH);

    assertThat(result.succeeded()).extracting(TidySuccess::id).containsExactly("r1");
    assertThat(result.failed())
        .extracting(TidyFailure::id, TidyFailure::attemptedAction, TidyFailure::errorMessage)
        .containsExactly(tuple("r2", TidyAction.DELETED, "rel boom"));
  }
}
