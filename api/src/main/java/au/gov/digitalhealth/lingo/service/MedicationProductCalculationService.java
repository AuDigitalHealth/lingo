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

import static au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType.CLINICAL_DRUG;
import static au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType.MEDICINAL_PRODUCT_ONLY;
import static au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType.REAL_CLINICAL_DRUG;
import static au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType.REAL_MEDICINAL_PRODUCT;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONCENTRATION_STRENGTH_UNIT;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONCENTRATION_STRENGTH_VALUE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONTAINS_PACKAGED_CD;
import static au.gov.digitalhealth.lingo.util.AmtConstants.COUNT_OF_CD_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.COUNT_OF_CONTAINED_COMPONENT_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.AmtConstants.COUNT_OF_CONTAINED_PACKAGE_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_CONTAINER_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_DEVICE_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_TOTAL_QUANTITY_UNIT;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_TOTAL_QUANTITY_VALUE;
import static au.gov.digitalhealth.lingo.util.NmpcConstants.ACTIVE_IMMUNITY_STIMULANT;
import static au.gov.digitalhealth.lingo.util.NmpcConstants.VIRTUAL_MEDICINAL_PRODUCT;
import static au.gov.digitalhealth.lingo.util.NonDefiningPropertiesConverter.calculateNonDefiningRelationships;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINS_CD;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.COUNT_OF_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_BOSS;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_CONCENTRATION_STRENGTH_DENOMINATOR_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_CONCENTRATION_STRENGTH_DENOMINATOR_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_CONCENTRATION_STRENGTH_NUMERATOR_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_CONCENTRATION_STRENGTH_NUMERATOR_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_MANUFACTURED_DOSE_FORM;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRECISE_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRESENTATION_STRENGTH_DENOMINATOR_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRESENTATION_STRENGTH_DENOMINATOR_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRESENTATION_STRENGTH_NUMERATOR_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRESENTATION_STRENGTH_NUMERATOR_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRODUCT_NAME;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_QUALITATIVE_STRENGTH;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_TARGET_POPULATION;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_UNIT_OF_PRESENTATION;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_UNIT_OF_PRESENTATION_SIZE_QUANTITY;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_UNIT_OF_PRESENTATION_SIZE_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MEDICINAL_PRODUCT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MEDICINAL_PRODUCT_PACKAGE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PLAYS_ROLE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.STATED_RELATIONSHIP;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.addQuantityIfNotNull;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.addRelationshipIfNotNull;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleAxiom;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSnowstormDatatypeComponent;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSnowstormRelationship;
import static java.lang.Boolean.TRUE;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConcreteValue.DataTypeEnum;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.Ingredient;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.NutritionalProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.PackageQuantity;
import au.gov.digitalhealth.lingo.product.details.ProductQuantity;
import au.gov.digitalhealth.lingo.product.details.VaccineProductDetails;
import au.gov.digitalhealth.lingo.service.fhir.FhirClient;
import au.gov.digitalhealth.lingo.service.validators.MedicationDetailsValidator;
import au.gov.digitalhealth.lingo.service.validators.ValidationResult;
import au.gov.digitalhealth.lingo.util.AmtConstants;
import au.gov.digitalhealth.lingo.util.BigDecimalFormatter;
import au.gov.digitalhealth.lingo.util.OwlAxiomService;
import au.gov.digitalhealth.lingo.util.ReferenceSetUtils;
import au.gov.digitalhealth.lingo.util.RelationshipSorter;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import au.gov.digitalhealth.lingo.validation.AuthoringValidation;
import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.groups.Default;
import java.util.Arrays;
import java.util.Collection;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.function.Function;
import java.util.logging.Level;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.util.Pair;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;
import reactor.core.publisher.Mono;

