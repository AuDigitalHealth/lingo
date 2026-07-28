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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.when;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormItemsPageReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.configuration.Configuration;
import au.gov.digitalhealth.lingo.exception.AtomicDataExtractionProblem;
import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.service.fhir.FhirClient;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockReset;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Verifies {@link DeviceService#getProductAtomicData} detects an inconsistent device product model
 * where the two routes to the VTM disagree (CUST1679268).
 *
 * <p>The Advance Catheter data: the AMP's unbranded route (AMP → VMP 19923001 |Catheter, device| →
 * 63653004 |Biomedical device|) resolves a different VTM than its branded route (AMP → ATM
 * 797811000220100 |Hollister (real device)| → 49062001 |Device|), both VTMs being VTM reference set
 * members. Loading such a product must fail with a clear data problem naming both VTMs rather than
 * silently authoring against the VMP-route VTM (which re-parents the product and spawns a duplicate
 * ATM on update).
 *
 * <p>The check costs a single (cached) ECL query per device product: the VTM reference set members
 * among the ancestors of the product's ATM(s). It passes when that set is empty (no ATM route) or
 * contains the VTM resolved from the unbranded route.
 *
 * <p>Snowstorm is mocked; see {@link AtomicDataBrandedNameTest} for the pattern. {@link Isolated}
 * prevents concurrent stubbing races on the shared mock beans.
 */
