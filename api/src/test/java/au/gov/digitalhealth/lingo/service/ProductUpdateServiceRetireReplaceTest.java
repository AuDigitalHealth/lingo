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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormDescription;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.update.ProductDescriptionUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductUpdateRequest;
import au.gov.digitalhealth.tickets.models.BulkProductAction;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.BulkProductActionRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;

/**
 * Reproduces CUST1634236: when a product description term is edited to a value that already exists
 * as an <em>inactive</em> description on the same concept, the update should reactivate the
 * existing inactive description rather than create a brand new active description while leaving the
 * inactive one in place.
 *
 * <p>The buggy behaviour produces a concept that simultaneously holds an active and an inactive
 * description with the same term/language, which fails the release validation assertion "Active
 * descriptions must not have the same term as an inactive description on the same concept, unless
 * the language code is different".
 */
@ExtendWith(MockitoExtension.class)
class ProductUpdateServiceRetireReplaceTest {

  private static final String BRANCH = "MAIN/SNOMIO-PROJECT/SNOMIO-1";
  private static final String CONCEPT_ID = "111000168105";
  private static final String EXTENSION_MODULE_ID = "11000168105";
  private static final String US_REFSET_ID = "900000000000509007";
  private static final String FSN_TYPE_ID = "900000000000003001";
  private static final String SYNONYM_TYPE_ID = "900000000000013009";
  private static final long TICKET_ID = 42L;

  private static final String FSN_TERM = "Foo 10 mg tablet (medicinal product)";
  private static final String OLD_SYNONYM_TERM = "Foo 10 mg";
  private static final String NEW_SYNONYM_TERM = "Foo 5 mg"; // matches the inactive description

  @Mock SnowstormClient snowstormClient;
  @Mock au.gov.digitalhealth.tickets.service.TicketServiceImpl ticketService;

  @Mock
  au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration fieldBindingConfiguration;

  @Mock Models models;
  @Mock ProductSummaryService productSummaryService;
  @Mock ProductCalculationServiceFactory productCalculationServiceFactory;
  @Mock TicketRepository ticketRepository;
  @Mock BulkProductActionRepository bulkProductActionRepository;
  @Mock BlobStorageService blobStorageService;
  @Mock ModelConfiguration modelConfiguration;

  @InjectMocks ProductUpdateService productUpdateService;

  @Test
  void reactivatesExistingInactiveDescriptionInsteadOfCreatingDuplicateTerm() {
    // existing concept: active FSN, active synonym "Foo 10 mg", and an INACTIVE synonym "Foo 5 mg"
    SnowstormDescription fsn = desc("100", "FSN", FSN_TYPE_ID, FSN_TERM, true, true);
    SnowstormDescription activeSynonym =
        desc("300", "SYNONYM", SYNONYM_TYPE_ID, OLD_SYNONYM_TERM, true, true);
    SnowstormDescription inactiveSynonym =
        desc("222", "SYNONYM", SYNONYM_TYPE_ID, NEW_SYNONYM_TERM, false, true);

    SnowstormConcept existing =
        new SnowstormConcept()
            .conceptId(CONCEPT_ID)
            .moduleId(EXTENSION_MODULE_ID)
            .definitionStatus("PRIMITIVE")
            .active(true)
            .fsn(new SnowstormTermLangPojo().term(FSN_TERM).lang("en"))
            .descriptions(new HashSet<>(Set.of(fsn, activeSynonym, inactiveSynonym)));

    // edit: rename the active synonym "Foo 10 mg" -> "Foo 5 mg" (the inactive description's term)
    SnowstormDescription requestFsn = desc("100", "FSN", FSN_TYPE_ID, FSN_TERM, true, true);
    SnowstormDescription editedSynonym =
        desc("300", "SYNONYM", SYNONYM_TYPE_ID, NEW_SYNONYM_TERM, true, true);

    ProductUpdateRequest request =
        ProductUpdateRequest.builder()
            .ticketId(TICKET_ID)
            .conceptId(CONCEPT_ID)
            .descriptionUpdate(
                ProductDescriptionUpdateRequest.builder()
                    .descriptions(new HashSet<>(Set.of(requestFsn, editedSynonym)))
                    .build())
            .build();

    when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(new Ticket()));
    when(snowstormClient.getBrowserConcept(BRANCH, CONCEPT_ID)).thenReturn(Mono.just(existing));
    when(models.getModelConfiguration(BRANCH)).thenReturn(modelConfiguration);
    when(modelConfiguration.getPreferredLanguageRefsets()).thenReturn(Set.of(US_REFSET_ID));
    when(bulkProductActionRepository.findByNameAndTicketId(any(), eq(TICKET_ID)))
        .thenReturn(Optional.empty());
    when(bulkProductActionRepository.save(any()))
        .thenAnswer(inv -> inv.getArgument(0, BulkProductAction.class));
    // Echo back a detached deep copy so the captured first-call payload is not mutated by the
    // subsequent retire/replace pass.
    when(snowstormClient.updateConcept(eq(BRANCH), eq(CONCEPT_ID), any(), eq(false)))
        .thenAnswer(inv -> detachedCopy(inv.getArgument(2, SnowstormConcept.class)));

