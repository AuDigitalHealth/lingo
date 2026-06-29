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

import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.toSnowstormConceptMini;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormItemsPageReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.configuration.Configuration;
import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.service.fhir.FhirClient;
import au.gov.digitalhealth.lingo.util.NmpcConstants;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.MockReset;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Verifies that {@link AtomicDataService#populateProductDetails} populates {@code
 * brandedProductName} from the existing AMP concept's preferred term when loading an NMPC product
 * for editing. This exercises the production change in Task 7.
 *
 * <p>Snowstorm is mocked so this test works without a running Snowstorm instance. The concept graph
 * is constructed to satisfy the NMPC {@link DeviceService} load path, which is simpler than the
 * medication path (no HAS_NMPC_PRODUCT_TYPE lookup needed).
 *
 * <p>{@link Isolated} prevents this class from running concurrently with other {@link
 * SpringBootTest} classes that share the same Spring application context and mock beans. Concurrent
 * {@code @BeforeEach} stub registration on a shared Mockito mock can produce {@code
 * WrongTypeOfReturnValue} errors when the JUnit parallel executor interleaves the two setup
 * methods.
 */
@SpringBootTest(
    classes = Configuration.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Isolated
class AtomicDataBrandedNameTest {

  /**
   * NMPC branch path. {@link
   * au.gov.digitalhealth.lingo.configuration.model.Models#getModelConfiguration(String)} converts
   * {@code |} to {@code _} for key lookup, so {@code "MAIN/SNOMEDCT-IE"} maps to the {@code
   * MAIN_SNOMEDCT-IE} config key. Using the underscore form directly avoids URL-filter encoding.
   */
  private static final String NMPC_BRANCH = "MAIN_SNOMEDCT-IE";

  /**
   * Stub SCTID for the AMP (branded, REAL_CLINICAL_DRUG) concept. Uses a real NMPC SCTID that
   * passes Verhoeff check-digit validation.
   */
  // NmpcConstants.PACKAGE_NMPC — "689861000220100"
  private static final String AMP_ID = NmpcConstants.PACKAGE_NMPC.getValue();

  /** Stub SCTID for the MPUU (unbranded, CLINICAL_DRUG) parent concept. Uses a real NMPC SCTID. */
  // NmpcConstants.VIRTUAL_MEDICINAL_PRODUCT — "660341000220102"
  private static final String MPUU_ID = NmpcConstants.VIRTUAL_MEDICINAL_PRODUCT.getValue();

  /**
   * Stub SCTID for the MP (root unbranded, MEDICINAL_PRODUCT_ONLY) concept. Uses a real NMPC SCTID.
   */
  // NmpcConstants.CONTAINS_DEVICE_NMPC value "689871000220106" is a valid NMPC SCTID.
  private static final String MP_ID = NmpcConstants.CONTAINS_DEVICE_NMPC.getValue();

  /** NMPC REAL_CLINICAL_DRUG refset — the AMP level. */
  private static final String REAL_CLINICAL_DRUG_REFSET = "660381000220107";

  /** NMPC CLINICAL_DRUG refset — the MPUU (leaf unbranded product) level. */
  private static final String CLINICAL_DRUG_REFSET = "660371000220109";

  /** NMPC MEDICINAL_PRODUCT_ONLY refset — the MP (root unbranded product) level. */
  private static final String MEDICINAL_PRODUCT_ONLY_REFSET = "660351000220100";

  /** The known preferred term of the stub AMP concept — this is the value the test asserts. */
  private static final String AMP_PREFERRED_TERM = "AcmeWidget 25 mg patch (real clinical device)";

  @MockBean(reset = MockReset.NONE)
  SnowstormClient snowstormClient;

  @MockBean(reset = MockReset.NONE)
  FhirClient fhirClient;

  @Autowired DeviceService deviceService;

  @BeforeEach
  void stubMocks() {
    // -----------------------------------------------------------------------
    // getConceptsToMap: ECL lookup returns all three concept IDs in scope.
    // -----------------------------------------------------------------------
    when(snowstormClient.getConceptsIdsFromEcl(
            anyString(), anyString(), anyLong(), anyInt(), anyInt(), anyBoolean()))
        .thenReturn(List.of(AMP_ID, MPUU_ID, MP_ID));

    // -----------------------------------------------------------------------
    // Browser concepts returned for all requested IDs in getMaps.
    // -----------------------------------------------------------------------
    SnowstormConcept ampConcept = buildAmpConcept();
    SnowstormConcept mpuuConcept = buildMpuuConcept();
    SnowstormConcept mpConcept = buildMpConcept();

    // First call in getMaps (getBrowserConcepts for all concepts in scope).
    when(snowstormClient.getBrowserConcepts(anyString(), any()))
        .thenReturn(Flux.just(ampConcept, mpuuConcept, mpConcept));

    // -----------------------------------------------------------------------
    // Refset members returned from getMaps for typeMap / referenceSets /
    // nonDefiningProperties pipelines (all share one Mono subscription).
    // -----------------------------------------------------------------------
    SnowstormReferenceSetMember ampMember = refsetMember(AMP_ID, REAL_CLINICAL_DRUG_REFSET);
    SnowstormReferenceSetMember mpuuMember = refsetMember(MPUU_ID, CLINICAL_DRUG_REFSET);
    SnowstormReferenceSetMember mpMember = refsetMember(MP_ID, MEDICINAL_PRODUCT_ONLY_REFSET);

    when(snowstormClient.getRefsetMembers(anyString(), any(), any(), anyInt(), anyInt()))
        .thenReturn(
            Mono.just(
                new SnowstormItemsPageReferenceSetMember()
                    .items(List.of(ampMember, mpuuMember, mpMember))));

    // -----------------------------------------------------------------------
    // DeviceService.populateSpecificProductDetails calls getBrowserConcepts
    // a second time for the specificDeviceType (MPUU) to read
    // genericOtherIdentifyingInformation. Return the MPUU concept (no
    // HAS_OTHER_IDENTIFYING_INFORMATION relationship, so the field is left null).
    // The Flux.just(amp, mpuu, mp) stub above already covers this via anyString()/any().
    // -----------------------------------------------------------------------
  }

  @Test
  void loadingExistingNmpcProductPopulatesBrandedProductNameFromAmpPt() {
    // Act: load an existing NMPC device AMP by concept ID.
    DeviceProductDetails productDetails = deviceService.getProductAtomicData(NMPC_BRANCH, AMP_ID);

    // Assert: the branded product name is populated from the AMP concept's preferred term.
    // This is the value set by the Task 7 production change in AtomicDataService.
    assertThat(productDetails.getBrandedProductName())
        .as(
            "brandedProductName should be populated from the AMP preferred term on load "
                + "(Task 7 — AtomicDataService.populateProductDetails)")
        .isEqualTo(AMP_PREFERRED_TERM);
  }

  // ---------------------------------------------------------------------------
  // Concept builders
  // ---------------------------------------------------------------------------

  /**
   * Builds the AMP (REAL_CLINICAL_DRUG) concept with a known preferred term and an IS_A axiom
   * pointing to the MPUU parent (satisfying {@link DeviceService#getLeafUnbrandedProduct}). Also
   * includes a HAS_PRODUCT_NAME relationship (required by {@link
   * AtomicDataService#populateProductDetails}).
   */
  private SnowstormConcept buildAmpConcept() {
    SnowstormRelationship isARelationship =
        statedIsA(AMP_ID, MPUU_ID, "Virtual medicinal product (product)");
    SnowstormRelationship hasProductNameRelationship =
        statedRelationship(
            AMP_ID,
            SnomedConstants.HAS_PRODUCT_NAME.getValue(),
            // targetId reuses PACKAGE_NMPC SCTID — Snowstorm is mocked, value only needs to be a
            // valid SnowstormConceptMini (the actual concept existence is not verified).
            NmpcConstants.PACKAGE_NMPC.getValue(),
            "Ongentys (product name)");

    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.setActive(true);
    axiom.setRelationships(Set.of(isARelationship, hasProductNameRelationship));

    SnowstormConcept concept = new SnowstormConcept();
    concept.setConceptId(AMP_ID);
    concept.setPt(new SnowstormTermLangPojo().term(AMP_PREFERRED_TERM));
    concept.setDefinitionStatusId(SnomedConstants.PRIMITIVE.getValue());
    concept.setClassAxioms(Set.of(axiom));
    concept.setRelationships(Set.of());
    return concept;
  }

  /**
   * Builds the MPUU (CLINICAL_DRUG, leaf-unbranded) concept with an IS_A axiom pointing to the MP
   * parent (satisfying {@link DeviceService#getRootUnbrandedProduct} via the typeMap fast path).
   */
  private SnowstormConcept buildMpuuConcept() {
    SnowstormRelationship isARelationship =
        statedIsA(MPUU_ID, MP_ID, "Virtual therapeutic moiety (product)");

    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.setActive(true);
    axiom.setRelationships(Set.of(isARelationship));

    SnowstormConcept concept = new SnowstormConcept();
    concept.setConceptId(MPUU_ID);
    concept.setPt(new SnowstormTermLangPojo().term("AcmeWidget (virtual medicinal product)"));
    concept.setDefinitionStatusId(SnomedConstants.PRIMITIVE.getValue());
    concept.setClassAxioms(Set.of(axiom));
    concept.setRelationships(Set.of());
    return concept;
  }

  /**
   * Builds the MP (MEDICINAL_PRODUCT_ONLY, root-unbranded) concept with a minimal single-axiom (no
   * IS_A parents needed — the typeMap fast path stops here).
   */
  private SnowstormConcept buildMpConcept() {
    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.setActive(true);
    axiom.setRelationships(Set.of());

    SnowstormConcept concept = new SnowstormConcept();
    concept.setConceptId(MP_ID);
    concept.setPt(new SnowstormTermLangPojo().term("AcmeWidget (medicinal product)"));
    concept.setDefinitionStatusId(SnomedConstants.PRIMITIVE.getValue());
    concept.setClassAxioms(Set.of(axiom));
    concept.setRelationships(Set.of());
    return concept;
  }

  /**
   * Creates a stated IS_A relationship from {@code sourceId} to {@code targetId} with both {@code
   * destinationId} (used by {@link AtomicDataService#getAncestors}) and {@code target} (used by
   * {@link DeviceService#getLeafUnbrandedProduct} and {@link
   * DeviceService#getRootUnbrandedProduct}).
   */
  private static SnowstormRelationship statedIsA(
      String sourceId, String targetId, String targetTerm) {
    SnowstormRelationship r = new SnowstormRelationship();
    r.setActive(true);
    r.setTypeId(SnomedConstants.IS_A.getValue());
    // filterActiveStatedRelationshipByType checks r.getType().getConceptId().
    r.setType(toSnowstormConceptMini(SnomedConstants.IS_A.getValue(), "Is a (attribute)"));
    r.setCharacteristicType(SnomedConstants.STATED_RELATIONSHIP.getValue());
    r.setGroupId(0);
    r.setSourceId(sourceId);
    r.setDestinationId(targetId);
    r.setTarget(toSnowstormConceptMini(targetId, targetTerm));
    return r;
  }

  /**
   * Creates a generic stated relationship from {@code sourceId} of the given type to {@code
   * targetId}. Use this for non-IS_A relationships where only typeId and target matter.
   */
  private static SnowstormRelationship statedRelationship(
      String sourceId, String typeId, String targetId, String targetTerm) {
    SnowstormRelationship r = new SnowstormRelationship();
    r.setActive(true);
    r.setTypeId(typeId);
    r.setType(toSnowstormConceptMini(typeId, typeId + " (attribute)"));
    r.setCharacteristicType(SnomedConstants.STATED_RELATIONSHIP.getValue());
    r.setGroupId(0);
    r.setSourceId(sourceId);
    r.setDestinationId(targetId);
    r.setTarget(toSnowstormConceptMini(targetId, targetTerm));
    return r;
  }

  /** Creates a minimal refset membership record placing a concept in a given reference set. */
  private static SnowstormReferenceSetMember refsetMember(String conceptId, String refsetId) {
    SnowstormReferenceSetMember m = new SnowstormReferenceSetMember();
    m.setActive(true);
    m.setReferencedComponentId(conceptId);
    m.setRefsetId(refsetId);
    return m;
  }
}
