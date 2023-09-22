package com.csiro.snomio.controllers;

import com.csiro.snomio.models.product.MedicationProductDetails;
import com.csiro.snomio.models.product.PackageDetails;
import com.csiro.snomio.service.MedicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/api",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class MedicationController {

  final MedicationService medicationService;

  @Autowired
  MedicationController(MedicationService medicationService) {
    this.medicationService = medicationService;
  }

  @GetMapping("/{branch}/medications/{productId}")
  @ResponseBody
  public PackageDetails<MedicationProductDetails> getMedicationAtomioData(
      @PathVariable String branch, @PathVariable Long productId) {
    return medicationService.getAtomicData(branch, productId.toString());
  }
}
