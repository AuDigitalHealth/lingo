package com.csiro.snomio.controllers;

import com.csiro.snomio.configuration.FieldBindingConfiguration;
import com.csiro.snomio.exception.MultipleFieldBindingsProblem;
import com.csiro.snomio.exception.NoFieldBindingsProblem;
import com.csiro.snomio.product.ProductCreationDetails;
import com.csiro.snomio.product.ProductSummary;
import com.csiro.snomio.product.details.MedicationProductDetails;
import com.csiro.snomio.product.details.PackageDetails;
import com.csiro.snomio.service.MedicationCreationService;
import com.csiro.snomio.service.MedicationService;
import com.csiro.snomio.service.TaskManagerService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Log
@RestController
@RequestMapping(
    value = "/api",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class MedicationController {

  final MedicationService medicationService;
  final MedicationCreationService medicationCreationService;
  private final FieldBindingConfiguration fieldBindingConfiguration;

  final TaskManagerService taskManagerService;

  @Autowired
  MedicationController(
      MedicationService medicationService,
      MedicationCreationService medicationCreationService,
      TaskManagerService taskManagerService,
      FieldBindingConfiguration fieldBindingConfiguration) {
    this.medicationService = medicationService;
    this.medicationCreationService = medicationCreationService;
    this.fieldBindingConfiguration = fieldBindingConfiguration;
    this.taskManagerService = taskManagerService;
  }

  @GetMapping("/{branch}/medications/{productId}")
  public PackageDetails<MedicationProductDetails> getMedicationPackageAtomicData(
      @PathVariable String branch, @PathVariable Long productId) {
    return medicationService.getPackageAtomicData(branch, productId.toString());
  }

  @GetMapping("/{branch}/medications/product/{productId}")
  public MedicationProductDetails getMedicationProductAtomioData(
      @PathVariable String branch, @PathVariable Long productId) {
    return medicationService.getProductAtomicData(branch, productId.toString());
  }

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

  @PostMapping("/{branch}/medications/product")
  public ResponseEntity<ProductSummary> createMedicationProductFromAtomioData(
      @PathVariable String branch,
      @RequestBody @Valid
          ProductCreationDetails<@Valid MedicationProductDetails> productCreationDetails) {
    taskManagerService.checkTaskOwnershipOrThrow(branch);
    return new ResponseEntity<>(
        medicationCreationService.createProductFromAtomicData(branch, productCreationDetails),
        HttpStatus.CREATED);
  }

  @PostMapping("/{branch}/medications/product/$calculate")
  public ProductSummary calculateMedicationProductFromAtomioData(
      @PathVariable String branch,
      @RequestBody @Valid PackageDetails<@Valid MedicationProductDetails> productDetails) {
    taskManagerService.checkTaskOwnershipOrThrow(branch);
    return medicationCreationService.calculateProductFromAtomicData(branch, productDetails);
  }
}