    productUpdateService.updateProductDescriptions(BRANCH, CONCEPT_ID, request);

    ArgumentCaptor<SnowstormConcept> sent = ArgumentCaptor.forClass(SnowstormConcept.class);
    org.mockito.Mockito.verify(snowstormClient, org.mockito.Mockito.atLeastOnce())
        .updateConcept(eq(BRANCH), eq(CONCEPT_ID), sent.capture(), eq(false));

    SnowstormConcept firstPayload = sent.getAllValues().get(0);

    Set<String> activeTerms =
        firstPayload.getDescriptions().stream()
            .filter(d -> Boolean.TRUE.equals(d.getActive()))
            .map(SnowstormDescription::getTerm)
            .collect(Collectors.toSet());
    Set<String> inactiveTerms =
        firstPayload.getDescriptions().stream()
            .filter(d -> Boolean.FALSE.equals(d.getActive()))
            .map(SnowstormDescription::getTerm)
            .collect(Collectors.toSet());

    // RVF invariant: no term may be present as both an active and an inactive description.
    Set<String> sharedTerms = new HashSet<>(activeTerms);
    sharedTerms.retainAll(inactiveTerms);
    assertThat(sharedTerms)
        .as("active and inactive descriptions must not share a term on the same concept")
        .isEmpty();