@Service
@Log
@Validated({AuthoringValidation.class, Default.class})
public class MedicationProductCalculationService
    extends ProductCalculationService<MedicationProductDetails> {

  private final Map<String, MedicationDetailsValidator> medicationDetailsValidatorByQualifier;
  private final FhirClient fhirClient;
  SnowstormClient snowstormClient;
  NameGenerationService nameGenerationService;
  TicketServiceImpl ticketService;
  OwlAxiomService owlAxiomService;
  ObjectMapper objectMapper;
  NodeGeneratorService nodeGeneratorService;
  Models models;
  ProductSummaryService productSummaryService;
  MedicationProductCalculationService self;

  @Value("${snomio.decimal-scale}")
  int decimalScale;

  @Autowired
  public MedicationProductCalculationService(
      SnowstormClient snowstormClient,
      NameGenerationService nameGenerationService,
      TicketServiceImpl ticketService,
      OwlAxiomService owlAxiomService,
      ObjectMapper objectMapper,
      NodeGeneratorService nodeGeneratorService,
      Models models,
      Map<String, MedicationDetailsValidator> medicationDetailsValidatorByQualifier,
      ProductSummaryService productSummaryService,
      @Lazy MedicationProductCalculationService self,
      FhirClient fhirClient) {
    this.snowstormClient = snowstormClient;
    this.nameGenerationService = nameGenerationService;
    this.ticketService = ticketService;
    this.owlAxiomService = owlAxiomService;
    this.objectMapper = objectMapper;
    this.nodeGeneratorService = nodeGeneratorService;
    this.models = models;
    this.medicationDetailsValidatorByQualifier = medicationDetailsValidatorByQualifier;
    this.productSummaryService = productSummaryService;
    this.self = self;
    this.fhirClient = fhirClient;
  }

  private static void addParent(Node mpuuNode, Node mpNode, String moduleId) {
    if (mpuuNode.isNewConcept()) {
      mpuuNode
          .getNewConceptDetails()
          .getAxioms()
          .forEach(
              a -> a.getRelationships().add(getSnowstormRelationship(IS_A, mpNode, 0, moduleId)));
    }
  }

  private static void connectOuterAndInnerProductSummaries(
      ModelConfiguration modelConfiguration,
      Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries,
      Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries,
      ProductSummary productSummary,
      Map<ModelLevelType, Node> packageNodeMap) {
    for (ProductSummary summary : innerPackageSummaries.values()) {
      productSummary.addSummary(summary);

      for (Node packageNode : packageNodeMap.values()) {
        productSummary.addEdge(
            packageNode.getConceptId(),
            summary
                .getSingleConceptWithLabel(
                    modelConfiguration
                        .getLevelOfType(packageNode.getModelLevel())
                        .getDisplayLabel())
                .getConceptId(),
            ProductSummaryService.CONTAINS_LABEL);
      }
    }

    for (ProductSummary summary : innnerProductSummaries.values()) {
      productSummary.addSummary(summary);

      final String brandedProductId = summary.getSingleSubject().getConceptId();
      final String unbrandedProductId =
          productSummary.getSingleTargetOfTypeWithLabel(
              brandedProductId,
              modelConfiguration.getLeafUnbrandedProductModelLevel().getDisplayLabel(),
              ProductSummaryService.IS_A_LABEL);
      packageNodeMap.values().stream()
          .filter(node -> node.getModelLevel().isBranded())
          .forEach(
              brandedPackageNode ->
                  productSummary.addEdge(
                      brandedPackageNode.getConceptId(),
                      brandedProductId,
                      ProductSummaryService.CONTAINS_LABEL));
      // connect the unbranded package node to the parent unbranded product nodes
      packageNodeMap.values().stream()
          .filter(node -> !node.getModelLevel().isBranded())
          .forEach(
              unbrandedPackageNode ->
                  productSummary.addEdge(
                      unbrandedPackageNode.getConceptId(),
                      unbrandedProductId,
                      ProductSummaryService.CONTAINS_LABEL));
    }
  }

  private static void addProductNameNode(
      PackageDetails<MedicationProductDetails> packageDetails,
      ModelConfiguration modelConfiguration,
      ProductSummary productSummary,
      Map<ModelLevelType, Node> packageNodeMap) {
    if (modelConfiguration.containsModelLevel(ModelLevelType.PRODUCT_NAME)
        || packageDetails.getProductName() != null) {
      productSummary.addNode(
          packageDetails.getProductName(),
          modelConfiguration.getLevelOfType(ModelLevelType.PRODUCT_NAME));
      for (Node node : packageNodeMap.values()) {
        if (node.getModelLevel().isBranded()) {
          productSummary.addEdge(
              node.getConceptId(),
              packageDetails.getProductName().getConceptId(),
              ProductSummaryService.HAS_PRODUCT_NAME_LABEL);
        }
      }
    }
  }

  private void addCountOfBaseAndActiveIngredient(
      String branch,
      MedicationProductDetails productDetails,
      ModelConfiguration modelConfiguration,
      Set<SnowstormRelationship> relationships) {
    if (productDetails.getActiveIngredients() != null
        && !productDetails.getActiveIngredients().isEmpty()
        && productDetails.getActiveIngredients().stream()
            .anyMatch(i -> i != null && i.getActiveIngredient() != null)) {

      final Set<String> activeSubstanceIds =
          productDetails.getActiveIngredients().stream()
              .map(i -> i.getActiveIngredient().getConceptId())
              .filter(Objects::nonNull)
              .collect(Collectors.toSet());

      final Collection<String> baseIds =
          getBaseActiveIngredients(branch, productDetails, modelConfiguration, activeSubstanceIds);

      relationships.add(
          getSnowstormDatatypeComponent(
              SnomedConstants.COUNT_OF_BASE_ACTIVE_INGREDIENT,
              Integer.toString(baseIds.size()),
              DataTypeEnum.INTEGER,
              0,
              SnomedConstants.STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));

      if (baseIds.size() != activeSubstanceIds.size()) {
        relationships.add(
            getSnowstormDatatypeComponent(
                COUNT_OF_ACTIVE_INGREDIENT,
                Integer.toString(activeSubstanceIds.size()),
                DataTypeEnum.INTEGER,
                0,
                SnomedConstants.STATED_RELATIONSHIP,
                modelConfiguration.getModuleId()));
      }
    }
  }

  private Collection<String> getBaseActiveIngredients(
      String branch,
      MedicationProductDetails productDetails,
      ModelConfiguration modelConfiguration,
      Set<String> activeSubstanceIds) {
    final String activeSubstanceOrClause = String.join(" OR ", activeSubstanceIds);

    if (log.isLoggable(Level.FINE)) {
      log.fine(
          "Calculating count of base active ingredients for branch: "
              + branch
              + ", substanceIds: "
              + activeSubstanceOrClause);
    }

    // find the base substances for the set of active ingredients
    Collection<String> baseIds =
        snowstormClient.getConceptIdsFromEcl(
            branch,
            "((<ids>) or ((<ids>).738774007) or (((<ids>).738774007).738774007) or ((((<ids>).738774007).738774007).738774007)) and ((< 105590001 or (<ids>)):[0..0] 738774007=*)",
            0,
            (int)
                productDetails.getActiveIngredients().stream()
                    .map(i -> i.getActiveIngredient().getConceptId())
                    .filter(Objects::nonNull)
                    .count(),
            modelConfiguration.isExecuteEclAsStated(),
            Set.of(Pair.of("<ids>", activeSubstanceOrClause)));

    if (log.isLoggable(Level.FINE)) {
      log.fine(
          "Found "
              + baseIds.size()
              + " base active ingredients for branch: "
              + branch
              + ", substanceIds: "
              + activeSubstanceOrClause);
    }
    return baseIds;
  }

  @Override
  protected SnowstormClient getSnowstormClient() {
    return snowstormClient;
  }

  @Override
  protected NodeGeneratorService getNodeGeneratorService() {
    return nodeGeneratorService;
  }

  @Async
  public CompletableFuture<ProductSummary> calculateProductFromAtomicDataAsync(
      String branch, @Valid PackageDetails<@Valid MedicationProductDetails> packageDetails)
      throws ExecutionException, InterruptedException {
    return CompletableFuture.completedFuture(
        calculateProductFromAtomicData(branch, packageDetails));
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
      String branch, @Valid PackageDetails<@Valid MedicationProductDetails> packageDetails)
      throws ExecutionException, InterruptedException {
    // todo - this is a work around because the UI doesn't know which package to put the selected
    // identifiers in, so it puts them at the top level. They need to be cascaded down to the lower
    // level packages. It is possible this isn't enough if there are different packages with
    // intersecting conceptOptions, but this will do for the moment.
    packageDetails.cascadeProperties(models.getModelConfiguration(branch));
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    optionallyAddNmpcType(branch, modelConfiguration, packageDetails);
    return calculateCreatePackage(
        branch,
        packageDetails,
        new AtomicCache(
            packageDetails.getIdFsnMap(),
            packageDetails.getIdPtMap(),
            AmtConstants.values(),
            SnomedConstants.values()));
  }

  @Override
  @Validated(Default.class)
  public ValidationResult validateProductAtomicData(
      String branch, @Valid PackageDetails<@Valid MedicationProductDetails> packageDetails)
      throws ProductAtomicDataValidationProblem {
    return validateInputData(branch, packageDetails, models.getModelConfiguration(branch));
  }

  /**
   * Calculates the existing and new concepts required to create a product based on the data
   * supplied
   *
   * @param branch branch to lookup concepts in
   * @param packageDetails details of the product to create
   * @param atomicCache cache of existing concepts and their details to build for name generation
   * @return ProductSummary representing the existing and new concepts required to create this
   *     product
   * @throws ExecutionException
   * @throws InterruptedException
   */
  private ProductSummary calculateCreatePackage(
      String branch,
      PackageDetails<MedicationProductDetails> packageDetails,
      AtomicCache atomicCache)
      throws ExecutionException, InterruptedException {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    ProductSummary productSummary = new ProductSummary();

    Mono<List<String>> taskChangedConceptIds = snowstormClient.getConceptIdsChangedOnTask(branch);

    Mono<List<String>> projectChangedConceptIds =
        snowstormClient.getConceptIdsChangedOnProject(branch);

    validateInputData(branch, packageDetails, modelConfiguration).throwIfInvalid();

    final Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries =
        calculateContainedPackages(branch, packageDetails, atomicCache);

    final Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries =
        calculateContainedProducts(branch, packageDetails, atomicCache);

    calculateOuterPackageNodes(
        branch,
        packageDetails,
        atomicCache,
        modelConfiguration,
        innerPackageSummaries,
        innnerProductSummaries,
        productSummary);

    Set<Edge> transitiveContainsEdges =
        ProductSummaryService.getTransitiveEdges(productSummary, new HashSet<>());
    productSummary.getEdges().addAll(transitiveContainsEdges);

    productSummary.getNodes().stream()
        .filter(Node::isNewConcept)
        .forEach(
            n ->
                n.getNewConceptDetails()
                    .getAxioms()
                    .forEach(RelationshipSorter::sortRelationships));

    productSummary.updateNodeChangeStatus(
        taskChangedConceptIds.block(), projectChangedConceptIds.block());

    productSummary.deduplicateNewNodes(modelConfiguration);

    return productSummary;
  }

  private void calculateOuterPackageNodes(
      String branch,
      PackageDetails<MedicationProductDetails> packageDetails,
      AtomicCache atomicCache,
      ModelConfiguration modelConfiguration,
      Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries,
      Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries,
      ProductSummary productSummary) {

    final Map<ModelLevelType, Node> packageNodeMap =
        createPackageLevelNodes(
            branch,
            packageDetails,
            atomicCache,
            modelConfiguration,
            innerPackageSummaries,
            innnerProductSummaries,
            productSummary);

    productSummary.setSingleSubject(
        packageNodeMap.get(modelConfiguration.getLeafPackageModelLevel().getModelLevelType()));

    addProductNameNode(packageDetails, modelConfiguration, productSummary, packageNodeMap);

    connectOuterAndInnerProductSummaries(
        modelConfiguration,
        innerPackageSummaries,
        innnerProductSummaries,
        productSummary,
        packageNodeMap);

    addPropertyChangeNodes(branch, modelConfiguration, productSummary);
  }

  /**
   * Creates the nodes for the package levels configured for the branch's model
   *
   * @param branch
   * @param packageDetails
   * @param atomicCache
   * @param modelConfiguration
   * @param innerPackageSummaries
   * @param innnerProductSummaries
   * @param productSummary
   * @return A map of the package level type to the node created for that level - used to connect
   *     these nodes to other ProductSummary objects for nested products/packages
   */
  private Map<ModelLevelType, Node> createPackageLevelNodes(
      String branch,
      PackageDetails<MedicationProductDetails> packageDetails,
      AtomicCache atomicCache,
      ModelConfiguration modelConfiguration,
      Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries,
      Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries,
      ProductSummary productSummary) {
    List<ModelLevel> packageLevels =
        modelConfiguration.getPackageLevels().stream()
            .sorted(ModelLevel.getModelLevelHierarchyComparator(modelConfiguration))
            .toList();

    Map<ModelLevel, CompletableFuture<Node>> packageLevelFutures = new HashMap<>();
    for (ModelLevel packageLevel : packageLevels) {
      Set<CompletableFuture<Node>> parents = new HashSet<>();

      for (ModelLevel parent :
          modelConfiguration.getParentModelLevels(packageLevel.getModelLevelType())) {
        CompletableFuture<Node> parentFuture = packageLevelFutures.get(parent);
        if (parentFuture != null) {
          parents.add(parentFuture);
        }
      }

      packageLevelFutures.put(
          packageLevel,
          CompletableFuture.allOf(parents.toArray(new CompletableFuture[parents.size()]))
              .thenCompose(
                  p -> {
                    Set<Node> parentNodes =
                        parents.stream().map(CompletableFuture::join).collect(Collectors.toSet());

                    return getOrCreatePackagedClinicalDrug(
                            branch,
                            packageDetails,
                            parentNodes,
                            innerPackageSummaries,
                            innnerProductSummaries,
                            packageLevel,
                            atomicCache)
                        .thenApply(
                            node -> {
                              generateName(
                                  atomicCache,
                                  packageDetails.hasDeviceType(),
                                  packageLevel,
                                  node,
                                  modelConfiguration,
                                  List.of());
                              productSummary.addNode(node);
                              parentNodes.forEach(
                                  parentNode -> {
                                    productSummary.addEdge(
                                        node.getConceptId(),
                                        parentNode.getConceptId(),
                                        ProductSummaryService.IS_A_LABEL);
                                  });
                              return node;
                            });
                  }));
    }

    return packageLevelFutures.values().stream()
        .map(CompletableFuture::join)
        .collect(Collectors.toMap(Node::getModelLevel, n -> n));
  }

  /**
   * Calculates the contained products for a package - i.e. the tablets in the outer pack
   *
   * @param branch
   * @param packageDetails
   * @param atomicCache
   * @return A map of the contained products and their resultant ProductSummary to add to the
   *     overall ProductSummary
   * @throws ExecutionException
   * @throws InterruptedException
   */
  private Map<ProductQuantity<MedicationProductDetails>, ProductSummary> calculateContainedProducts(
      String branch,
      PackageDetails<MedicationProductDetails> packageDetails,
      AtomicCache atomicCache)
      throws ExecutionException, InterruptedException {
    Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries =
        new HashMap<>();
    for (ProductQuantity<MedicationProductDetails> productQuantity :
        packageDetails.getContainedProducts()) {
      ProductSummary innerProductSummary =
          createProduct(
              branch,
              productQuantity.getProductDetails(),
              atomicCache,
              packageDetails.getSelectedConceptIdentifiers());
      innnerProductSummaries.put(productQuantity, innerProductSummary);
    }
    return innnerProductSummaries;
  }

  /**
   * Calculates the contained subpackages for a package
   *
   * @param branch
   * @param packageDetails
   * @param atomicCache
   * @return A map of the contained packages and their resultant ProductSummary to add to the outer
   *     ProductSummary
   * @throws ExecutionException
   * @throws InterruptedException
   */
  private Map<PackageQuantity<MedicationProductDetails>, ProductSummary> calculateContainedPackages(
      String branch,
      PackageDetails<MedicationProductDetails> packageDetails,
      AtomicCache atomicCache)
      throws ExecutionException, InterruptedException {
    Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries =
        new HashMap<>();
    for (PackageQuantity<MedicationProductDetails> packageQuantity :
        packageDetails.getContainedPackages()) {
      ProductSummary innerPackageSummary =
          calculateCreatePackage(branch, packageQuantity.getPackageDetails(), atomicCache);
      innerPackageSummaries.put(packageQuantity, innerPackageSummary);
    }
    return innerPackageSummaries;
  }

  private ValidationResult validateInputData(
      String branch,
      PackageDetails<MedicationProductDetails> packageDetails,
      ModelConfiguration modelConfiguration) {
    final MedicationDetailsValidator medicationDetailsValidator =
        medicationDetailsValidatorByQualifier.get(
            modelConfiguration.getModelType().name()
                + "-"
                + MedicationDetailsValidator.class.getSimpleName());

    if (medicationDetailsValidator == null) {
      throw new IllegalStateException(
          "No medication details validator found for model type: "
              + modelConfiguration.getModelType());
    }
    return medicationDetailsValidator.validatePackageDetails(
        packageDetails, branch, snowstormClient, fhirClient);
  }

  private CompletableFuture<Node> getOrCreatePackagedClinicalDrug(
      String branch,
      PackageDetails<MedicationProductDetails> packageDetails,
      Set<Node> parentNodes,
      Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries,
      Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries,
      ModelLevel packageLevel,
      AtomicCache atomicCache) {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    String label =
        packageDetails.hasDeviceType()
            ? packageLevel.getDrugDeviceSemanticTag()
            : packageLevel.getMedicineSemanticTag();
    Set<String> refsets = Set.of(packageLevel.getReferenceSetIdentifier());

    Set<SnowstormRelationship> relationships =
        createPackagedClinicalDrugRelationships(
            branch,
            packageDetails,
            parentNodes,
            innerPackageSummaries,
            innnerProductSummaries,
            packageLevel,
            modelConfiguration);

    // todo remove this once using transformed nmpc data - should be enforced but can't be for NMPC
    // at the moment
    boolean enforceRefsets = modelConfiguration.getModelType().equals(ModelType.AMT);

    return nodeGeneratorService.generateNodeAsync(
        branch,
        atomicCache,
        relationships,
        refsets,
        packageLevel,
        label,
        ReferenceSetUtils.calculateReferenceSetMembers(
            packageDetails, models.getModelConfiguration(branch), packageLevel.getModelLevelType()),
        calculateNonDefiningRelationships(
            models.getModelConfiguration(branch),
            packageDetails.getNonDefiningProperties(),
            packageLevel.getModelLevelType()),
        packageDetails.getSelectedConceptIdentifiers(),
        packageDetails.getNonDefiningProperties(),
        true,
        label.equals(
            modelConfiguration.getLevelOfType(ModelLevelType.PACKAGED_CLINICAL_DRUG).getName()),
        enforceRefsets,
        true,
        false);
  }

  private Set<SnowstormRelationship> createPackagedClinicalDrugRelationships(
      String branch,
      PackageDetails<MedicationProductDetails> packageDetails,
      Set<Node> parentNodes,
      Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries,
      Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries,
      ModelLevel packageLevel,
      ModelConfiguration modelConfiguration) {

    boolean branded = packageLevel.isBranded();
    boolean container = packageLevel.isContainerized();

    Set<SnowstormRelationship> relationships = new HashSet<>();
    if (parentNodes != null && !parentNodes.isEmpty()) {
      for (Node parent : parentNodes) {
        relationships.add(
            getSnowstormRelationship(IS_A, parent, 0, modelConfiguration.getModuleId()));
      }
    } else {
      relationships.add(
          getSnowstormRelationship(
              IS_A, MEDICINAL_PRODUCT_PACKAGE, 0, modelConfiguration.getModuleId()));
    }

    if (modelConfiguration.getModelType().equals(ModelType.AMT) && branded && container) {
      addRelationshipIfNotNull(
          relationships,
          packageDetails.getContainerType(),
          HAS_CONTAINER_TYPE,
          0,
          modelConfiguration.getModuleId());
    }

    if (branded) {
      addRelationshipIfNotNull(
          relationships,
          packageDetails.getProductName(),
          HAS_PRODUCT_NAME,
          0,
          modelConfiguration.getModuleId());
    }

    addPackageOtherIdentifyingInformation(
        packageDetails, modelConfiguration, packageLevel, relationships);

    int group = 1;
    for (Entry<ProductQuantity<MedicationProductDetails>, ProductSummary> entry :
        innnerProductSummaries.entrySet()) {
      Node contained;
      ProductSummary productSummary = entry.getValue();
      if (branded) {
        contained = productSummary.getSingleSubject();
      } else {
        contained = productSummary.getSingleConceptWithLabel(ProductSummaryService.MPUU_LABEL);
      }
      relationships.add(
          getSnowstormRelationship(
              CONTAINS_CD, contained, group, modelConfiguration.getModuleId()));

      ProductQuantity<MedicationProductDetails> quantity = entry.getKey();
      relationships.add(
          getSnowstormRelationship(
              HAS_PACK_SIZE_UNIT,
              quantity.getUnit(),
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_PACK_SIZE_VALUE,
              BigDecimalFormatter.formatBigDecimal(
                  quantity.getValue(), decimalScale, modelConfiguration.isTrimWholeNumbers()),
              DataTypeEnum.DECIMAL,
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));

      if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
        relationships.add(
            getSnowstormDatatypeComponent(
                COUNT_OF_CONTAINED_COMPONENT_INGREDIENT,
                // get the unique set of active ingredients
                Integer.toString(
                    quantity.getProductDetails().getActiveIngredients().stream()
                        .map(i -> i.getActiveIngredient().getConceptId())
                        .collect(Collectors.toSet())
                        .size()),
                DataTypeEnum.INTEGER,
                group,
                STATED_RELATIONSHIP,
                modelConfiguration.getModuleId()));
      }

      group++;
    }

    if (!innnerProductSummaries.isEmpty()) {
      relationships.add(
          getSnowstormDatatypeComponent(
              COUNT_OF_CD_TYPE,
              // get the unique set of CD types
              Integer.toString(
                  innnerProductSummaries.values().stream()
                      .map(v -> v.getSingleSubject().getConceptId())
                      .collect(Collectors.toSet())
                      .size()),
              DataTypeEnum.INTEGER,
              0,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    }

    for (Entry<PackageQuantity<MedicationProductDetails>, ProductSummary> entry :
        innerPackageSummaries.entrySet()) {
      Node contained;
      ProductSummary productSummary = entry.getValue();
      if (branded && container) {
        contained = productSummary.getSingleSubject();
      } else if (branded) {
        contained = productSummary.getSingleConceptWithLabel(ProductSummaryService.TPP_LABEL);
      } else {
        contained = productSummary.getSingleConceptWithLabel(ProductSummaryService.MPP_LABEL);
      }
      relationships.add(
          getSnowstormRelationship(
              CONTAINS_PACKAGED_CD, contained, group, modelConfiguration.getModuleId()));

      PackageQuantity<MedicationProductDetails> quantity = entry.getKey();
      relationships.add(
          getSnowstormRelationship(
              HAS_PACK_SIZE_UNIT,
              quantity.getUnit(),
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_PACK_SIZE_VALUE,
              BigDecimalFormatter.formatBigDecimal(
                  quantity.getValue(), decimalScale, modelConfiguration.isTrimWholeNumbers()),
              DataTypeEnum.DECIMAL,
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
      group++;
    }

    if (!innerPackageSummaries.isEmpty()) {
      relationships.add(
          getSnowstormDatatypeComponent(
              COUNT_OF_CONTAINED_PACKAGE_TYPE,
              // get the unique set of package types
              Integer.toString(
                  innerPackageSummaries.values().stream()
                      .map(v -> v.getSingleSubject().getConceptId())
                      .collect(Collectors.toSet())
                      .size()),
              DataTypeEnum.INTEGER,
              0,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    }

    return relationships;
  }

  private ProductSummary createProduct(
      String branch,
      MedicationProductDetails productDetails,
      AtomicCache atomicCache,
      Set<String> selectedConceptIdentifiers)
      throws ExecutionException, InterruptedException {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    ProductSummary productSummary = new ProductSummary();

    // sort the levels by their dependencies
    List<ModelLevel> productLevels =
        modelConfiguration.getProductLevels().stream()
            .sorted(ModelLevel.getModelLevelHierarchyComparator(modelConfiguration))
            .toList();

    Map<ModelLevel, CompletableFuture<Node>> levelFutureMap = new HashMap<>();
    for (ModelLevel level : productLevels) {
      Set<CompletableFuture<Node>> parents = new HashSet<>();

      for (ModelLevel parent : modelConfiguration.getParentModelLevels(level.getModelLevelType())) {
        CompletableFuture<Node> parentFuture = levelFutureMap.get(parent);
        if (parentFuture != null) {
          parents.add(parentFuture);
        }
      }

      levelFutureMap.put(
          level,
          CompletableFuture.allOf(parents.toArray(new CompletableFuture[parents.size()]))
              .thenCompose(
                  p -> {
                    Set<Node> parentNodes =
                        parents.stream().map(CompletableFuture::join).collect(Collectors.toSet());

                    List<String> order =
                        getOrder(level, parentNodes, productDetails, modelConfiguration);

                    return switch (level.getModelLevelType()) {
                      case MEDICINAL_PRODUCT, MEDICINAL_PRODUCT_ONLY, REAL_MEDICINAL_PRODUCT ->
                          findOrCreateMp(
                                  branch,
                                  productDetails,
                                  atomicCache,
                                  selectedConceptIdentifiers,
                                  level)
                              .thenApply(
                                  postProductNodeCreationFunction(
                                      productDetails,
                                      atomicCache,
                                      level,
                                      modelConfiguration,
                                      productSummary,
                                      parentNodes,
                                      modelConfiguration,
                                      order));
                      case CLINICAL_DRUG, REAL_CLINICAL_DRUG ->
                          findOrCreateUnit(
                                  branch,
                                  productDetails,
                                  level.getModelLevelType().equals(CLINICAL_DRUG)
                                      ? Set.of()
                                      : parentNodes,
                                  atomicCache,
                                  selectedConceptIdentifiers,
                                  level)
                              .thenApply(
                                  postProductNodeCreationFunction(
                                      productDetails,
                                      atomicCache,
                                      level,
                                      modelConfiguration,
                                      productSummary,
                                      parentNodes,
                                      modelConfiguration,
                                      order));
                      default ->
                          throw new IllegalArgumentException(
                              "Unsupported model level type: " + level.getModelLevelType());
                    };
                  }));
    }

    CompletableFuture.allOf(
            levelFutureMap.values().toArray(new CompletableFuture[levelFutureMap.size()]))
        .join();

    if (modelConfiguration.containsModelLevel(ModelLevelType.PRODUCT_NAME)) {
      productSummary.addNode(
          productDetails.getProductName(),
          modelConfiguration.getLevelOfType(ModelLevelType.PRODUCT_NAME));
      levelFutureMap.forEach(
          (key, value) -> {
            if (key.isBranded()) {
              productSummary.addEdge(
                  value.join().getConceptId(),
                  productDetails.getProductName().getConceptId(),
                  ProductSummaryService.HAS_PRODUCT_NAME_LABEL);
            }
          });
    }

    productSummary.setSingleSubject(
        levelFutureMap.get(modelConfiguration.getLeafProductModelLevel()).get());

    return productSummary;
  }

  private List<String> getOrder(
      ModelLevel level,
      Set<Node> parentNodes,
      MedicationProductDetails productDetails,
      ModelConfiguration modelConfiguration) {
    ModelLevelType rootType =
        modelConfiguration.getRootUnbrandedProductModelLevel().getModelLevelType();
    if (parentNodes.isEmpty() || level.getModelLevelType().equals(rootType)) {
      // must be the root node
      return productDetails.getActiveIngredients().stream()
          .map(i -> i.getActiveIngredient().getPt().getTerm())
          .toList();
    } else {
      Optional<Node> parent =
          parentNodes.stream().filter(n -> n.getModelLevel().equals(rootType)).findFirst();
      if (parent.isPresent()) {
        return Arrays.stream(parent.get().getPreferredTerm().split("\\+"))
            .map(String::trim)
            .toList();
      } else {
        return List.of();
      }
    }
  }

  private Function<Node, Node> postProductNodeCreationFunction(
      MedicationProductDetails productDetails,
      AtomicCache atomicCache,
      ModelLevel level,
      ModelConfiguration modelConfiguration,
      ProductSummary productSummary,
      Set<Node> parentNodes,
      ModelConfiguration branchModelConfiguration,
      List<String> order) {
    return n -> {
      generateName(atomicCache, productDetails, level, n, modelConfiguration, order);
      productSummary.addNode(n);
      for (Node parent : parentNodes) {
        productSummary.addEdge(
            n.getConceptId(), parent.getConceptId(), ProductSummaryService.IS_A_LABEL);
        if (n.isNewConcept()) {
          SnowstormAxiom axoim = getSingleAxiom(n.getNewConceptDetails());

          if (axoim.getRelationships().stream()
              .noneMatch(
                  relationship ->
                      TRUE.equals(relationship.getActive())
                          && relationship.getTypeId().equals(IS_A.getValue())
                          && relationship.getDestinationId().equals(parent.getConceptId()))) {
            axoim.addRelationshipsItem(
                getSnowstormRelationship(IS_A, parent, 0, branchModelConfiguration.getModuleId()));
          }
        }
      }
      return n;
    };
  }

  private static String generateNutritionalProductName(
      ModelLevel level, NutritionalProductDetails nutritionalProductDetails) {
    String genericName = nutritionalProductDetails.getNewGenericProductName();
    String form = nutritionalProductDetails.getGenericForm().getPt().getTerm().toLowerCase().trim();
    String unit =
        nutritionalProductDetails.getUnitOfPresentation().getPt().getTerm().toLowerCase().trim();
    String productName = nutritionalProductDetails.getProductName().getPt().getTerm();

    boolean isRealClinicalDrug = level.getModelLevelType().equals(REAL_CLINICAL_DRUG);
    String prefix = isRealClinicalDrug ? (productName + " ") : "";

    return (prefix + genericName + " " + form + " " + unit).trim();
  }

  private static void handleNutritionalProductName(
      AtomicCache atomicCache,
      ModelLevel level,
      Node node,
      NutritionalProductDetails nutritionalProductDetails) {

    if (node.isNewConcept()) {
      boolean isExistingClinicalDrug =
          level.getModelLevelType().equals(CLINICAL_DRUG)
              && nutritionalProductDetails.getExistingClinicalDrug() != null
              && nutritionalProductDetails.getExistingClinicalDrug().getConceptId() != null;

      if (level.getModelLevelType().equals(REAL_MEDICINAL_PRODUCT)) {
        // If this is a new concept, we need to generate the FSN and PT
        final String productName = nutritionalProductDetails.getProductName().getPt().getTerm();
        node.getNewConceptDetails()
            .setFullySpecifiedName(
                productName + " nutritional product (" + level.getDrugDeviceSemanticTag() + ")");
        node.getNewConceptDetails().setPreferredTerm(productName);
        atomicCache.addFsnAndPt(node.getConceptId(), productName, productName);
      } else if (!isExistingClinicalDrug
          && !level.getModelLevelType().equals(MEDICINAL_PRODUCT_ONLY)) {
        final String baseName = generateNutritionalProductName(level, nutritionalProductDetails);
        String fsn = baseName + " (" + level.getDrugDeviceSemanticTag() + ")";

        node.getNewConceptDetails().setFullySpecifiedName(fsn);
        node.getNewConceptDetails().setPreferredTerm(baseName);
        atomicCache.addFsnAndPt(node.getConceptId(), fsn, baseName);
      }
    }
  }

  private void generateName(
      AtomicCache atomicCache,
      MedicationProductDetails productDetails,
      ModelLevel level,
      Node node,
      ModelConfiguration modelConfiguration,
      List<String> order) {

    if (productDetails instanceof NutritionalProductDetails nutritionalProductDetails) {
      handleNutritionalProductName(atomicCache, level, node, nutritionalProductDetails);
    } else {
      nameGenerationService.addGeneratedFsnAndPt(
          atomicCache,
          productDetails.hasDeviceType()
              ? level.getDrugDeviceSemanticTag()
              : level.getMedicineSemanticTag(),
          node,
          modelConfiguration,
          order);
    }
  }

  private void generateName(
      AtomicCache atomicCache,
      boolean hasDeviceType,
      ModelLevel level,
      Node node,
      ModelConfiguration modelConfiguration,
      List<String> order) {

    nameGenerationService.addGeneratedFsnAndPt(
        atomicCache,
        hasDeviceType ? level.getDrugDeviceSemanticTag() : level.getMedicineSemanticTag(),
        node,
        modelConfiguration,
        order);
  }

  private Set<SnowstormRelationship> createMpRelationships(
      String branch,
      MedicationProductDetails productDetails,
      ModelLevel level,
      ModelConfiguration modelConfiguration) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(
        getSnowstormRelationship(IS_A, MEDICINAL_PRODUCT, 0, modelConfiguration.getModuleId()));

    if (productDetails.getPlaysRole() != null) {
      productDetails
          .getPlaysRole()
          .forEach(
              playsRole ->
                  addRelationshipIfNotNull(
                      relationships, playsRole, PLAYS_ROLE, 0, modelConfiguration.getModuleId()));
    }

    int group = 1;
    if (productDetails instanceof VaccineProductDetails vaccineProductDetails) {
      if (modelConfiguration.getModelType().equals(ModelType.NMPC)
          && productDetails.getPlaysRole().isEmpty()) {
        relationships.add(
            getSnowstormRelationship(
                PLAYS_ROLE, ACTIVE_IMMUNITY_STIMULANT, 0, modelConfiguration.getModuleId()));
      }
      addRelationshipIfNotNull(
          relationships,
          vaccineProductDetails.getTargetPopulation(),
          HAS_TARGET_POPULATION,
          0,
          modelConfiguration.getModuleId());
      addRelationshipIfNotNull(
          relationships,
          vaccineProductDetails.getQualitiativeStrength(),
          HAS_QUALITATIVE_STRENGTH,
          group++,
          modelConfiguration.getModuleId());
    }

    if (productDetails instanceof NutritionalProductDetails nutritionalProductDetails) {
      if (level.isBranded()) {
        relationships.add(
            getSnowstormRelationship(
                IS_A,
                productDetails.getExistingMedicinalProduct(),
                0,
                STATED_RELATIONSHIP,
                modelConfiguration.getModuleId()));
      }
      addRelationshipIfNotNull(
          relationships,
          nutritionalProductDetails.getTargetPopulation(),
          HAS_TARGET_POPULATION,
          0,
          modelConfiguration.getModuleId());
    }

    Set<SnowstormConceptMini> ingredients = new HashSet<>();
    for (Ingredient ingredient : productDetails.getActiveIngredients()) {
      if (modelConfiguration.getModelType().equals(ModelType.NMPC)
          && level.isBranded()
          && ingredient.getBasisOfStrengthSubstance() != null) {
        ingredients.add(ingredient.getBasisOfStrengthSubstance());
      } else {
        ingredients.add(ingredient.getActiveIngredient());
      }
    }
    for (SnowstormConceptMini ingredient : ingredients) {
      relationships.add(
          getSnowstormRelationship(
              HAS_ACTIVE_INGREDIENT,
              ingredient,
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
      group++;
    }

    if (level.isBranded()) {
      relationships.add(
          getSnowstormRelationship(
              HAS_PRODUCT_NAME,
              productDetails.getProductName(),
              0,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    }

    if (EnumSet.of(MEDICINAL_PRODUCT_ONLY, REAL_MEDICINAL_PRODUCT)
        .contains(level.getModelLevelType())) {
      addCountOfBaseAndActiveIngredient(branch, productDetails, modelConfiguration, relationships);
    }

    return relationships;
  }

  private CompletableFuture<Node> findOrCreateUnit(
      String branch,
      MedicationProductDetails productDetails,
      Set<Node> parents,
      AtomicCache atomicCache,
      Set<String> selectedConceptIdentifiers,
      ModelLevel level) {

    boolean branded = level.isBranded();

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    boolean skipLookup = false;

    if (productDetails instanceof NutritionalProductDetails
        && modelConfiguration.getModelType().equals(ModelType.NMPC)
        && !branded) {
      if (productDetails.getExistingClinicalDrug() != null
          && productDetails.getExistingClinicalDrug().getConceptId() != null) {
        return nodeGeneratorService.lookUpNode(
            branch,
            productDetails.getExistingClinicalDrug(),
            level,
            productDetails.getNonDefiningProperties().stream()
                .filter(
                    p ->
                        modelConfiguration
                            .getProperty(p.getIdentifierScheme())
                            .getModelLevels()
                            .contains(level.getModelLevelType()))
                .collect(Collectors.toSet()));
      } else {
        skipLookup = true;
      }
    }

    ModelLevelType modelLevelType = level.getModelLevelType();
    Set<String> referencedIds = Set.of(level.getReferenceSetIdentifier());

    Set<SnowstormRelationship> relationships =
        createClinicalDrugRelationships(
            branch, productDetails, parents, branded, modelConfiguration, level);

    boolean enforceRefsets = modelConfiguration.getModelType().equals(ModelType.AMT);

    // if the product has ingredients and they have some sort of strength or quantity then it can be
    // defined, otherwise we'll guess primitive - user can always override the decision
    boolean defined =
        !productDetails.getActiveIngredients().isEmpty()
            && productDetails.getActiveIngredients().stream()
                .allMatch(
                    i ->
                        i.getConcentrationStrength() != null
                            || i.getTotalQuantity() != null
                            || i.getPresentationStrengthNumerator() != null
                            || i.getConcentrationStrengthNumerator() != null);

    return nodeGeneratorService.generateNodeAsync(
        branch,
        atomicCache,
        relationships,
        referencedIds,
        level,
        productDetails.hasDeviceType()
            ? level.getDrugDeviceSemanticTag()
            : level.getMedicineSemanticTag(),
        ReferenceSetUtils.calculateReferenceSetMembers(
            productDetails, models.getModelConfiguration(branch), modelLevelType),
        calculateNonDefiningRelationships(
            models.getModelConfiguration(branch),
            productDetails.getNonDefiningProperties(),
            modelLevelType),
        selectedConceptIdentifiers,
        productDetails.getNonDefiningProperties(),
        !branded,
        false,
        enforceRefsets,
        defined,
        skipLookup);
  }

  private CompletableFuture<Node> findOrCreateMp(
      String branch,
      MedicationProductDetails details,
      AtomicCache atomicCache,
      Set<String> selectedConceptIdentifiers,
      ModelLevel mpLevel) {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    if (details instanceof NutritionalProductDetails
        && modelConfiguration.getModelType().equals(ModelType.NMPC)
        && !mpLevel.isBranded()) {
      return nodeGeneratorService.lookUpNode(
          branch,
          details.getExistingMedicinalProduct(),
          mpLevel,
          details.getNonDefiningProperties().stream()
              .filter(
                  p ->
                      modelConfiguration
                          .getProperty(p.getIdentifierScheme())
                          .getModelLevels()
                          .contains(mpLevel.getModelLevelType()))
              .collect(Collectors.toSet()));
    }

    Set<SnowstormRelationship> relationships =
        createMpRelationships(branch, details, mpLevel, modelConfiguration);

    // if the product has ingredients it can be defined, otherwise we'll guess primitive - user can
    // always override the decision
    boolean defined = !details.getActiveIngredients().isEmpty();

    return nodeGeneratorService.generateNodeAsync(
        branch,
        atomicCache,
        relationships,
        Set.of(mpLevel.getReferenceSetIdentifier()),
        mpLevel,
        details.hasDeviceType()
            ? mpLevel.getDrugDeviceSemanticTag()
            : mpLevel.getMedicineSemanticTag(),
        ReferenceSetUtils.calculateReferenceSetMembers(
            details, models.getModelConfiguration(branch), mpLevel.getModelLevelType()),
        calculateNonDefiningRelationships(
            models.getModelConfiguration(branch),
            details.getNonDefiningProperties(),
            mpLevel.getModelLevelType()),
        selectedConceptIdentifiers,
        details.getNonDefiningProperties(),
        false,
        false,
        false,
        defined,
        false);
  }

  private Set<SnowstormRelationship> createClinicalDrugRelationships(
      String branch,
      MedicationProductDetails productDetails,
      Set<Node> parents,
      boolean branded,
      ModelConfiguration modelConfiguration,
      ModelLevel level) {
    Set<SnowstormRelationship> relationships = new HashSet<>();

    if (parents != null && !parents.isEmpty()) {
      for (Node parent : parents) {
        relationships.add(
            getSnowstormRelationship(IS_A, parent, 0, modelConfiguration.getModuleId()));
      }
    } else if (modelConfiguration.getModelType().equals(ModelType.NMPC)
        && level.getModelLevelType().equals(CLINICAL_DRUG)) {
      relationships.add(
          getSnowstormRelationship(
              IS_A, VIRTUAL_MEDICINAL_PRODUCT, 0, modelConfiguration.getModuleId()));
    } else {
      relationships.add(
          getSnowstormRelationship(IS_A, MEDICINAL_PRODUCT, 0, modelConfiguration.getModuleId()));
    }

    if (productDetails instanceof NutritionalProductDetails nutritionalProductDetails) {
      if (level.equals(CLINICAL_DRUG)) {
        relationships.add(
            getSnowstormRelationship(
                IS_A,
                productDetails.getExistingMedicinalProduct(),
                0,
                STATED_RELATIONSHIP,
                modelConfiguration.getModuleId()));
      } else if (level.equals(REAL_CLINICAL_DRUG)) {
        relationships.add(
            getSnowstormRelationship(
                IS_A,
                productDetails.getExistingClinicalDrug(),
                0,
                STATED_RELATIONSHIP,
                modelConfiguration.getModuleId()));
      }
      if (modelConfiguration.getModelType().equals(ModelType.NMPC)) {
        addRelationshipIfNotNull(
            relationships,
            nutritionalProductDetails.getTargetPopulation(),
            HAS_TARGET_POPULATION,
            0,
            modelConfiguration.getModuleId());
      }
    }

    if (modelConfiguration.getModelType().equals(ModelType.NMPC)
        && productDetails instanceof VaccineProductDetails) {
      relationships.add(
          getSnowstormRelationship(
              PLAYS_ROLE, ACTIVE_IMMUNITY_STIMULANT, 0, modelConfiguration.getModuleId()));
    }

    if (branded) {
      relationships.add(
          getSnowstormRelationship(
              HAS_PRODUCT_NAME,
              productDetails.getProductName(),
              0,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    }

    addProductOtherIdentifyingInformation(productDetails, modelConfiguration, level, relationships);

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      addRelationshipIfNotNull(
          relationships,
          productDetails.getContainerType(),
          HAS_CONTAINER_TYPE,
          0,
          modelConfiguration.getModuleId());
      addRelationshipIfNotNull(
          relationships,
          productDetails.getDeviceType(),
          HAS_DEVICE_TYPE,
          0,
          modelConfiguration.getModuleId());
    }

    if (modelConfiguration.getModelType().equals(ModelType.NMPC)) {
      addRelationshipIfNotNull(
          relationships,
          productDetails.getUnitOfPresentation(),
          HAS_UNIT_OF_PRESENTATION,
          0,
          modelConfiguration.getModuleId());
    }

    SnowstormConceptMini doseForm =
        productDetails.getGenericForm() == null ? null : productDetails.getGenericForm();

    if (branded) {
      doseForm =
          productDetails.getSpecificForm() == null ? doseForm : productDetails.getSpecificForm();
    }

    if (doseForm != null) {
      relationships.add(
          getSnowstormRelationship(
              HAS_MANUFACTURED_DOSE_FORM,
              doseForm,
              0,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    }

    if (productDetails.getPlaysRole() != null) {
      productDetails
          .getPlaysRole()
          .forEach(
              playsRole ->
                  addRelationshipIfNotNull(
                      relationships, playsRole, PLAYS_ROLE, 0, modelConfiguration.getModuleId()));
    }

    int group = 1;

    if (productDetails instanceof VaccineProductDetails vaccineProductDetails) {

      if (modelConfiguration.getModelType().equals(ModelType.NMPC)
          && productDetails.getPlaysRole().isEmpty()) {
        relationships.add(
            getSnowstormRelationship(
                PLAYS_ROLE, ACTIVE_IMMUNITY_STIMULANT, 0, modelConfiguration.getModuleId()));
      }
      addRelationshipIfNotNull(
          relationships,
          vaccineProductDetails.getTargetPopulation(),
          HAS_TARGET_POPULATION,
          0,
          modelConfiguration.getModuleId());
      addRelationshipIfNotNull(
          relationships,
          vaccineProductDetails.getQualitiativeStrength(),
          HAS_QUALITATIVE_STRENGTH,
          group++,
          modelConfiguration.getModuleId());
    }

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      if (addQuantityIfNotNull(
          productDetails.getQuantity(),
          decimalScale,
          relationships,
          HAS_PACK_SIZE_VALUE,
          HAS_PACK_SIZE_UNIT,
          DataTypeEnum.DECIMAL,
          group,
          modelConfiguration)) {

        group++;
      }
    } else if (modelConfiguration.getModelType().equals(ModelType.NMPC)) {
      if (addQuantityIfNotNull(
          productDetails.getQuantity(),
          decimalScale,
          relationships,
          HAS_UNIT_OF_PRESENTATION_SIZE_QUANTITY,
          HAS_UNIT_OF_PRESENTATION_SIZE_UNIT,
          DataTypeEnum.DECIMAL,
          0,
          modelConfiguration)) {}
    }

    for (Ingredient ingredient : productDetails.getActiveIngredients()) {

      if (!level.isBranded() || modelConfiguration.getModelType().equals(ModelType.AMT)) {
        addRelationshipIfNotNull(
            relationships,
            modelConfiguration.getModelType().equals(ModelType.AMT)
                    || ingredient.getRefinedActiveIngredient() == null
                ? ingredient.getActiveIngredient()
                : ingredient.getRefinedActiveIngredient(),
            HAS_ACTIVE_INGREDIENT,
            group,
            modelConfiguration.getModuleId());
      }

      if (level.isBranded() && modelConfiguration.getModelType().equals(ModelType.NMPC)) {
        SnowstormConceptMini ingredientConcept;
        if (ingredient.getPreciseIngredient() != null) {
          ingredientConcept = ingredient.getPreciseIngredient();
        } else if (ingredient.getRefinedActiveIngredient() != null) {
          ingredientConcept = ingredient.getRefinedActiveIngredient();
        } else {
          ingredientConcept = ingredient.getActiveIngredient();
        }
        addRelationshipIfNotNull(
            relationships,
            ingredientConcept,
            HAS_PRECISE_ACTIVE_INGREDIENT,
            group,
            modelConfiguration.getModuleId());
      } else if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
        addRelationshipIfNotNull(
            relationships,
            ingredient.getPreciseIngredient(),
            HAS_PRECISE_ACTIVE_INGREDIENT,
            group,
            modelConfiguration.getModuleId());
      }

      addRelationshipIfNotNull(
          relationships,
          ingredient.getBasisOfStrengthSubstance(),
          HAS_BOSS,
          group,
          modelConfiguration.getModuleId());
      if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
        addQuantityIfNotNull(
            ingredient.getTotalQuantity(),
            decimalScale,
            relationships,
            HAS_TOTAL_QUANTITY_VALUE,
            HAS_TOTAL_QUANTITY_UNIT,
            DataTypeEnum.DECIMAL,
            group,
            modelConfiguration);
        addQuantityIfNotNull(
            ingredient.getConcentrationStrength(),
            decimalScale,
            relationships,
            CONCENTRATION_STRENGTH_VALUE,
            CONCENTRATION_STRENGTH_UNIT,
            DataTypeEnum.DECIMAL,
            group,
            modelConfiguration);
      } else {
        addQuantityIfNotNull(
            ingredient.getPresentationStrengthNumerator(),
            decimalScale,
            relationships,
            HAS_PRESENTATION_STRENGTH_NUMERATOR_VALUE,
            HAS_PRESENTATION_STRENGTH_NUMERATOR_UNIT,
            DataTypeEnum.DECIMAL,
            group,
            modelConfiguration);
        addQuantityIfNotNull(
            ingredient.getPresentationStrengthDenominator(),
            decimalScale,
            relationships,
            HAS_PRESENTATION_STRENGTH_DENOMINATOR_VALUE,
            HAS_PRESENTATION_STRENGTH_DENOMINATOR_UNIT,
            DataTypeEnum.DECIMAL,
            group,
            modelConfiguration);
        addQuantityIfNotNull(
            ingredient.getConcentrationStrengthNumerator(),
            decimalScale,
            relationships,
            HAS_CONCENTRATION_STRENGTH_NUMERATOR_VALUE,
            HAS_CONCENTRATION_STRENGTH_NUMERATOR_UNIT,
            DataTypeEnum.DECIMAL,
            group,
            modelConfiguration);
        addQuantityIfNotNull(
            ingredient.getConcentrationStrengthDenominator(),
            decimalScale,
            relationships,
            HAS_CONCENTRATION_STRENGTH_DENOMINATOR_VALUE,
            HAS_CONCENTRATION_STRENGTH_DENOMINATOR_UNIT,
            DataTypeEnum.DECIMAL,
            group,
            modelConfiguration);
      }

      group++;
    }

    // MPUUs/CDs use "some" semantics, TPUUs/BCDs use "only" semantics
    if (modelConfiguration.getModelType().equals(ModelType.AMT)
        && branded
        && productDetails.getActiveIngredients() != null
        && !productDetails.getActiveIngredients().isEmpty()) {
      relationships.add(
          getSnowstormDatatypeComponent(
              COUNT_OF_ACTIVE_INGREDIENT,
              // get the unique set of active ingredients
              Integer.toString(
                  productDetails.getActiveIngredients().stream()
                      .map(i -> i.getActiveIngredient().getConceptId())
                      .collect(Collectors.toSet())
                      .size()),
              DataTypeEnum.INTEGER,
              0,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    } else if (modelConfiguration.getModelType().equals(ModelType.NMPC)) {
      addCountOfBaseAndActiveIngredient(branch, productDetails, modelConfiguration, relationships);
    }

    return relationships;
  }
}
