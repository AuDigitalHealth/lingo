package com.csiro.snomio.controllers;

import com.csiro.snomio.models.product.ProductCreationDetails;
import com.csiro.snomio.models.product.ProductSummary;
import com.csiro.snomio.models.product.details.MedicationProductDetails;
import com.csiro.snomio.models.product.details.PackageDetails;
import com.csiro.snomio.service.MedicationCreationService;
import com.csiro.snomio.service.MedicationService;
import jakarta.validation.Valid;
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

  @Autowired
  MedicationController(
      MedicationService medicationService, MedicationCreationService medicationCreationService) {
    this.medicationService = medicationService;
    this.medicationCreationService = medicationCreationService;
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

  @PostMapping("/{branch}/medications/product")
  public ResponseEntity<ProductSummary> createMedicationProductFromAtomioData(
      @PathVariable String branch,
      @RequestBody @Valid
          ProductCreationDetails<@Valid MedicationProductDetails> productCreationDetails) {
    return new ResponseEntity<>(
        medicationCreationService.createProductFromAtomicData(branch, productCreationDetails),
        HttpStatus.CREATED);
  }

  @PostMapping("/{branch}/medications/product/$calculate")
  public ProductSummary calculateMedicationProductFromAtomioData(
      @PathVariable String branch,
      @RequestBody @Valid PackageDetails<@Valid MedicationProductDetails> productDetails) {
    return medicationCreationService.calculateProductFromAtomicData(branch, productDetails);
  }
}
