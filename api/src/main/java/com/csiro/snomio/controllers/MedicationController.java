package com.csiro.snomio.controllers;

import com.csiro.snomio.aspect.LogExecutionTime;
import com.csiro.snomio.configuration.FieldBindingConfiguration;
import com.csiro.snomio.exception.MultipleFieldBindingsProblem;
import com.csiro.snomio.exception.NoFieldBindingsProblem;
import com.csiro.snomio.product.*;
import com.csiro.snomio.product.bulk.BrandPackSizeCreationDetails;
import com.csiro.snomio.product.bulk.BulkProductAction;
import com.csiro.snomio.product.details.MedicationProductDetails;
import com.csiro.snomio.product.details.PackageDetails;
import com.csiro.snomio.service.BrandPackSizeService;
import com.csiro.snomio.service.MedicationProductCalculationService;
import com.csiro.snomio.service.MedicationService;
import com.csiro.snomio.service.ProductCreationService;
import com.csiro.snomio.service.TaskManagerService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/api",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class MedicationController {

  private final MedicationService medicationService;
  private final MedicationProductCalculationService medicationProductCalculationService;
  private final TaskManagerService taskManagerService;
  private final FieldBindingConfiguration fieldBindingConfiguration;
  private final ProductCreationService productCreationService;
  private final BrandPackSizeService brandPackSizeService;

  MedicationController(
      MedicationService medicationService,
      MedicationProductCalculationService medicationProductCalculationService,
      TaskManagerService taskManagerService,
      FieldBindingConfiguration fieldBindingConfiguration,
      ProductCreationService productCreationService,
      BrandPackSizeService brandPackSizeService) {
    this.medicationService = medicationService;
    this.medicationProductCalculationService = medicationProductCalculationService;
    this.fieldBindingConfiguration = fieldBindingConfiguration;
    this.taskManagerService = taskManagerService;
    this.productCreationService = productCreationService;
    this.brandPackSizeService = brandPackSizeService;
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
    return new ResponseEntity<>(
        productCreationService.createProductFromAtomicData(branch, productCreationDetails),
        HttpStatus.CREATED);
  }

  @LogExecutionTime
  @PostMapping("/{branch}/medications/product/new-brand-pack-sizes")
  public ResponseEntity<ProductSummary> createProductFromBrandPackSizeCreationDetails(
      @PathVariable String branch,
      @RequestBody @Valid BulkProductAction<BrandPackSizeCreationDetails> creationDetails)
      throws InterruptedException {
    taskManagerService.validateTaskState(branch);
    return new ResponseEntity<>(
        productCreationService.createProductFromBrandPackSizeCreationDetails(
            branch, creationDetails),
        HttpStatus.CREATED);
  }

  @LogExecutionTime
  @PostMapping("/{branch}/medications/product/$calculate")
  public ProductSummary calculateMedicationProductFromAtomicData(
      @PathVariable String branch,
      @RequestBody @Valid PackageDetails<@Valid MedicationProductDetails> productDetails)
      throws ExecutionException, InterruptedException {
    taskManagerService.validateTaskState(branch);
    return medicationProductCalculationService.calculateProductFromAtomicData(
        branch, productDetails);
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
