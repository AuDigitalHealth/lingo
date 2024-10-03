package com.csiro.snomio.controllers;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.aspect.LogExecutionTime;
import com.csiro.snomio.product.*;
import com.csiro.snomio.service.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(
    value = "/api",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class QualifierController {

  private final TaskManagerService taskManagerService;
  private final ProductCreationService productCreationService;

  QualifierController(
      TaskManagerService taskManagerService, ProductCreationService productCreationService) {
    this.taskManagerService = taskManagerService;
    this.productCreationService = productCreationService;
  }

  @LogExecutionTime
  @PostMapping("/{branch}/qualifier/product-name")
  public ResponseEntity<SnowstormConceptMini> createBrand(
      @PathVariable String branch, @RequestBody @Valid BrandCreationRequest brandCreationRequest)
      throws InterruptedException {
    taskManagerService.validateTaskState(branch);
    return new ResponseEntity<>(
        productCreationService.createBrand(branch, brandCreationRequest), HttpStatus.CREATED);
  }
}
