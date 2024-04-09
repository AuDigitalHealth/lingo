package com.csiro.snomio.controllers;

import com.csiro.snomio.product.ProductCreationDetails;
import com.csiro.snomio.product.ProductSummary;
import com.csiro.snomio.product.details.DeviceProductDetails;
import com.csiro.snomio.product.details.PackageDetails;
import com.csiro.snomio.service.DeviceProductCalculationService;
import com.csiro.snomio.service.DeviceService;
import com.csiro.snomio.service.ProductCreationService;
import com.csiro.snomio.service.TaskManagerService;
import jakarta.validation.Valid;
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

@RestController
@RequestMapping(
    value = "/api",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class DeviceController {

  private final DeviceService deviceService;
  private final DeviceProductCalculationService deviceProductCalculationService;
  private final TaskManagerService taskManagerService;
  private final ProductCreationService productCreationService;

  @Autowired
  DeviceController(
      DeviceService deviceService,
      DeviceProductCalculationService deviceProductCalculationService,
      TaskManagerService taskManagerService,
      ProductCreationService productCreationService) {
    this.deviceService = deviceService;
    this.deviceProductCalculationService = deviceProductCalculationService;
    this.taskManagerService = taskManagerService;
    this.productCreationService = productCreationService;
  }

  @GetMapping("/{branch}/devices/{productId}")
  public PackageDetails<DeviceProductDetails> getDevicePackageAtomioData(
      @PathVariable String branch, @PathVariable Long productId) {
    return deviceService.getPackageAtomicData(branch, productId.toString());
  }

  @GetMapping("/{branch}/devices/product/{productId}")
  public DeviceProductDetails getDeviceProductAtomioData(
      @PathVariable String branch, @PathVariable Long productId) {
    return deviceService.getProductAtomicData(branch, productId.toString());
  }

  @PostMapping("/{branch}/devices/product")
  public ResponseEntity<ProductSummary> createDeviceProductFromAtomioData(
      @PathVariable String branch,
      @RequestBody @Valid ProductCreationDetails<@Valid DeviceProductDetails> creationDetails) {
    taskManagerService.validateTaskState(branch);
    return new ResponseEntity<>(
        productCreationService.createProductFromAtomicData(branch, creationDetails),
        HttpStatus.CREATED);
  }

  @PostMapping("/{branch}/devices/product/$calculate")
  public ProductSummary calculateDeviceProductFromAtomioData(
      @PathVariable String branch,
      @RequestBody @Valid PackageDetails<@Valid DeviceProductDetails> productDetails) {
    taskManagerService.validateTaskState(branch);
    return deviceProductCalculationService.calculateProductFromAtomicData(branch, productDetails);
  }
}
