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
import au.gov.digitalhealth.lingo.product.ProductCreationDetails;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.ProductUpdateDetails;
import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.service.DeviceService;
import au.gov.digitalhealth.lingo.service.ProductCalculationServiceFactory;
import au.gov.digitalhealth.lingo.service.ProductCreationService;
import au.gov.digitalhealth.lingo.service.ProductUpdateService;
import au.gov.digitalhealth.lingo.service.TaskManagerService;
import au.gov.digitalhealth.lingo.validation.AuthoringValidation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.groups.Default;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
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
@Validated({AuthoringValidation.class, Default.class})
public class DeviceController {

  private final DeviceService deviceService;
  private final TaskManagerService taskManagerService;
  private final ProductCreationService productCreationService;
  private final ProductUpdateService productUpdateService;
  ProductCalculationServiceFactory productCalculationServiceFactory;

  DeviceController(
      DeviceService deviceService,
      TaskManagerService taskManagerService,
      ProductCreationService productCreationService,
      ProductUpdateService productUpdateService,
      ProductCalculationServiceFactory productCalculationServiceFactory) {
    this.deviceService = deviceService;
    this.taskManagerService = taskManagerService;
    this.productCreationService = productCreationService;
    this.productUpdateService = productUpdateService;
    this.productCalculationServiceFactory = productCalculationServiceFactory;
  }

  @LogExecutionTime
  @GetMapping("/{branch}/devices/{productId}")
  public PackageDetails<DeviceProductDetails> getDevicePackageAtomioData(
      @PathVariable String branch, @PathVariable Long productId) {
    return deviceService.getPackageAtomicData(branch, productId.toString());
  }

  @LogExecutionTime
  @GetMapping("/{branch}/devices/product/{productId}")
  public DeviceProductDetails getDeviceProductAtomioData(
      @PathVariable String branch, @PathVariable Long productId) {
    return deviceService.getProductAtomicData(branch, productId.toString());
  }

  @LogExecutionTime
  @PostMapping("/{branch}/devices/product")
  public ResponseEntity<ProductSummary> createDeviceProductFromAtomioData(
      @PathVariable String branch,
      @RequestBody @Valid ProductCreationDetails<@Valid DeviceProductDetails> creationDetails)
      throws InterruptedException {
    taskManagerService.validateTaskState(branch);
    try {
      return new ResponseEntity<>(
          productCreationService.createUpdateProductFromAtomicData(branch, creationDetails),
          HttpStatus.CREATED);
    } catch (CompletionException ex) {
      throw (ex.getCause() instanceof RuntimeException runtimeEx) ? runtimeEx : ex;
    }
  }

  @LogExecutionTime
  @PutMapping("/{branch}/devices/product/{productId}")
  public ResponseEntity<ProductSummary> updateDeviceProductFromAtomioData(
      @PathVariable String branch,
      @PathVariable @NotNull Long productId,
      @RequestBody @NotNull @Valid
          ProductUpdateDetails<@Valid DeviceProductDetails> productUpdateDetails)
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
  @PostMapping("/{branch}/devices/product/$calculate")
  public ProductSummary calculateDeviceProductFromAtomioData(
      @PathVariable String branch,
      @RequestBody @Valid PackageDetails<@Valid DeviceProductDetails> productDetails)
      throws ExecutionException, InterruptedException {
    taskManagerService.validateTaskState(branch);
    return productCalculationServiceFactory
        .getCalculationService(DeviceProductDetails.class)
        .calculateProductFromAtomicData(branch, productDetails);
  }

  @LogExecutionTime
  @PostMapping("/{branch}/devices/product/{productId}/$calculateUpdate")
  public ProductSummary updateMedicationProductFromAtomicData(
      @PathVariable String branch,
      @PathVariable Long productId,
      @RequestBody @Valid PackageDetails<@Valid DeviceProductDetails> productDetails)
      throws ExecutionException, InterruptedException {
    taskManagerService.validateTaskState(branch);
    try {
      return productUpdateService.calculateUpdateProductFromAtomicData(
          branch, productId, productDetails);
    } catch (CompletionException ex) {
      throw (ex.getCause() instanceof RuntimeException runtimeEx) ? runtimeEx : ex;
    }
  }
}
