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

import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINS_CD;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.DEFINED;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRODUCT_NAME;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConcreteValue;
import au.csiro.snowstorm_client.model.SnowstormConcreteValue.DataTypeEnum;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.configuration.Configuration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.product.BrandWithIdentifiers;
import au.gov.digitalhealth.lingo.product.FsnAndPt;
import au.gov.digitalhealth.lingo.product.NameGeneratorSpec;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductBrands;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.bulk.BrandPackSizeCreationDetails;
import au.gov.digitalhealth.lingo.service.namegenerator.NameGenerationClient;
import au.gov.digitalhealth.lingo.util.NmpcConstants;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;
import org.mockito.stubbing.Answer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.MockReset;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Verifies that {@link BrandPackSizeService#calculateNewBrandPackSizes} transfers the user-supplied
 * {@code brandedProductName} from {@link BrandWithIdentifiers} onto the new-concept details of the
 * branded leaf product (AMP / REAL_CLINICAL_DRUG) for NMPC bulk-brand calculations.
 *
 * <p>Snowstorm is mocked so this test does not require a running Snowstorm instance. {@link
 * ProductSummaryService} is also mocked to return a hand-crafted NMPC product summary, bypassing
 * the complex ECL lookups that the real service performs. The name-generation client is mocked; the
 * assertion targets only the field transfer, not the generated descriptions.
 *
 * <p>Coverage note — the {@code isNewConcept()} guard inside {@code
 * createNewBrandedProductNode.thenApply} is not exercised for an existing-concept negative path
 * here: because Snowstorm ECL is mocked to return empty, every generated node becomes a new concept
 * and {@code isNewConcept()} is always true. The guard is verified by inspection and follows the
 * identical pattern used by the adjacent strengthFormat block. A negative path (existing concept,
 * brandedProductName NOT set) is left to broader integration coverage.
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
class BulkBrandBrandedNameTest {

  /**
   * NMPC branch path. {@link Models#getModelConfiguration(String)} converts {@code |} to {@code _}
   * for key lookup, so the underscore form avoids any URL-filter encoding.
   */
  private static final String NMPC_BRANCH = "MAIN_SNOMEDCT-IE";

  // ---------------------------------------------------------------------------
  // SCTIDs — real NMPC SCTIDs that pass Verhoeff check-digit validation.
  // ---------------------------------------------------------------------------

  /** Source AMP (branded leaf product, REAL_CLINICAL_DRUG). */
  private static final String AMP_ID = NmpcConstants.PACKAGE_NMPC.getValue(); // 689861000220100

  /** Source TPP (branded leaf package, REAL_PACKAGED_CLINICAL_DRUG). */
  private static final String TPP_ID =
      NmpcConstants.CONTAINS_DEVICE_NMPC.getValue(); // 689871000220106

  /** TP (branded root product, REAL_MEDICINAL_PRODUCT). */
  private static final String TP_ID =
      NmpcConstants.VIRTUAL_MEDICINAL_PRODUCT.getValue(); // 660341000220102

  /** MPUU (unbranded leaf product, CLINICAL_DRUG). */
  private static final String MPUU_ID =
      "660371000220109"; // NMPC CLINICAL_DRUG refset — a valid SCTID

  /** MPP (unbranded leaf package, PACKAGED_CLINICAL_DRUG). */
  private static final String MPP_ID =
      "660391000220105"; // NMPC PACKAGED_CLINICAL_DRUG refset — a valid SCTID

  /** MP (unbranded root product, MEDICINAL_PRODUCT_ONLY). */
  private static final String MP_ID =
      "660351000220100"; // NMPC MEDICINAL_PRODUCT_ONLY refset — a valid SCTID

  // Terms for IS_A targets — must contain parentheses for toSnowstormConceptMini(id, term).
  private static final String AMP_TERM = "Source AMP (real clinical drug)";
  private static final String TPP_TERM = "Source TPP (real packaged clinical drug)";
  private static final String TP_TERM = "Source TP (real medicinal product)";
  private static final String MPUU_TERM = "Source MPUU (clinical drug)";
  private static final String MPP_TERM = "Source MPP (packaged clinical drug)";
  private static final String MP_TERM = "Source MP (medicinal product)";

  /** The existing brand on the source AMP and TPP. */
  private static final String EXISTING_BRAND_ID =
      "660361000220103"; // NMPC TP refset — a valid SCTID

  /** Term for the existing brand — must contain parentheses for toSnowstormConceptMini. */
  private static final String EXISTING_BRAND_TERM = "Existing Brand (product name)";

  /** A NEW brand concept (different from EXISTING_BRAND_ID → triggers new-node creation). */
  private static final String NEW_BRAND_ID =
      "660381000220107"; // NMPC REAL_CLINICAL_DRUG refset — a valid SCTID

  @MockBean(reset = MockReset.NONE)
  SnowstormClient snowstormClient;

  @MockBean(reset = MockReset.NONE)
  NameGenerationClient nameGenerationClient;

  @MockBean(reset = MockReset.NONE)
  ProductSummaryService productSummaryService;

  @Autowired BrandPackSizeService brandPackSizeService;

  @Autowired Models models;

  @BeforeEach
  void stubMocks() {
    // -----------------------------------------------------------------------
    // ProductSummaryService: return a hand-crafted NMPC product summary.
    // This bypasses the complex ECL-based product-model traversal in the real
    // service and provides all six NMPC model-level nodes needed by
    // calculateNewBrandPackSizes.
    // -----------------------------------------------------------------------
    when(productSummaryService.getProductSummary(anyString(), anyString()))
        .thenReturn(buildNmpcProductSummary());

    // -----------------------------------------------------------------------
    // getBrowserConcepts: return SnowstormConcept objects for all six nodes.
    // The leaf branded package (TPP) and leaf branded product (AMP) are used
    // directly by calculateNewBrandPackSizes for validation and relationship
    // cloning. The others are looked up but not read beyond getConceptId().
    // -----------------------------------------------------------------------
    when(snowstormClient.getBrowserConcepts(anyString(), any()))
        .thenReturn(
            Flux.just(
                buildTppConcept(),
                buildAmpConcept(),
                buildTpConcept(),
                buildMppConcept(),
                buildMpuuConcept(),
                buildMpConcept()));

    // -----------------------------------------------------------------------
    // ECL lookups: return empty so every generated node becomes a new concept.
    // NameGenerationRouter.getEclConceptPts also calls getConceptsFromEcl with
    // a different overload — stub both. NodeGeneratorService.generateNode calls
    // getConceptsFromEcl when skipLookup=false; returning empty causes it to
    // fall through to new-concept creation (isNewConcept() == true).
    // -----------------------------------------------------------------------
    when(snowstormClient.getConceptsFromEcl(anyString(), anyString(), anyInt(), anyBoolean()))
        .thenReturn(List.of());
    when(snowstormClient.getConceptsFromEcl(
            anyString(), anyString(), anyInt(), anyInt(), anyBoolean()))
        .thenReturn(List.of());
    when(snowstormClient.getConceptsFromEcl(
            anyString(), anyString(), anyInt(), anyInt(), anyBoolean(), any()))
        .thenReturn(List.of());

    // -----------------------------------------------------------------------
    // Task / project change-tracking: no concepts changed (consumed by
    // getProductSummary → updateNodeChangeStatus, but mocked away here).
    // -----------------------------------------------------------------------
    when(snowstormClient.getConceptIdsChangedOnTask(anyString())).thenReturn(Mono.just(List.of()));
    when(snowstormClient.getConceptIdsChangedOnProject(anyString()))
        .thenReturn(Mono.just(List.of()));

    // -----------------------------------------------------------------------
    // Name generator: return a plausible stub FSN and PT.
    // -----------------------------------------------------------------------
    when(nameGenerationClient.generateNames(any(NameGeneratorSpec.class)))
        .thenAnswer(
            (Answer<FsnAndPt>)
                invocation -> {
                  NameGeneratorSpec spec = invocation.getArgument(0, NameGeneratorSpec.class);
                  return FsnAndPt.builder()
                      .FSN("Mock fully specified name (" + spec.getTag() + ")")
                      .PT("Mock preferred term")
                      .build();
                });
  }

  @Test
  void bulkBrandPassesBrandedProductNameToNewAmp() {
    // Arrange: a BrandPackSizeCreationDetails for the source AMP's product with one NEW brand
    // carrying brandedProductName. The new brand's concept ID differs from EXISTING_BRAND_ID so
    // calculateNewBrandPackSizes triggers createNewBrandedProductNode for each branded level.
    BrandPackSizeCreationDetails details = buildDetailsWithNewBrand("NewBrand 50 mg hard capsules");

    // Act
    ProductSummary summary = brandPackSizeService.calculateNewBrandPackSizes(NMPC_BRANCH, details);

    // Assert: find the new-concept node at the NMPC leaf branded product level (REAL_CLINICAL_DRUG
    // /
    // AMP) and verify brandedProductName was threaded through.
    //
    // Coverage note — isNewConcept() is always true here because ECL returns empty (see
    // @BeforeEach).
    // The guard for isNewConcept() == false (existing concept → name NOT set) is left to broader
    // integration coverage; the guard follows the identical pattern as the adjacent strengthFormat
    // and nameGeneratorProductName blocks.
    ModelLevelType leafLevel =
        models.getModelConfiguration(NMPC_BRANCH).getLeafProductModelLevel().getModelLevelType();

    Node newAmp =
        summary.getNodes().stream()
            .filter(Node::isNewConcept)
            .filter(n -> n.getModelLevel().equals(leafLevel))
            .findFirst()
            .orElseThrow(
                () ->
                    new AssertionError(
                        "No new-concept node at REAL_CLINICAL_DRUG (AMP) leaf level "
                            + leafLevel
                            + "; nodes: "
                            + summary.getNodes()));

    assertThat(newAmp.getNewConceptDetails().getBrandedProductName())
        .isEqualTo("NewBrand 50 mg hard capsules");
  }

  // ---------------------------------------------------------------------------
  // Helpers — build the request and product summary
  // ---------------------------------------------------------------------------

  /**
   * Builds a {@link BrandPackSizeCreationDetails} for the source AMP product with exactly one new
   * brand entry. The new brand has a concept ID different from {@code EXISTING_BRAND_ID} so {@code
   * calculateNewBrandPackSizes} will call {@code createNewBrandedProductNode} for each branded
   * level (TP and AMP).
   */
  private BrandPackSizeCreationDetails buildDetailsWithNewBrand(String brandedProductName) {
    SnowstormConceptMini newBrandMini = mini(NEW_BRAND_ID, "NewBrand (product name)");

    BrandWithIdentifiers newBrand =
        BrandWithIdentifiers.builder()
            .brand(newBrandMini)
            .brandedProductName(brandedProductName)
            .build();

    ProductBrands productBrands = new ProductBrands();
    productBrands.setProductId(AMP_ID);
    productBrands.setBrands(new HashSet<>(Set.of(newBrand)));

    return BrandPackSizeCreationDetails.builder().productId(AMP_ID).brands(productBrands).build();
  }

  /**
   * Builds a hand-crafted NMPC {@link ProductSummary} containing all six model-level nodes needed
   * by {@code calculateNewBrandPackSizes}:
   *
   * <ul>
   *   <li>TPP (REAL_PACKAGED_CLINICAL_DRUG) — branded leaf package
   *   <li>AMP (REAL_CLINICAL_DRUG) — branded leaf product
   *   <li>TP (REAL_MEDICINAL_PRODUCT) — branded root product
   *   <li>MPP (PACKAGED_CLINICAL_DRUG) — unbranded leaf package
   *   <li>MPUU (CLINICAL_DRUG) — unbranded leaf product
   *   <li>MP (MEDICINAL_PRODUCT_ONLY) — unbranded root product
   * </ul>
   *
   * Each node uses an existing concept mini (not a new concept) so the node is not itself a new
   * concept in the source summary — the bulk-brand flow then creates new nodes for the new brand.
   */
  private ProductSummary buildNmpcProductSummary() {
    ProductSummary summary = new ProductSummary();

    summary.addNode(
        existingNode(TPP_ID, TPP_TERM, "TPP", ModelLevelType.REAL_PACKAGED_CLINICAL_DRUG));
    summary.addNode(existingNode(AMP_ID, AMP_TERM, "TPUU", ModelLevelType.REAL_CLINICAL_DRUG));
    summary.addNode(existingNode(TP_ID, TP_TERM, "TP", ModelLevelType.REAL_MEDICINAL_PRODUCT));
    summary.addNode(existingNode(MPP_ID, MPP_TERM, "MPP", ModelLevelType.PACKAGED_CLINICAL_DRUG));
    summary.addNode(existingNode(MPUU_ID, MPUU_TERM, "MPUU", ModelLevelType.CLINICAL_DRUG));
    summary.addNode(existingNode(MP_ID, MP_TERM, "MP", ModelLevelType.MEDICINAL_PRODUCT_ONLY));

    return summary;
  }

  /**
   * Creates a {@link Node} backed by an existing concept mini (not a new-concept node).
   *
   * @param conceptId SCTID
   * @param term preferred term for the mini
   * @param label display label (e.g. "TPUU")
   * @param modelLevelType model level for this node
   */
  private static Node existingNode(
      String conceptId, String term, String label, ModelLevelType modelLevelType) {
    Node node = new Node();
    node.setConcept(mini(conceptId, term));
    node.setLabel(label);
    node.setDisplayName(label);
    node.setModelLevel(modelLevelType);
    return node;
  }

  // ---------------------------------------------------------------------------
  // SnowstormConcept builders — returned by getBrowserConcepts mock
  // ---------------------------------------------------------------------------

  /**
   * Builds the source TPP (REAL_PACKAGED_CLINICAL_DRUG) concept. The axiom must have:
   *
   * <ul>
   *   <li>IS_A → MPUU parent (not strictly required but realistic)
   *   <li>HAS_PACK_SIZE_VALUE concrete relationship (read by getSingleActiveBigDecimal)
   *   <li>CONTAINS_CD → AMP (read by assertSingleComponentSinglePackProduct)
   *   <li>HAS_PRODUCT_NAME → EXISTING_BRAND_ID (read by validateSingleBrand for NMPC)
   * </ul>
   *
   * For NMPC, validateSingleBrand only checks the AMP's HAS_PRODUCT_NAME (not the TPP's), so the
   * TPP's HAS_PRODUCT_NAME is not strictly required but included for realism.
   */
  private SnowstormConcept buildTppConcept() {
    SnowstormRelationship isA = statedIsA(TPP_ID, MPP_ID, MPP_TERM);
    SnowstormRelationship containsCd = statedRel(TPP_ID, CONTAINS_CD.getValue(), AMP_ID, AMP_TERM);
    SnowstormRelationship packSize = concreteRel(TPP_ID, HAS_PACK_SIZE_VALUE.getValue(), "1");
    SnowstormRelationship brand =
        statedRel(TPP_ID, HAS_PRODUCT_NAME.getValue(), EXISTING_BRAND_ID, EXISTING_BRAND_TERM);

    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.setActive(true);
    axiom.setDefinitionStatusId(DEFINED.getValue());
    axiom.setRelationships(Set.of(isA, containsCd, packSize, brand));

    SnowstormConcept concept = new SnowstormConcept();
    concept.setConceptId(TPP_ID);
    concept.setPt(new SnowstormTermLangPojo().term(TPP_TERM));
    concept.setDefinitionStatusId(DEFINED.getValue());
    concept.setClassAxioms(Set.of(axiom));
    concept.setRelationships(Set.of());
    return concept;
  }

  /**
   * Builds the source AMP (REAL_CLINICAL_DRUG) concept. The axiom must have:
   *
   * <ul>
   *   <li>IS_A → MPUU parent
   *   <li>IS_A → TP (existing brand parent)
   *   <li>HAS_PRODUCT_NAME → EXISTING_BRAND_ID (read by validateSingleBrand)
   * </ul>
   */
  private SnowstormConcept buildAmpConcept() {
    SnowstormRelationship isAMpuu = statedIsA(AMP_ID, MPUU_ID, MPUU_TERM);
    SnowstormRelationship isATp = statedIsA(AMP_ID, TP_ID, TP_TERM);
    SnowstormRelationship brand =
        statedRel(AMP_ID, HAS_PRODUCT_NAME.getValue(), EXISTING_BRAND_ID, EXISTING_BRAND_TERM);

    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.setActive(true);
    axiom.setDefinitionStatusId(DEFINED.getValue());
    axiom.setRelationships(Set.of(isAMpuu, isATp, brand));

    SnowstormConcept concept = new SnowstormConcept();
    concept.setConceptId(AMP_ID);
    concept.setPt(new SnowstormTermLangPojo().term(AMP_TERM));
    concept.setDefinitionStatusId(DEFINED.getValue());
    concept.setClassAxioms(Set.of(axiom));
    concept.setRelationships(Set.of());
    return concept;
  }

  /** Builds the source TP (REAL_MEDICINAL_PRODUCT) concept with a minimal single axiom. */
  private SnowstormConcept buildTpConcept() {
    SnowstormRelationship isA = statedIsA(TP_ID, MP_ID, MP_TERM);

    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.setActive(true);
    axiom.setDefinitionStatusId(DEFINED.getValue());
    axiom.setRelationships(Set.of(isA));

    SnowstormConcept concept = new SnowstormConcept();
    concept.setConceptId(TP_ID);
    concept.setPt(new SnowstormTermLangPojo().term(TP_TERM));
    concept.setDefinitionStatusId(DEFINED.getValue());
    concept.setClassAxioms(Set.of(axiom));
    concept.setRelationships(Set.of());
    return concept;
  }

  /** Builds the source MPP (PACKAGED_CLINICAL_DRUG) concept with a minimal axiom. */
  private SnowstormConcept buildMppConcept() {
    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.setActive(true);
    axiom.setDefinitionStatusId(SnomedConstants.PRIMITIVE.getValue());
    axiom.setRelationships(Set.of());

    SnowstormConcept concept = new SnowstormConcept();
    concept.setConceptId(MPP_ID);
    concept.setPt(new SnowstormTermLangPojo().term(MPP_TERM));
    concept.setDefinitionStatusId(SnomedConstants.PRIMITIVE.getValue());
    concept.setClassAxioms(Set.of(axiom));
    concept.setRelationships(Set.of());
    return concept;
  }

  /** Builds the source MPUU (CLINICAL_DRUG) concept with a minimal axiom. */
  private SnowstormConcept buildMpuuConcept() {
    SnowstormRelationship isA = statedIsA(MPUU_ID, MP_ID, MP_TERM);

    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.setActive(true);
    axiom.setDefinitionStatusId(SnomedConstants.PRIMITIVE.getValue());
    axiom.setRelationships(Set.of(isA));

    SnowstormConcept concept = new SnowstormConcept();
    concept.setConceptId(MPUU_ID);
    concept.setPt(new SnowstormTermLangPojo().term(MPUU_TERM));
    concept.setDefinitionStatusId(SnomedConstants.PRIMITIVE.getValue());
    concept.setClassAxioms(Set.of(axiom));
    concept.setRelationships(Set.of());
    return concept;
  }

  /** Builds the source MP (MEDICINAL_PRODUCT_ONLY) concept with a minimal empty axiom. */
  private SnowstormConcept buildMpConcept() {
    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.setActive(true);
    axiom.setDefinitionStatusId(SnomedConstants.PRIMITIVE.getValue());
    axiom.setRelationships(Set.of());

    SnowstormConcept concept = new SnowstormConcept();
    concept.setConceptId(MP_ID);
    concept.setPt(new SnowstormTermLangPojo().term(MP_TERM));
    concept.setDefinitionStatusId(SnomedConstants.PRIMITIVE.getValue());
    concept.setClassAxioms(Set.of(axiom));
    concept.setRelationships(Set.of());
    return concept;
  }

  // ---------------------------------------------------------------------------
  // Relationship builders
  // ---------------------------------------------------------------------------

  private static SnowstormRelationship statedIsA(
      String sourceId, String targetId, String targetTerm) {
    SnowstormRelationship r = new SnowstormRelationship();
    r.setActive(true);
    r.setTypeId(IS_A.getValue());
    r.setType(mini(IS_A.getValue(), "Is a (attribute)"));
    r.setCharacteristicType(SnomedConstants.STATED_RELATIONSHIP.getValue());
    r.setGroupId(0);
    r.setSourceId(sourceId);
    r.setDestinationId(targetId);
    r.setTarget(mini(targetId, targetTerm));
    r.setConcrete(false);
    return r;
  }

  private static SnowstormRelationship statedRel(
      String sourceId, String typeId, String targetId, String targetTerm) {
    SnowstormRelationship r = new SnowstormRelationship();
    r.setActive(true);
    r.setTypeId(typeId);
    r.setType(mini(typeId, "Attribute (" + typeId + ")"));
    r.setCharacteristicType(SnomedConstants.STATED_RELATIONSHIP.getValue());
    r.setGroupId(1);
    r.setSourceId(sourceId);
    r.setDestinationId(targetId);
    r.setTarget(mini(targetId, targetTerm));
    r.setConcrete(false);
    return r;
  }

  private static SnowstormRelationship concreteRel(String sourceId, String typeId, String value) {
    SnowstormRelationship r = new SnowstormRelationship();
    r.setActive(true);
    r.setTypeId(typeId);
    r.setType(mini(typeId, "Attribute (" + typeId + ")"));
    r.setCharacteristicType(SnomedConstants.STATED_RELATIONSHIP.getValue());
    r.setGroupId(1);
    r.setSourceId(sourceId);
    r.setConcrete(true);
    r.setConcreteValue(
        new SnowstormConcreteValue()
            .value(value)
            .dataType(DataTypeEnum.DECIMAL)
            .valueWithPrefix("#" + value));
    return r;
  }

  /**
   * Builds a minimal {@link SnowstormConceptMini} without calling {@link
   * SnowstormDtoUtil#toSnowstormConceptMini(String, String)}, which requires the term to contain a
   * parenthetical suffix. This helper accepts arbitrary terms and sets both fsn and pt directly.
   */
  private static SnowstormConceptMini mini(String id, String term) {
    return new SnowstormConceptMini()
        .conceptId(id)
        .id(id)
        .active(true)
        .definitionStatus("PRIMITIVE")
        .definitionStatusId(SnomedConstants.PRIMITIVE.getValue())
        .fsn(new SnowstormTermLangPojo().lang("en").term(term))
        .pt(new SnowstormTermLangPojo().lang("en").term(term));
  }
}
