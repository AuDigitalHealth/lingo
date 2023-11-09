package com.csiro.snomio.service;

import static com.csiro.snomio.service.ProductService.CONTAINS_LABEL;
import static com.csiro.snomio.service.ProductService.CTPP_LABEL;
import static com.csiro.snomio.service.ProductService.HAS_PRODUCT_NAME_LABEL;
import static com.csiro.snomio.service.ProductService.IS_A_LABEL;
import static com.csiro.snomio.service.ProductService.MPP_LABEL;
import static com.csiro.snomio.service.ProductService.MPUU_LABEL;
import static com.csiro.snomio.service.ProductService.MP_LABEL;
import static com.csiro.snomio.service.ProductService.TPP_LABEL;
import static com.csiro.snomio.service.ProductService.TPUU_LABEL;
import static com.csiro.snomio.service.ProductService.TP_LABEL;
import static com.csiro.snomio.util.AmtConstants.CONCENTRATION_STRENGTH_UNIT;
import static com.csiro.snomio.util.AmtConstants.CONCENTRATION_STRENGTH_VALUE;
import static com.csiro.snomio.util.AmtConstants.CTPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.HAS_CONTAINER_TYPE;
import static com.csiro.snomio.util.AmtConstants.HAS_DEVICE_TYPE;
import static com.csiro.snomio.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static com.csiro.snomio.util.AmtConstants.HAS_TOTAL_QUANTITY_UNIT;
import static com.csiro.snomio.util.AmtConstants.HAS_TOTAL_QUANTITY_VALUE;
import static com.csiro.snomio.util.AmtConstants.MPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.MPUU_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.MP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.SCT_AU_MODULE;
import static com.csiro.snomio.util.AmtConstants.TPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.TPUU_REFSET_ID;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_CLINICAL_DRUG_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CLINICAL_DRUG_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CONTAINS_CD;
import static com.csiro.snomio.util.SnomedConstants.DEFINED;
import static com.csiro.snomio.util.SnomedConstants.HAS_ACTIVE_INGREDIENT;
import static com.csiro.snomio.util.SnomedConstants.HAS_BOSS;
import static com.csiro.snomio.util.SnomedConstants.HAS_MANUFACTURED_DOSE_FORM;
import static com.csiro.snomio.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static com.csiro.snomio.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static com.csiro.snomio.util.SnomedConstants.HAS_PRECISE_ACTIVE_INGREDIENT;
import static com.csiro.snomio.util.SnomedConstants.HAS_PRODUCT_NAME;
import static com.csiro.snomio.util.SnomedConstants.IS_A;
import static com.csiro.snomio.util.SnomedConstants.MEDICINAL_PRODUCT;
import static com.csiro.snomio.util.SnomedConstants.MEDICINAL_PRODUCT_PACKAGE;
import static com.csiro.snomio.util.SnomedConstants.MEDICINAL_PRODUCT_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.PRIMITIVE;
import static com.csiro.snomio.util.SnomedConstants.UNIT_OF_PRESENTATION;
import static com.csiro.snomio.util.SnowstormDtoUtil.addQuantityIfNotNull;
import static com.csiro.snomio.util.SnowstormDtoUtil.addRelationshipIfNotNull;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSnowstormDatatypeComponent;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSnowstormRelationship;
import static com.csiro.snomio.util.SnowstormDtoUtil.toSnowstormComceptMini;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConceptView;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import com.csiro.snomio.exception.EmptyProductCreationProblem;
import com.csiro.snomio.exception.ProductAtomicDataValidationProblem;
import com.csiro.snomio.models.product.Edge;
import com.csiro.snomio.models.product.Ingredient;
import com.csiro.snomio.models.product.MedicationProductDetails;
import com.csiro.snomio.models.product.NewConceptDetails;
import com.csiro.snomio.models.product.Node;
import com.csiro.snomio.models.product.PackageDetails;
import com.csiro.snomio.models.product.PackageQuantity;
import com.csiro.snomio.models.product.ProductQuantity;
import com.csiro.snomio.models.product.ProductSummary;
import com.csiro.snomio.models.product.Quantity;
import com.csiro.snomio.util.EclBuilder;
import com.csiro.snomio.util.SnomedConstants;
import com.csiro.snomio.util.SnowstormDtoUtil;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class MedicationCreationService {

  SnowstormClient snowstormClient;
  NameGenerationService nameGenerationService;

  @Autowired
  public MedicationCreationService(
      SnowstormClient snowstormClient, NameGenerationService nameGenerationService) {
    this.snowstormClient = snowstormClient;
    this.nameGenerationService = nameGenerationService;
  }

  /**
   * Creates the product concepts in the ProductSummary that are new concepts and returns an updated
   * ProductSummary with the new concepts.
   *
   * @param branch branch to write the changes to
   * @param productSummary ProductSummary containing the concepts to create
   * @return ProductSummary with the new concepts
   */
  public ProductSummary createProductFromAtomicData(String branch, ProductSummary productSummary) {
    if (productSummary.getNodes().stream().noneMatch(Node::isNewConcept)) {
      throw new EmptyProductCreationProblem();
    }

    Map<String, String> idMap = new HashMap<>();

    List<Node> nodes =
        productSummary.getNodes().stream()
            .filter(n -> n.isNewConcept())
            .sorted(
                (o1, o2) -> {
                  if (o1.getNewConceptDetails()
                          .containsTarget(o2.getNewConceptDetails().getConceptId())
                      && o2.getNewConceptDetails()
                          .containsTarget(o1.getNewConceptDetails().getConceptId())) {
                    throw new RuntimeException(
                        o1.getIdAndFsnTerm()
                            + " and "
                            + o2.getIdAndFsnTerm()
                            + " refer to each other");
                  }

                  if (o1.getNewConceptDetails()
                      .containsTarget(o2.getNewConceptDetails().getConceptId())) {
                    return 1;
                  } else if (o2.getNewConceptDetails()
                      .containsTarget(o1.getNewConceptDetails().getConceptId())) {
                    return -1;
                  } else if (o1.getNewConceptDetails().refersToUuid()
                      && !o2.getNewConceptDetails().refersToUuid()) {
                    return 1;
                  } else if (o2.getNewConceptDetails().refersToUuid()
                      && !o1.getNewConceptDetails().refersToUuid()) {
                    return -1;
                  } else {
                    return 0;
                  }
                })
            .toList();

    for (Node node : nodes) {
      createConcept(branch, node, idMap);
    }

    for (Edge edge : productSummary.getEdges()) {
      if (idMap.containsKey(edge.getSource())) {
        edge.setSource(idMap.get(edge.getSource()));
      }
      if (idMap.containsKey(edge.getTarget())) {
        edge.setTarget(idMap.get(edge.getTarget()));
      }
    }

    productSummary.getSubject().setConceptId(idMap.get(productSummary.getSubject().getConceptId()));

    return productSummary;
  }

  private void createConcept(String branch, Node node, Map<String, String> idMap) {
    SnowstormConceptView concept = new SnowstormConceptView();
    concept.setRelationships(Set.of());
    concept.setGciAxioms(Set.of());
    if (node.getNewConceptDetails().getConceptId() != null) {
      concept.setConceptId(node.getNewConceptDetails().getConceptId().toString());
    }
    concept.setModuleId(SCT_AU_MODULE);

    NewConceptDetails newConceptDetails = node.getNewConceptDetails();

    SnowstormDtoUtil.addDescription(
        concept, newConceptDetails.getPreferredTerm(), SnomedConstants.SYNONYM);
    SnowstormDtoUtil.addDescription(
        concept, newConceptDetails.getFullySpecifiedName(), SnomedConstants.FSN);

    concept.setActive(true);
    concept.setDefinitionStatusId(
        newConceptDetails.getAxioms().stream()
                .anyMatch(a -> a.getDefinitionStatus().equals(DEFINED))
            ? DEFINED
            : PRIMITIVE);
    concept.setClassAxioms(newConceptDetails.getAxioms());

    concept.getClassAxioms().stream()
        .forEach(
            a ->
                a.getRelationships()
                    .forEach(
                        r -> {
                          if (idMap.containsKey(r.getDestinationId())) {
                            r.setDestinationId(idMap.get(r.getDestinationId()));
                          }
                        }));

    if (newConceptDetails.getSpecifiedConceptId() != null
        && snowstormClient.conceptExists(branch, newConceptDetails.getSpecifiedConceptId())) {
      throw new ProductAtomicDataValidationProblem(
          "Concept with id " + newConceptDetails.getSpecifiedConceptId() + " already exists");
    }

    concept.setConceptId(newConceptDetails.getSpecifiedConceptId());

    concept = snowstormClient.createConcept(branch, concept, false);

    node.setConcept(toSnowstormComceptMini(concept));
    node.setNewConceptDetails(null);
    if (!newConceptDetails.getConceptId().toString().equals(concept.getConceptId())) {
      idMap.put(newConceptDetails.getConceptId().toString(), concept.getConceptId());
    }

    snowstormClient.createRefsetMembership(
        branch, getRefsetId(node.getLabel()), concept.getConceptId());
  }

  private String getRefsetId(String label) {
    switch (label) {
      case MPP_LABEL:
        return MPP_REFSET_ID;
      case TPP_LABEL:
        return TPP_REFSET_ID;
      case CTPP_LABEL:
        return CTPP_REFSET_ID;
      case MP_LABEL:
        return MP_REFSET_ID;
      case MPUU_LABEL:
        return MPUU_REFSET_ID;
      case TPUU_LABEL:
        return TPUU_REFSET_ID;
      default:
        throw new IllegalArgumentException("Unknown refset for label " + label);
    }
  }

  /**
   * Calculates the existing and new products required to create a product based on the product
   * details.
   *
   * @param branch branch to lookup concepts in
   * @param packageDetails details of the product to create
   * @return ProductSummary representing the existing and new concepts required to create this
   *     product
   */
  public ProductSummary calculateProductFromAtomicData(
      String branch, PackageDetails<MedicationProductDetails> packageDetails) {

    return calculateCreatePackage(branch, packageDetails);
  }

  private ProductSummary calculateCreatePackage(
      String branch, PackageDetails<MedicationProductDetails> packageDetails) {
    ProductSummary productSummary = new ProductSummary();

    validatePackageDetails(packageDetails);

    Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries =
        new HashMap<>();
    for (PackageQuantity<MedicationProductDetails> packageQuantity :
        packageDetails.getContainedPackages()) {
      validatePackageQuantity(packageQuantity);
      ProductSummary innerPackageSummary =
          calculateCreatePackage(branch, packageQuantity.getPackageDetails());
      innerPackageSummaries.put(packageQuantity, innerPackageSummary);
    }

    Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries =
        new HashMap<>();
    for (ProductQuantity<MedicationProductDetails> productQuantity :
        packageDetails.getContainedProducts()) {
      validateProductQuantity(branch, productQuantity);
      ProductSummary innerProductSummary =
          createProduct(branch, productQuantity.getProductDetails());
      innnerProductSummaries.put(productQuantity, innerProductSummary);
    }

    Node mpp =
        getOrCreatePackagedClinicalDrug(
            branch,
            packageDetails,
            innerPackageSummaries,
            innnerProductSummaries,
            null,
            false,
            false);
    productSummary.addNode(mpp);

    Node tpp =
        getOrCreatePackagedClinicalDrug(
            branch,
            packageDetails,
            innerPackageSummaries,
            innnerProductSummaries,
            mpp,
            true,
            false);
    productSummary.addNode(tpp);
    productSummary.addEdge(tpp.getConceptId(), mpp.getConceptId(), IS_A_LABEL);

    Node ctpp =
        getOrCreatePackagedClinicalDrug(
            branch, packageDetails, innerPackageSummaries, innnerProductSummaries, tpp, true, true);
    productSummary.addNode(ctpp);
    productSummary.addEdge(ctpp.getConceptId(), tpp.getConceptId(), IS_A_LABEL);

    productSummary.setSubject(SnowstormDtoUtil.toSnowstormComceptMini(ctpp.toConceptMini()));

    productSummary.addNode(packageDetails.getProductName(), TP_LABEL);
    productSummary.addEdge(
        tpp.getConceptId(), packageDetails.getProductName().getConceptId(), HAS_PRODUCT_NAME_LABEL);

    for (ProductSummary summary : innerPackageSummaries.values()) {
      productSummary.addSummary(summary);
      productSummary.addEdge(
          ctpp.getConceptId(), summary.getSubject().getConceptId(), CONTAINS_LABEL);
      productSummary.addEdge(
          tpp.getConceptId(), summary.getSingleConceptWithLabel(TPP_LABEL), CONTAINS_LABEL);
      productSummary.addEdge(
          mpp.getConceptId(), summary.getSingleConceptWithLabel(MPP_LABEL), CONTAINS_LABEL);
    }

    for (ProductSummary summary : innnerProductSummaries.values()) {
      productSummary.addSummary(summary);
      productSummary.addEdge(
          ctpp.getConceptId(), summary.getSubject().getConceptId(), CONTAINS_LABEL);
      productSummary.addEdge(
          tpp.getConceptId(), summary.getSubject().getConceptId(), CONTAINS_LABEL);
      productSummary.addEdge(
          mpp.getConceptId(), summary.getSingleConceptWithLabel(MPUU_LABEL), CONTAINS_LABEL);
    }

    return productSummary;
  }

  private Node getOrCreatePackagedClinicalDrug(
      String branch,
      PackageDetails<MedicationProductDetails> packageDetails,
      Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries,
      Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries,
      Node parent,
      boolean branded,
      boolean container) {

    String label;
    if (branded) {
      if (container) {
        label = CTPP_LABEL;
      } else {
        label = TPP_LABEL;
      }
    } else {
      label = MPP_LABEL;
    }

    String packagedClinicalDrugEcl =
        EclBuilder.getPackagedClinicalDrugEcl(
            packageDetails, innerPackageSummaries, innnerProductSummaries, branded, container);

    if (innerPackageSummaries.entrySet().stream()
            .anyMatch(e -> e.getValue().getNodes().stream().anyMatch(n -> n.isNewConcept()))
        || innnerProductSummaries.entrySet().stream()
            .anyMatch(e -> e.getValue().getNodes().stream().anyMatch(n -> n.isNewConcept()))) {
      packagedClinicalDrugEcl = null;
    }

    // If the references to contained products/packages are to new concepts then don't even run the
    // ECL
    if (packagedClinicalDrugEcl == null) {
      return createPackagedClinicalDrug(
          packageDetails,
          innerPackageSummaries,
          innnerProductSummaries,
          parent,
          branded,
          container);
    } else {
      return getOptionalNodeWithLabel(branch, packagedClinicalDrugEcl, label)
          .orElse(
              createPackagedClinicalDrug(
                  packageDetails,
                  innerPackageSummaries,
                  innnerProductSummaries,
                  parent,
                  branded,
                  container));
    }
  }

  private Node createPackagedClinicalDrug(
      PackageDetails<MedicationProductDetails> packageDetails,
      Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries,
      Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries,
      Node parent,
      boolean branded,
      boolean container) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, MEDICINAL_PRODUCT_PACKAGE, 0));
    if (parent != null) {
      relationships.add(getSnowstormRelationship(IS_A, parent.getConceptId(), 0));
    }

    if (branded && container) {
      addRelationshipIfNotNull(
          relationships, packageDetails.getContainerType(), HAS_CONTAINER_TYPE, 0);
    } else if (branded) {
      addRelationshipIfNotNull(relationships, packageDetails.getProductName(), HAS_PRODUCT_NAME, 0);
    }

    int group = 1;
    for (Entry<ProductQuantity<MedicationProductDetails>, ProductSummary> entry :
        innnerProductSummaries.entrySet()) {
      String containedId;
      ProductSummary productSummary = entry.getValue();
      if (branded) {
        containedId = productSummary.getSubject().getConceptId();
      } else {
        containedId = productSummary.getSingleConceptWithLabel(MPUU_LABEL);
      }
      relationships.add(getSnowstormRelationship(CONTAINS_CD, containedId, group));

      ProductQuantity<MedicationProductDetails> quantity = entry.getKey();
      relationships.add(
          getSnowstormRelationship(HAS_PACK_SIZE_UNIT, quantity.getUnit().getConceptId(), group));
      relationships.add(
          getSnowstormDatatypeComponent(HAS_PACK_SIZE_VALUE, quantity.getValue(), group));
      group++;
    }

    for (Entry<PackageQuantity<MedicationProductDetails>, ProductSummary> entry :
        innerPackageSummaries.entrySet()) {
      String containedId;
      ProductSummary productSummary = entry.getValue();
      if (branded && container) {
        containedId = productSummary.getSubject().getConceptId();
      } else if (branded) {
        containedId = productSummary.getSingleConceptWithLabel(TPP_LABEL);
      } else {
        containedId = productSummary.getSingleConceptWithLabel(MPP_LABEL);
      }
      relationships.add(getSnowstormRelationship(CONTAINS_CD, containedId, group));

      PackageQuantity<MedicationProductDetails> quantity = entry.getKey();
      relationships.add(
          getSnowstormRelationship(HAS_PACK_SIZE_UNIT, quantity.getUnit().getConceptId(), group));
      relationships.add(
          getSnowstormDatatypeComponent(HAS_PACK_SIZE_VALUE, quantity.getValue(), group));
      group++;
    }

    String semanticTag;
    String label;
    if (branded) {
      if (container) {
        label = CTPP_LABEL;
        semanticTag = CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
      } else {
        label = TPP_LABEL;
        semanticTag = BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
      }
    } else {
      label = MPP_LABEL;
      semanticTag = CLINICAL_DRUG_SEMANTIC_TAG;
    }

    return createNewConceptNode(DEFINED, relationships, semanticTag, label);
  }

  private Optional<Node> getOptionalNodeWithLabel(String branch, String ecl, String label) {
    return snowstormClient.getOptionalConceptFromEcl(branch, ecl).map(c -> new Node(c, label));
  }

  private ProductSummary createProduct(String branch, MedicationProductDetails productDetails) {
    ProductSummary productSummary = new ProductSummary();

    Node mp =
        getOptionalNodeWithLabel(branch, EclBuilder.getMpEcl(productDetails), MP_LABEL)
            .orElse(createMp(productDetails));
    productSummary.addNode(mp);

    Node mpuu =
        getOptionalNodeWithLabel(
                branch, EclBuilder.getMedicinalUnitEcl(productDetails, false), MPUU_LABEL)
            .orElse(createClinicalDrug(productDetails, false));
    productSummary.addNode(mpuu);
    productSummary.addEdge(mpuu.getConceptId(), mp.getConceptId(), IS_A_LABEL);

    Node tpuu =
        getOptionalNodeWithLabel(
                branch, EclBuilder.getMedicinalUnitEcl(productDetails, true), TPUU_LABEL)
            .orElse(createClinicalDrug(productDetails, true));
    productSummary.addNode(tpuu);
    productSummary.addEdge(tpuu.getConceptId(), mpuu.getConceptId(), IS_A_LABEL);

    productSummary.addNode(productDetails.getProductName(), TP_LABEL);
    productSummary.addEdge(
        tpuu.getConceptId(),
        productDetails.getProductName().getConceptId(),
        HAS_PRODUCT_NAME_LABEL);

    // TODO this is horrible, the types generated from openapi are terrible. Need to fix this.
    productSummary.setSubject(SnowstormDtoUtil.toSnowstormComceptMini(tpuu.toConceptMini()));

    return productSummary;
  }

  private Node createClinicalDrug(MedicationProductDetails productDetails, boolean branded) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, MEDICINAL_PRODUCT, 0));

    if (branded) {
      relationships.add(
          getSnowstormRelationship(
              HAS_PRODUCT_NAME, productDetails.getProductName().getConceptId(), 0));

      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_OTHER_IDENTIFYING_INFORMATION,
              StringUtils.hasLength(productDetails.getOtherIdentifyingInformation())
                  ? "None"
                  : productDetails.getOtherIdentifyingInformation(),
              0));
    }

    addRelationshipIfNotNull(
        relationships, productDetails.getContainerType(), HAS_CONTAINER_TYPE, 0);
    addRelationshipIfNotNull(relationships, productDetails.getDeviceType(), HAS_DEVICE_TYPE, 0);

    String doseFormId =
        productDetails.getGenericForm() == null
            ? null
            : productDetails.getGenericForm().getConceptId();
    doseFormId =
        productDetails.getSpecificForm() == null
            ? doseFormId
            : productDetails.getSpecificForm().getConceptId();
    if (doseFormId != null) {
      relationships.add(getSnowstormRelationship(HAS_MANUFACTURED_DOSE_FORM, doseFormId, 0));
    }

    addQuantityIfNotNull(
        productDetails.getQuantity(), relationships, HAS_PACK_SIZE_VALUE, HAS_PACK_SIZE_UNIT, 0);

    int group = 1;
    for (Ingredient ingredient : productDetails.getActiveIngredients()) {
      addRelationshipIfNotNull(
          relationships, ingredient.getActiveIngredient(), HAS_ACTIVE_INGREDIENT, group);
      addRelationshipIfNotNull(
          relationships, ingredient.getPreciseIngredient(), HAS_PRECISE_ACTIVE_INGREDIENT, group);
      addRelationshipIfNotNull(
          relationships, ingredient.getBasisOfStrengthSubstance(), HAS_BOSS, group);
      addQuantityIfNotNull(
          ingredient.getTotalQuantity(),
          relationships,
          HAS_TOTAL_QUANTITY_VALUE,
          HAS_TOTAL_QUANTITY_UNIT,
          group);
      addQuantityIfNotNull(
          ingredient.getConcentrationStrength(),
          relationships,
          CONCENTRATION_STRENGTH_VALUE,
          CONCENTRATION_STRENGTH_UNIT,
          group);
      group++;
    }

    return createNewConceptNode(
        DEFINED,
        relationships,
        branded ? BRANDED_CLINICAL_DRUG_SEMANTIC_TAG : CLINICAL_DRUG_SEMANTIC_TAG,
        branded ? TPUU_LABEL : MPUU_LABEL);
  }

  private Node createMp(MedicationProductDetails productDetails) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, MEDICINAL_PRODUCT, 0));
    int group = 1;
    for (Ingredient ingredient : productDetails.getActiveIngredients()) {
      relationships.add(
          getSnowstormRelationship(
              HAS_ACTIVE_INGREDIENT, ingredient.getActiveIngredient().getConceptId(), group));
      group++;
    }
    return createNewConceptNode(DEFINED, relationships, MEDICINAL_PRODUCT_SEMANTIC_TAG, MP_LABEL);
  }

  private boolean isIntegerValue(BigDecimal bd) {
    return bd.stripTrailingZeros().scale() <= 0;
  }

  private void validateProductQuantity(
      String branch, ProductQuantity<MedicationProductDetails> productQuantity) {
    // Leave the MRCM validation to the MRCM - the UI should already enforce this and the validation
    // in the MS will catch it. Validating here will just slow things down.
    validateQuantityValueIsOneIfUnitIsEach(productQuantity);

    // if the contained product has a container/device type or a quantity then the unit must be
    // each and the quantity must be an integer
    if ((productQuantity.getProductDetails().getContainerType() != null
            || productQuantity.getProductDetails().getDeviceType() != null
            || productQuantity.getProductDetails().getQuantity() != null)
        && (productQuantity.getUnit().getConceptId().equals(UNIT_OF_PRESENTATION)
            && !isIntegerValue(productQuantity.getValue()))) {
      throw new ProductAtomicDataValidationProblem(
          "Product quantity must not have a container type, device type or quantity");
    }

    // -- for each ingredient
    // --- total quantity unit if present must not me composite
    // --- concentration strength if present must be composite unit
    for (Ingredient ingredient : productQuantity.getProductDetails().getActiveIngredients()) {
      if (ingredient.getTotalQuantity() != null
          && snowstormClient.isCompositeUnit(branch, ingredient.getTotalQuantity().getUnit())) {
        throw new ProductAtomicDataValidationProblem(
            "Total quantity unit must not be composite. Ingredient was "
                + getIdAndFsnTerm(ingredient.getActiveIngredient())
                + " with unit "
                + getIdAndFsnTerm(ingredient.getTotalQuantity().getUnit()));
      }

      if (ingredient.getConcentrationStrength() != null
          && !snowstormClient.isCompositeUnit(
              branch, ingredient.getConcentrationStrength().getUnit())) {
        throw new ProductAtomicDataValidationProblem(
            "Concentration strength unit must be composite. Ingredient was "
                + getIdAndFsnTerm(ingredient.getActiveIngredient())
                + " with unit "
                + getIdAndFsnTerm(ingredient.getConcentrationStrength().getUnit()));
      }
    }
  }

  private String getIdAndFsnTerm(SnowstormConceptMini component) {
    return component.getConceptId() + "|" + component.getFsn().getTerm() + "|";
  }

  private Node createNewConceptNode(
      String definitionStatus,
      Set<SnowstormRelationship> relationships,
      String semanticTag,
      String label) {

    Node node = new Node();
    node.setLabel(label);
    NewConceptDetails newConceptDetails = new NewConceptDetails();
    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.active(true);
    axiom.setDefinitionStatus(definitionStatus);
    axiom.setRelationships(relationships);
    newConceptDetails.getAxioms().add(axiom);
    newConceptDetails.setFullySpecifiedName(nameGenerationService.createFsn(semanticTag, axiom));
    newConceptDetails.setPreferredTerm(
        nameGenerationService.createPreferredTerm(semanticTag, axiom));
    newConceptDetails.setSemanticTag(semanticTag);
    node.setNewConceptDetails(newConceptDetails);
    return node;
  }

  private void validatePackageQuantity(PackageQuantity<MedicationProductDetails> packageQuantity) {
    // Leave the MRCM validation to the MRCM - the UI should already enforce this and the validation
    // in the MS will catch it. Validating here will just slow things down.

    // -- package quantity unit must be each and the quantitiy must be an integer
    validateQuantityValueIsOneIfUnitIsEach(packageQuantity);

    // validate that the package is only nested one deep
    if (packageQuantity.getPackageDetails().getContainedPackages() != null
        && !packageQuantity.getPackageDetails().getContainedPackages().isEmpty()) {
      throw new ProductAtomicDataValidationProblem(
          "A contained package must not contain further packages - nesting is only one level deep");
    }
  }

  private void validateQuantityValueIsOneIfUnitIsEach(Quantity quantity) {
    if (quantity.getUnit().getConceptId().equals(UNIT_OF_PRESENTATION)
        && !isIntegerValue(quantity.getValue())) {
      throw new ProductAtomicDataValidationProblem(
          "Quantity must be an integer if the unit is 'each', unit was "
              + getIdAndFsnTerm(quantity.getUnit()));
    }
  }

  private void validatePackageDetails(PackageDetails<MedicationProductDetails> packageDetails) {
    // Leave the MRCM validation to the MRCM - the UI should already enforce this and the validation
    // in the MS will catch it. Validating here will just slow things down.

    // validate the package details
    // - product name is a product name - MRCM?
    // - container type is a container type - MRCM?
  }
}
