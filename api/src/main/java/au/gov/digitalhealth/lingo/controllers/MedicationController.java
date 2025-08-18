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
package au.gov.digitalhealth.lingo.controllers;

import au.gov.digitalhealth.lingo.aspect.LogExecutionTime;
import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.exception.MultipleFieldBindingsProblem;
import au.gov.digitalhealth.lingo.exception.NoFieldBindingsProblem;
import au.gov.digitalhealth.lingo.product.ProductBrands;
import au.gov.digitalhealth.lingo.product.ProductCreationDetails;
import au.gov.digitalhealth.lingo.product.ProductPackSizes;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.ProductUpdateDetails;
import au.gov.digitalhealth.lingo.product.bulk.BrandPackSizeCreationDetails;
import au.gov.digitalhealth.lingo.product.bulk.BulkProductAction;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.service.BrandPackSizeService;
import au.gov.digitalhealth.lingo.service.MedicationService;
import au.gov.digitalhealth.lingo.service.ProductCalculationServiceFactory;
import au.gov.digitalhealth.lingo.service.ProductCreationService;
import au.gov.digitalhealth.lingo.service.ProductUpdateService;
import au.gov.digitalhealth.lingo.service.TaskManagerService;
import au.gov.digitalhealth.lingo.service.validators.ValidationResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/api",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class MedicationController {

  private final MedicationService medicationService;
  private final TaskManagerService taskManagerService;
  private final FieldBindingConfiguration fieldBindingConfiguration;
  private final ProductCreationService productCreationService;
  private final BrandPackSizeService brandPackSizeService;
  private final ProductUpdateService productUpdateService;
  private final ProductCalculationServiceFactory productCalculationServiceFactory;

  MedicationController(
      MedicationService medicationService,
      TaskManagerService taskManagerService,
      FieldBindingConfiguration fieldBindingConfiguration,
      ProductCreationService productCreationService,
      BrandPackSizeService brandPackSizeService,
      ProductUpdateService productUpdateService,
      ProductCalculationServiceFactory productCalculationServiceFactory) {
    this.medicationService = medicationService;
    this.fieldBindingConfiguration = fieldBindingConfiguration;
    this.taskManagerService = taskManagerService;
    this.productCreationService = productCreationService;
    this.brandPackSizeService = brandPackSizeService;
    this.productUpdateService = productUpdateService;
    this.productCalculationServiceFactory = productCalculationServiceFactory;
  }

  @LogExecutionTime
  @GetMapping("/{branch}/medications/{productId}")
  public PackageDetails<MedicationProductDetails> getMedicationPackageAtomicData(
      @PathVariable String branch, @PathVariable Long productId) {
    return medicationService.getPackageAtomicData(branch, productId.toString());
  }

  /**
   * Finds the other pack sizes for a given product.
   *
   * @param branch The branch to search in.
   * @param productId The product ID to search for.
   * @return The other pack sizes for the given product.
   */
  @LogExecutionTime
  @GetMapping("/{branch}/medications/{productId}/pack-sizes")
  public ProductPackSizes getMedicationProductPackSizes(
      @PathVariable String branch, @PathVariable Long productId) {
    return medicationService.getProductPackSizes(branch, productId);
  }

  /**
   * Finds the brands for a given product.
   *
   * @param branch The branch to search in.
   * @param productId The product ID to search for.
   * @return The brands for the given product.
   */
  @LogExecutionTime
  @GetMapping("/{branch}/medications/{productId}/brands")
  public ProductBrands getMedicationProductBrands(
      @PathVariable String branch, @PathVariable Long productId) {
    return medicationService.getProductBrands(branch, productId);
  }

  @LogExecutionTime
  @GetMapping("/{branch}/medications/product/{productId}")
  public MedicationProductDetails getMedicationProductAtomioData(
      @PathVariable String branch, @PathVariable Long productId) {
    return medicationService.getProductAtomicData(branch, productId.toString());
  }

  @LogExecutionTime
  @GetMapping("/{branch}/medications/field-bindings")
  public Map<String, String> getMedicationAtomioDataFieldBindings(@PathVariable String branch) {
    String branchKey = branch.replace("|", "_");

    Set<String> keys =
        fieldBindingConfiguration.getMappers().keySet().stream()
            .filter(branchKey::startsWith)
            .collect(Collectors.toSet());

    if (keys.isEmpty()) {
      throw new NoFieldBindingsProblem(branchKey, fieldBindingConfiguration.getMappers().keySet());
    } else if (keys.size() > 1) {
      throw new MultipleFieldBindingsProblem(branchKey, keys);
    }

    return fieldBindingConfiguration.getMappers().get(keys.iterator().next());
  }

  @LogExecutionTime
  @PostMapping("/{branch}/medications/product")
  public ResponseEntity<ProductSummary> createMedicationProductFromAtomioData(
      @PathVariable String branch,
      @RequestBody @Valid
          ProductCreationDetails<@Valid MedicationProductDetails> productCreationDetails)
      throws InterruptedException {
    taskManagerService.validateTaskState(branch);
    try {
      return new ResponseEntity<>(
          productCreationService.createUpdateProductFromAtomicData(branch, productCreationDetails),
          HttpStatus.CREATED);
    } catch (CompletionException ex) {
      throw (ex.getCause() instanceof RuntimeException runtimeEx) ? runtimeEx : ex;
    }
  }

  @LogExecutionTime
  @PutMapping("/{branch}/medications/product/{productId}")
  public ResponseEntity<ProductSummary> updateMedicationProductFromAtomioData(
      @PathVariable String branch,
      @PathVariable @NotNull Long productId,
      @RequestBody @NotNull @Valid
          ProductUpdateDetails<@Valid MedicationProductDetails> productUpdateDetails)
      throws InterruptedException {
    if (!productId.toString().equals(productUpdateDetails.getOriginalConceptId())) {
      throw new IllegalArgumentException(
          String.format(
              "Product ID in the path (%d) must match the product ID in the request body (%s).",
              productId, productUpdateDetails.getOriginalConceptId()));
    }
    taskManagerService.validateTaskState(branch);
    try {
      return new ResponseEntity<>(
          productCreationService.updateProductFromAtomicData(branch, productUpdateDetails),
          HttpStatus.OK);
    } catch (CompletionException ex) {
      throw (ex.getCause() instanceof RuntimeException runtimeEx) ? runtimeEx : ex;
    }
  }

  @LogExecutionTime
  @PostMapping("/{branch}/medications/product/new-brand-pack-sizes")
  public ResponseEntity<ProductSummary> createProductFromBrandPackSizeCreationDetails(
      @PathVariable String branch,
      @RequestBody @Valid BulkProductAction<BrandPackSizeCreationDetails> creationDetails)
      throws InterruptedException {
    taskManagerService.validateTaskState(branch);
    try {
      return new ResponseEntity<>(
          productCreationService.createProductFromBrandPackSizeCreationDetails(
              branch, creationDetails),
          HttpStatus.CREATED);
    } catch (CompletionException ex) {
      throw (ex.getCause() instanceof RuntimeException runtimeEx) ? runtimeEx : ex;
    }
  }

  @LogExecutionTime
  @PostMapping("/{branch}/medications/product/$calculate")
  public ProductSummary calculateMedicationProductFromAtomicData(
      @PathVariable String branch,
      @RequestBody @Valid PackageDetails<@Valid MedicationProductDetails> productDetails)
      throws ExecutionException, InterruptedException {
    taskManagerService.validateTaskState(branch);
    try {
      return productCalculationServiceFactory
          .getCalculationService(MedicationProductDetails.class)
          .calculateProductFromAtomicData(branch, productDetails);
    } catch (CompletionException ex) {
      throw (ex.getCause() instanceof RuntimeException runtimeEx) ? runtimeEx : ex;
    }
  }

  @LogExecutionTime
  @PostMapping("/{branch}/medications/product/$validate")
  public ResponseEntity<ValidationResult> validateMedicationProductAtomicData(
      @PathVariable String branch,
      @RequestBody @Valid PackageDetails<@Valid MedicationProductDetails> productDetails) {
    taskManagerService.validateTaskState(branch);
    final ValidationResult validationResult =
        productCalculationServiceFactory
            .getCalculationService(MedicationProductDetails.class)
            .validateProductAtomicData(branch, productDetails);
    return validationResult.isValid()
        ? ResponseEntity.ok().body(validationResult)
        : ResponseEntity.badRequest().body(validationResult);
  }

  @LogExecutionTime
  @PostMapping("/{branch}/medications/product/{productId}/$calculateUpdate")
  public ProductSummary updateMedicationProductFromAtomicData(
      @PathVariable String branch,
      @PathVariable Long productId,
      @RequestBody @Valid PackageDetails<@Valid MedicationProductDetails> productDetails)
      throws ExecutionException, InterruptedException {
    taskManagerService.validateTaskState(branch);
    try {
      return productUpdateService.calculateUpdateProductFromAtomicData(
          branch, productId, productDetails);
    } catch (CompletionException ex) {
      throw (ex.getCause() instanceof RuntimeException runtimeEx) ? runtimeEx : ex;
    }
  }

  @LogExecutionTime
  @PostMapping("/{branch}/medications/product/{productId}/$validateUpdate")
  public ResponseEntity<ValidationResult> validateUpdateMedicationProductAtomicData(
      @PathVariable String branch,
      @PathVariable Long productId,
      @RequestBody @Valid PackageDetails<@Valid MedicationProductDetails> productDetails) {
    taskManagerService.validateTaskState(branch);
    final ValidationResult validationResult =
        productUpdateService.validateUpdateProductFromAtomicData(branch, productId, productDetails);

    return validationResult.isValid()
        ? ResponseEntity.ok().body(validationResult)
        : ResponseEntity.badRequest().body(validationResult);
  }

  @LogExecutionTime
  @PostMapping("/{branch}/medications/product/$calculateNewBrandPackSizes")
  public ProductSummary calculateNewBrandPackSizeMedicationProducts(
      @PathVariable String branch,
      @RequestBody @Valid BrandPackSizeCreationDetails brandPackSizeCreationDetails) {
    taskManagerService.validateTaskState(branch);
    return brandPackSizeService.calculateNewBrandPackSizes(branch, brandPackSizeCreationDetails);
  }
}