    // The existing inactive description (id 222) should have been reactivated, not duplicated.
    SnowstormDescription previouslyInactive =
        firstPayload.getDescriptions().stream()
            .filter(d -> "222".equals(d.getDescriptionId()))
            .findFirst()
            .orElse(null);
    assertThat(previouslyInactive)
        .as("existing inactive description with the reused term should still be present")
        .isNotNull();
    assertThat(previouslyInactive.getActive())
        .as("existing inactive description should be reactivated")
        .isTrue();
  }

  @Test
  void reactivatesInactiveDescriptionWhenReAddedAsNewRow() {
    // existing concept: active FSN, active synonym "Foo 10 mg", and an INACTIVE synonym "Foo 5 mg"
    SnowstormDescription fsn = desc("100", "FSN", FSN_TYPE_ID, FSN_TERM, true, true);
    SnowstormDescription activeSynonym =
        desc("300", "SYNONYM", SYNONYM_TYPE_ID, OLD_SYNONYM_TERM, true, true);
    SnowstormDescription inactiveSynonym =
        desc("222", "SYNONYM", SYNONYM_TYPE_ID, NEW_SYNONYM_TERM, false, true);

    SnowstormConcept existing =
        new SnowstormConcept()
            .conceptId(CONCEPT_ID)
            .moduleId(EXTENSION_MODULE_ID)
            .definitionStatus("PRIMITIVE")
            .active(true)
            .fsn(new SnowstormTermLangPojo().term(FSN_TERM).lang("en"))
            .descriptions(new HashSet<>(Set.of(fsn, activeSynonym, inactiveSynonym)));

    // edit: keep both existing active descriptions, add "Foo 5 mg" back as a brand new row (no id)
    SnowstormDescription requestFsn = desc("100", "FSN", FSN_TYPE_ID, FSN_TERM, true, true);
    SnowstormDescription keptSynonym =
        desc("300", "SYNONYM", SYNONYM_TYPE_ID, OLD_SYNONYM_TERM, true, true);
    SnowstormDescription newRow =
        desc(null, "SYNONYM", SYNONYM_TYPE_ID, NEW_SYNONYM_TERM, true, false);

    ProductUpdateRequest request =
        ProductUpdateRequest.builder()
            .ticketId(TICKET_ID)
            .conceptId(CONCEPT_ID)
            .descriptionUpdate(
                ProductDescriptionUpdateRequest.builder()
                    .descriptions(new HashSet<>(Set.of(requestFsn, keptSynonym, newRow)))
                    .build())
            .build();

    stubHappyPath(existing);

    productUpdateService.updateProductDescriptions(BRANCH, CONCEPT_ID, request);

    SnowstormConcept firstPayload = capturedFirstPayload();

    // The inactive description was reactivated (its id reused), not duplicated as a new active row.
    long fooFiveActiveCount =
        firstPayload.getDescriptions().stream()
            .filter(d -> NEW_SYNONYM_TERM.equals(d.getTerm()) && Boolean.TRUE.equals(d.getActive()))
            .count();
    assertThat(fooFiveActiveCount).as("only one active \"Foo 5 mg\" should be sent").isEqualTo(1);

    assertThat(
            firstPayload.getDescriptions().stream()
                .anyMatch(
                    d -> d.getDescriptionId() == null && NEW_SYNONYM_TERM.equals(d.getTerm())))
        .as("no brand new (null id) description should be created for the reused term")
        .isFalse();

    SnowstormDescription reactivated =
        firstPayload.getDescriptions().stream()
            .filter(d -> "222".equals(d.getDescriptionId()))
            .findFirst()
            .orElse(null);
    assertThat(reactivated).isNotNull();
    assertThat(reactivated.getActive()).isTrue();
  }

  @Test
  void rejectsTermEditCollidingWithAnotherActiveDescription() {
    SnowstormDescription fsn = desc("100", "FSN", FSN_TYPE_ID, FSN_TERM, true, true);
    SnowstormDescription synonymA =
        desc("300", "SYNONYM", SYNONYM_TYPE_ID, "Foo 10 mg", true, true);
    SnowstormDescription synonymB =
        desc("400", "SYNONYM", SYNONYM_TYPE_ID, "Foo 20 mg", true, true);

    SnowstormConcept existing =
        new SnowstormConcept()
            .conceptId(CONCEPT_ID)
            .moduleId(EXTENSION_MODULE_ID)
            .definitionStatus("PRIMITIVE")
            .active(true)
            .fsn(new SnowstormTermLangPojo().term(FSN_TERM).lang("en"))
            .descriptions(new HashSet<>(Set.of(fsn, synonymA, synonymB)));

    // edit synonym 300 to "Foo 20 mg" - collides with the active synonym 400
    SnowstormDescription requestFsn = desc("100", "FSN", FSN_TYPE_ID, FSN_TERM, true, true);
    SnowstormDescription editedSynonym =
        desc("300", "SYNONYM", SYNONYM_TYPE_ID, "Foo 20 mg", true, true);
    SnowstormDescription keptSynonymB =
        desc("400", "SYNONYM", SYNONYM_TYPE_ID, "Foo 20 mg", true, true);

    ProductUpdateRequest request =
        ProductUpdateRequest.builder()
            .ticketId(TICKET_ID)
            .conceptId(CONCEPT_ID)
            .descriptionUpdate(
                ProductDescriptionUpdateRequest.builder()
                    .descriptions(new HashSet<>(Set.of(requestFsn, editedSynonym, keptSynonymB)))
                    .build())
            .build();

    when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(new Ticket()));
    when(snowstormClient.getBrowserConcept(BRANCH, CONCEPT_ID)).thenReturn(Mono.just(existing));
    when(models.getModelConfiguration(BRANCH)).thenReturn(modelConfiguration);
    when(modelConfiguration.getPreferredLanguageRefsets()).thenReturn(Set.of(US_REFSET_ID));

    assertThatThrownBy(
            () -> productUpdateService.updateProductDescriptions(BRANCH, CONCEPT_ID, request))
        .isInstanceOf(ProductAtomicDataValidationProblem.class)
        .hasMessageContaining("active description with the same term");
  }

  @Test
  void doesNotDuplicateReactivatedIdWhenInactiveDescriptionAlsoSentInRequest() {
    // Reproduces the round-trip rename (CUST1634236 regression): a PT was renamed away (retiring
    // the original released description) and is now being renamed back to the original term. The
    // request preserves the retired original as an inactive row (as the UI does) AND carries the
    // current active description edited back to the original term. Reactivating the original must
    // not leave a duplicate inactive row with the same id.
    SnowstormDescription fsn = desc("100", "FSN", FSN_TYPE_ID, FSN_TERM, true, true);
    SnowstormDescription retiredOriginal =
        desc("623", "SYNONYM", SYNONYM_TYPE_ID, OLD_SYNONYM_TERM, false, true);
    retiredOriginal.setAcceptabilityMap(new java.util.HashMap<>());
    retiredOriginal.setInactivationIndicator("OUTDATED");
    retiredOriginal.setAssociationTargets(
        new java.util.HashMap<>(Map.of("REPLACED_BY", new HashSet<>(Set.of("3315")))));
    SnowstormDescription activeReplacement =
        desc("3315", "SYNONYM", SYNONYM_TYPE_ID, "Amoxicillin Clonmell", true, false);

    SnowstormConcept existing =
        new SnowstormConcept()
            .conceptId(CONCEPT_ID)
            .moduleId(EXTENSION_MODULE_ID)
            .definitionStatus("PRIMITIVE")
            .active(true)
            .fsn(new SnowstormTermLangPojo().term(FSN_TERM).lang("en"))
            .descriptions(new HashSet<>(Set.of(fsn, retiredOriginal, activeReplacement)));

    // edit the active replacement back to the original term; request still preserves the inactive
    // retired original row.
    SnowstormDescription requestFsn = desc("100", "FSN", FSN_TYPE_ID, FSN_TERM, true, true);
    SnowstormDescription requestRetired =
        desc("623", "SYNONYM", SYNONYM_TYPE_ID, OLD_SYNONYM_TERM, false, true);
    requestRetired.setAcceptabilityMap(new java.util.HashMap<>());
    requestRetired.setInactivationIndicator("OUTDATED");
    requestRetired.setAssociationTargets(
        new java.util.HashMap<>(Map.of("REPLACED_BY", new HashSet<>(Set.of("3315")))));
    SnowstormDescription requestEdited =
        desc("3315", "SYNONYM", SYNONYM_TYPE_ID, OLD_SYNONYM_TERM, true, false);

    ProductUpdateRequest request =
        ProductUpdateRequest.builder()
            .ticketId(TICKET_ID)
            .conceptId(CONCEPT_ID)
            .descriptionUpdate(
                ProductDescriptionUpdateRequest.builder()
                    .descriptions(new HashSet<>(Set.of(requestFsn, requestRetired, requestEdited)))
                    .build())
            .build();

    stubHappyPath(existing);

    productUpdateService.updateProductDescriptions(BRANCH, CONCEPT_ID, request);

    SnowstormConcept firstPayload = capturedFirstPayload();

    long originalIdCount =
        firstPayload.getDescriptions().stream()
            .filter(d -> "623".equals(d.getDescriptionId()))
            .count();
    assertThat(originalIdCount)
        .as("the reactivated description id must be sent exactly once, not duplicated")
        .isEqualTo(1);

    SnowstormDescription original =
        firstPayload.getDescriptions().stream()
            .filter(d -> "623".equals(d.getDescriptionId()))
            .findFirst()
            .orElseThrow();
    assertThat(original.getActive())
        .as("the original description must be reactivated, not left inactive")
        .isTrue();

    Set<String> activeTerms =
        firstPayload.getDescriptions().stream()
            .filter(d -> Boolean.TRUE.equals(d.getActive()))
            .map(SnowstormDescription::getTerm)
            .collect(Collectors.toSet());
    Set<String> inactiveTerms =
        firstPayload.getDescriptions().stream()
            .filter(d -> Boolean.FALSE.equals(d.getActive()))
            .map(SnowstormDescription::getTerm)
            .collect(Collectors.toSet());
    Set<String> sharedTerms = new HashSet<>(activeTerms);
    sharedTerms.retainAll(inactiveTerms);
    assertThat(sharedTerms).isEmpty();
  }

  @Test
  void retiresOldReleasedDescriptionInSecondUpdateWhenTermIsGenuinelyNew() {
    // A released active synonym renamed to a brand-new term with no inactive match: the new term is
    // created in the first update, then the old released description is retired (REPLACED_BY the
    // new
    // id) in a second update once Snowstorm has assigned the new id.
    SnowstormDescription fsn = desc("100", "FSN", FSN_TYPE_ID, FSN_TERM, true, true);
    SnowstormDescription releasedSynonym =
        desc("300", "SYNONYM", SYNONYM_TYPE_ID, OLD_SYNONYM_TERM, true, true);

    SnowstormConcept existing =
        new SnowstormConcept()
            .conceptId(CONCEPT_ID)
            .moduleId(EXTENSION_MODULE_ID)
            .definitionStatus("PRIMITIVE")
            .active(true)
            .fsn(new SnowstormTermLangPojo().term(FSN_TERM).lang("en"))
            .descriptions(new HashSet<>(Set.of(fsn, releasedSynonym)));

    String newTerm = "Foo 7 mg"; // brand-new term, no inactive description matches it
    SnowstormDescription requestFsn = desc("100", "FSN", FSN_TYPE_ID, FSN_TERM, true, true);
    SnowstormDescription editedSynonym =
        desc("300", "SYNONYM", SYNONYM_TYPE_ID, newTerm, true, true);

    ProductUpdateRequest request =
        ProductUpdateRequest.builder()
            .ticketId(TICKET_ID)
            .conceptId(CONCEPT_ID)
            .descriptionUpdate(
                ProductDescriptionUpdateRequest.builder()
                    .descriptions(new HashSet<>(Set.of(requestFsn, editedSynonym)))
                    .build())
            .build();

    stubHappyPath(existing);

    productUpdateService.updateProductDescriptions(BRANCH, CONCEPT_ID, request);

    // A genuinely new term requires two updates: create, then retire the old released description.
    ArgumentCaptor<SnowstormConcept> sent = ArgumentCaptor.forClass(SnowstormConcept.class);
    org.mockito.Mockito.verify(snowstormClient, org.mockito.Mockito.times(2))
        .updateConcept(eq(BRANCH), eq(CONCEPT_ID), sent.capture(), eq(false));

    SnowstormConcept secondPayload = sent.getAllValues().get(1);

    SnowstormDescription created =
        secondPayload.getDescriptions().stream()
            .filter(d -> newTerm.equals(d.getTerm()) && Boolean.TRUE.equals(d.getActive()))
            .findFirst()
            .orElseThrow();

    SnowstormDescription retired =
        secondPayload.getDescriptions().stream()
            .filter(d -> "300".equals(d.getDescriptionId()))
            .findFirst()
            .orElseThrow();

    assertThat(retired.getActive())
        .as("the old released description is retired in the second update")
        .isFalse();
    assertThat(retired.getInactivationIndicator()).isEqualTo("OUTDATED");
    assertThat(retired.getAssociationTargets().get("REPLACED_BY"))
        .as("retired description is REPLACED_BY the newly created replacement")
        .contains(created.getDescriptionId());
  }

  @Test
  void reAddsUntouchedInactiveDescriptionWithBlankedAcceptability() {
    // An inactive description that is neither reactivated nor present in the request must still be
    // re-sent (otherwise Snowstorm deletes it), with its acceptability blanked so we never assert
    // active language reference set members against an inactive description.
    SnowstormDescription fsn = desc("100", "FSN", FSN_TYPE_ID, FSN_TERM, true, true);
    SnowstormDescription activeSynonym =
        desc("300", "SYNONYM", SYNONYM_TYPE_ID, OLD_SYNONYM_TERM, true, true);
    // Unrelated retired description still carrying acceptability (the state the blanking fixes).
    SnowstormDescription unrelatedInactive =
        desc("500", "SYNONYM", SYNONYM_TYPE_ID, "Some retired term", false, true);

    SnowstormConcept existing =
        new SnowstormConcept()
            .conceptId(CONCEPT_ID)
            .moduleId(EXTENSION_MODULE_ID)
            .definitionStatus("PRIMITIVE")
            .active(true)
            .fsn(new SnowstormTermLangPojo().term(FSN_TERM).lang("en"))
            .descriptions(new HashSet<>(Set.of(fsn, activeSynonym, unrelatedInactive)));

    // Request carries only the active descriptions (the UI does not re-send retired ones here);
    // the retired "Some retired term" (id 500) is absent and unrelated to any edit.
    SnowstormDescription requestFsn = desc("100", "FSN", FSN_TYPE_ID, FSN_TERM, true, true);
    SnowstormDescription requestSynonym =
        desc("300", "SYNONYM", SYNONYM_TYPE_ID, OLD_SYNONYM_TERM, true, true);

    ProductUpdateRequest request =
        ProductUpdateRequest.builder()
            .ticketId(TICKET_ID)
            .conceptId(CONCEPT_ID)
            .descriptionUpdate(
                ProductDescriptionUpdateRequest.builder()
                    .descriptions(new HashSet<>(Set.of(requestFsn, requestSynonym)))
                    .build())
            .build();

    stubHappyPath(existing);

    productUpdateService.updateProductDescriptions(BRANCH, CONCEPT_ID, request);

    SnowstormConcept firstPayload = capturedFirstPayload();

    SnowstormDescription reAdded =
        firstPayload.getDescriptions().stream()
            .filter(d -> "500".equals(d.getDescriptionId()))
            .findFirst()
            .orElse(null);
    assertThat(reAdded)
        .as("the untouched retired description must be re-sent so Snowstorm does not delete it")
        .isNotNull();
    assertThat(reAdded.getActive()).isFalse();
    assertThat(reAdded.getAcceptabilityMap())
        .as(
            "re-sent retired description must not carry active language reference set acceptability")
        .isEmpty();
  }

  private void stubHappyPath(SnowstormConcept existing) {
    when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(new Ticket()));
    when(snowstormClient.getBrowserConcept(BRANCH, CONCEPT_ID)).thenReturn(Mono.just(existing));
    when(models.getModelConfiguration(BRANCH)).thenReturn(modelConfiguration);
    when(modelConfiguration.getPreferredLanguageRefsets()).thenReturn(Set.of(US_REFSET_ID));
    when(bulkProductActionRepository.findByNameAndTicketId(any(), eq(TICKET_ID)))
        .thenReturn(Optional.empty());
    when(bulkProductActionRepository.save(any()))
        .thenAnswer(inv -> inv.getArgument(0, BulkProductAction.class));
    when(snowstormClient.updateConcept(eq(BRANCH), eq(CONCEPT_ID), any(), eq(false)))
        .thenAnswer(inv -> detachedCopy(inv.getArgument(2, SnowstormConcept.class)));
  }

  private SnowstormConcept capturedFirstPayload() {
    ArgumentCaptor<SnowstormConcept> sent = ArgumentCaptor.forClass(SnowstormConcept.class);
    org.mockito.Mockito.verify(snowstormClient, org.mockito.Mockito.atLeastOnce())
        .updateConcept(eq(BRANCH), eq(CONCEPT_ID), sent.capture(), eq(false));
    return sent.getAllValues().get(0);
  }

  private static SnowstormDescription desc(
      String id, String type, String typeId, String term, boolean active, boolean released) {
    SnowstormDescription d = new SnowstormDescription();
    d.setDescriptionId(id);
    d.setType(type);
    d.setTypeId(typeId);
    d.setTerm(term);
    d.setLanguageCode("en");
    d.setCaseSignificanceId("900000000000448009");
    d.setActive(active);
    d.setReleased(released);
    d.setAcceptabilityMap(new java.util.HashMap<>(Map.of(US_REFSET_ID, "PREFERRED")));
    return d;
  }

  private static SnowstormConcept detachedCopy(SnowstormConcept source) {
    Set<SnowstormDescription> copies =
        source.getDescriptions().stream()
            .map(
                d -> {
                  SnowstormDescription c =
                      desc(
                          d.getDescriptionId(),
                          d.getType(),
                          d.getTypeId(),
                          d.getTerm(),
                          Boolean.TRUE.equals(d.getActive()),
                          Boolean.TRUE.equals(d.getReleased()));
                  if (c.getDescriptionId() == null) {
                    c.setDescriptionId("999" + Math.abs(d.getTerm().hashCode()));
                  }
                  return c;
                })
            .collect(Collectors.toSet());
    return new SnowstormConcept()
        .conceptId(source.getConceptId())
        .moduleId(source.getModuleId())
        .definitionStatus(
            source.getDefinitionStatus() == null ? "PRIMITIVE" : source.getDefinitionStatus())
        .active(true)
        .fsn(source.getFsn())
        .descriptions(copies);
  }
}