@SpringBootTest(
    classes = Configuration.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Isolated
class DeviceVtmRouteConsistencyTest {

  private static final String NMPC_BRANCH = "MAIN_SNOMEDCT-IE";
  private static final String AMT_BRANCH = "MAIN_SNOMEDCT-AU";

  /** SCTIDs from the CUST1679268 repro. */
  private static final String AMP_ID = "918691000220103";

  private static final String VMP_ID = "19923001";
  private static final String ATM_ID = "797811000220100";
  private static final String BIOMEDICAL_DEVICE_ID = "63653004";
  private static final String DEVICE_ID = "49062001";
  private static final String BRAND_ID = "774167006";

  /** NMPC model level refsets. */
  private static final String NMPC_AMP_REFSET = "660381000220107";

  private static final String NMPC_VMP_REFSET = "660371000220109";
  private static final String NMPC_VTM_REFSET = "660351000220100";
  private static final String NMPC_ATM_REFSET = "660361000220103";

  /** AMT model level refsets and stub SCTIDs. */
  private static final String AMT_TPUU_REFSET = "929360031000036100";

  private static final String AMT_MPUU_REFSET = "929360071000036103";
  private static final String AMT_MP_REFSET = "929360061000036106";
  private static final String AMT_TPUU_ID = "929360051000036108";
  private static final String AMT_MPUU_ID = "929360081000036101";
  private static final String AMT_MP_ID = "929360061000036106";

  @MockitoBean(reset = MockReset.NONE)
  SnowstormClient snowstormClient;

  @MockitoBean(reset = MockReset.NONE)
  FhirClient fhirClient;

  @Autowired DeviceService deviceService;

  @Test
  void inconsistentVtmRoutesFailTheLoadWithAClearDataProblem() {
    // ATM route leads only to Device, unbranded route resolves Biomedical device
    stubNmpcGraph(List.of(DEVICE_ID));

    assertThatThrownBy(() -> deviceService.getProductAtomicData(NMPC_BRANCH, AMP_ID))
        .isInstanceOf(AtomicDataExtractionProblem.class)
        .hasMessageContaining(BIOMEDICAL_DEVICE_ID)
        .hasMessageContaining(DEVICE_ID);
  }

  @Test
  void consistentVtmRoutesLoadNormally() {
    // ATM under Biomedical device: its VTM-refset ancestors include both VTMs
    stubNmpcGraph(List.of(BIOMEDICAL_DEVICE_ID, DEVICE_ID));

    DeviceProductDetails productDetails = deviceService.getProductAtomicData(NMPC_BRANCH, AMP_ID);

    assertThat(productDetails.getDeviceType().getConceptId()).isEqualTo(BIOMEDICAL_DEVICE_ID);
    assertThat(productDetails.getSpecificDeviceType().getConceptId()).isEqualTo(VMP_ID);
  }

  @Test
  void productWithoutAnAtmRouteLoadsNormally() {
    stubNmpcGraph(List.of());

    DeviceProductDetails productDetails = deviceService.getProductAtomicData(NMPC_BRANCH, AMP_ID);

    assertThat(productDetails.getDeviceType().getConceptId()).isEqualTo(BIOMEDICAL_DEVICE_ID);
  }

  @Test
  void amtModelHasNoAtmLevelSoTheCheckDoesNotApply() {
    stubAmtGraph();

    DeviceProductDetails productDetails =
        deviceService.getProductAtomicData(AMT_BRANCH, AMT_TPUU_ID);

    assertThat(productDetails.getDeviceType().getConceptId()).isEqualTo(AMT_MP_ID);
  }

  /**
   * NMPC graph mirroring the repro: AMP → VMP → Biomedical device (VTM refset) on the unbranded
   * route, with the branded route's VTM-refset ancestors (the consistency-check ECL result) stubbed
   * to {@code atmRouteVtmIds}.
   */
  private void stubNmpcGraph(List<String> atmRouteVtmIds) {
    SnowstormConcept amp =
        concept(
            AMP_ID,
            "Advance Catheter 92062 (real clinical device)",
            statedIsA(AMP_ID, VMP_ID, "Catheter, device (physical object)"),
            statedIsA(AMP_ID, ATM_ID, "Hollister (real device)"),
            statedRelationship(
                AMP_ID,
                SnomedConstants.HAS_PRODUCT_NAME.getValue(),
                BRAND_ID,
                "Hollister (product name)"));
    SnowstormConcept vmp =
        concept(
            VMP_ID,
            "Catheter, device (physical object)",
            statedIsA(VMP_ID, BIOMEDICAL_DEVICE_ID, "Biomedical device (physical object)"));
    SnowstormConcept biomedicalDevice =
        concept(BIOMEDICAL_DEVICE_ID, "Biomedical device (physical object)");
    SnowstormConcept device = concept(DEVICE_ID, "Device (physical object)");

    // extraction scope: self + stated ancestors in the VMP/VTM refsets (the ATM is not included)
    when(snowstormClient.getConceptsIdsFromEcl(
            anyString(), anyString(), anyLong(), anyInt(), anyInt(), anyBoolean()))
        .thenReturn(List.of(AMP_ID, VMP_ID, BIOMEDICAL_DEVICE_ID, DEVICE_ID));

    // the route-consistency check's single query - distinguished by the ATM refset in the ECL
    when(snowstormClient.getConceptsIdsFromEcl(
            anyString(), contains(NMPC_ATM_REFSET), anyLong(), anyInt(), anyInt(), anyBoolean()))
        .thenReturn(atmRouteVtmIds);

    when(snowstormClient.getBrowserConcepts(anyString(), any()))
        .thenReturn(Flux.just(amp, vmp, biomedicalDevice, device));

    when(snowstormClient.getRefsetMembers(anyString(), any(), any(), anyInt(), anyInt()))
        .thenReturn(
            Mono.just(
                new SnowstormItemsPageReferenceSetMember()
                    .items(
                        List.of(
                            refsetMember(AMP_ID, NMPC_AMP_REFSET),
                            refsetMember(VMP_ID, NMPC_VMP_REFSET),
                            refsetMember(BIOMEDICAL_DEVICE_ID, NMPC_VTM_REFSET),
                            refsetMember(DEVICE_ID, NMPC_VTM_REFSET)))));
  }

  /** AMT graph: no ATM (REAL_MEDICINAL_PRODUCT) level exists, so the check must not run. */
  private void stubAmtGraph() {
    SnowstormConcept tpuu =
        concept(
            AMT_TPUU_ID,
            "Acme catheter (branded physical object)",
            statedIsA(AMT_TPUU_ID, AMT_MPUU_ID, "Catheter (physical object)"),
            statedRelationship(
                AMT_TPUU_ID,
                SnomedConstants.HAS_PRODUCT_NAME.getValue(),
                BRAND_ID,
                "Acme (product name)"));
    SnowstormConcept mpuu =
        concept(
            AMT_MPUU_ID,
            "Catheter (physical object)",
            statedIsA(AMT_MPUU_ID, AMT_MP_ID, "Catheter (physical object)"));
    SnowstormConcept mp = concept(AMT_MP_ID, "Catheter (physical object)");

    when(snowstormClient.getConceptsIdsFromEcl(
            anyString(), anyString(), anyLong(), anyInt(), anyInt(), anyBoolean()))
        .thenReturn(List.of(AMT_TPUU_ID, AMT_MPUU_ID, AMT_MP_ID));

    when(snowstormClient.getBrowserConcepts(anyString(), any()))
        .thenReturn(Flux.just(tpuu, mpuu, mp));

    when(snowstormClient.getRefsetMembers(anyString(), any(), any(), anyInt(), anyInt()))
        .thenReturn(
            Mono.just(
                new SnowstormItemsPageReferenceSetMember()
                    .items(
                        List.of(
                            refsetMember(AMT_TPUU_ID, AMT_TPUU_REFSET),
                            refsetMember(AMT_MPUU_ID, AMT_MPUU_REFSET),
                            refsetMember(AMT_MP_ID, AMT_MP_REFSET)))));
  }

  // ---------------------------------------------------------------------------
  // Builders
  // ---------------------------------------------------------------------------

  private static SnowstormConcept concept(
      String conceptId, String pt, SnowstormRelationship... axiomRelationships) {
    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.setActive(true);
    axiom.setRelationships(Set.of(axiomRelationships));

    SnowstormConcept concept = new SnowstormConcept();
    concept.setConceptId(conceptId);
    concept.setPt(new SnowstormTermLangPojo().term(pt));
    concept.setDefinitionStatusId(SnomedConstants.PRIMITIVE.getValue());
    concept.setClassAxioms(Set.of(axiom));
    concept.setRelationships(Set.of());
    return concept;
  }

  private static SnowstormRelationship statedIsA(
      String sourceId, String targetId, String targetTerm) {
    return statedRelationship(sourceId, SnomedConstants.IS_A.getValue(), targetId, targetTerm);
  }

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

  private static SnowstormReferenceSetMember refsetMember(String conceptId, String refsetId) {
    SnowstormReferenceSetMember m = new SnowstormReferenceSetMember();
    m.setActive(true);
    m.setReferencedComponentId(conceptId);
    m.setRefsetId(refsetId);
    return m;
  }
}
