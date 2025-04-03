///*
// * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
// *
// * Licensed under the Apache License, Version 2.0 (the "License");
// * you may not use this file except in compliance with the License.
// * You may obtain a copy of the License at
// *
// *   http://www.apache.org/licenses/LICENSE-2.0
// *
// * Unless required by applicable law or agreed to in writing, software
// * distributed under the License is distributed on an "AS IS" BASIS,
// * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// * See the License for the specific language governing permissions and
// * limitations under the License.
// */
//package au.gov.digitalhealth.lingo.controllers;
//
//import au.gov.digitalhealth.lingo.aspect.LogExecutionTime;
//import au.gov.digitalhealth.lingo.product.ProductCreationDetails;
//import au.gov.digitalhealth.lingo.product.ProductSummary;
//import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
//import au.gov.digitalhealth.lingo.product.details.PackageDetails;
////import au.gov.digitalhealth.lingo.service.DeviceProductCalculationService;
//import au.gov.digitalhealth.lingo.service.DeviceService;
//import au.gov.digitalhealth.lingo.service.ProductCreationService;
//import au.gov.digitalhealth.lingo.service.TaskManagerService;
//import jakarta.validation.Valid;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.MediaType;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.PathVariable;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestBody;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//@RestController
//@RequestMapping(
//    value = "/api",
//    produces = {MediaType.APPLICATION_JSON_VALUE})
//public class DeviceController {
//
//  private final DeviceService deviceService;
//  private final DeviceProductCalculationService deviceProductCalculationService;
//  private final TaskManagerService taskManagerService;
//  private final ProductCreationService productCreationService;
//
//  DeviceController(
//      DeviceService deviceService,
//      DeviceProductCalculationService deviceProductCalculationService,
//      TaskManagerService taskManagerService,
//      ProductCreationService productCreationService) {
//    this.deviceService = deviceService;
//    this.deviceProductCalculationService = deviceProductCalculationService;
//    this.taskManagerService = taskManagerService;
//    this.productCreationService = productCreationService;
//  }
//
//  @LogExecutionTime
//  @GetMapping("/{branch}/devices/{productId}")
//  public PackageDetails<DeviceProductDetails> getDevicePackageAtomioData(
//      @PathVariable String branch, @PathVariable Long productId) {
//    return deviceService.getPackageAtomicData(branch, productId.toString());
//  }
//
//  @LogExecutionTime
//  @GetMapping("/{branch}/devices/product/{productId}")
//  public DeviceProductDetails getDeviceProductAtomioData(
//      @PathVariable String branch, @PathVariable Long productId) {
//    return deviceService.getProductAtomicData(branch, productId.toString());
//  }
//
//  @LogExecutionTime
//  @PostMapping("/{branch}/devices/product")
//  public ResponseEntity<ProductSummary> createDeviceProductFromAtomioData(
//      @PathVariable String branch,
//      @RequestBody @Valid ProductCreationDetails<@Valid DeviceProductDetails> creationDetails)
//      throws InterruptedException {
//    taskManagerService.validateTaskState(branch);
//    return new ResponseEntity<>(
//        productCreationService.createProductFromAtomicData(branch, creationDetails),
//        HttpStatus.CREATED);
//  }
//
//  @LogExecutionTime
//  @PostMapping("/{branch}/devices/product/$calculate")
//  public ProductSummary calculateDeviceProductFromAtomioData(
//      @PathVariable String branch,
//      @RequestBody @Valid PackageDetails<@Valid DeviceProductDetails> productDetails) {
//    taskManagerService.validateTaskState(branch);
////    return deviceProductCalculationService.calculateProductFromAtomicData(branch, productDetails);
//    return null;
//  }
//}
