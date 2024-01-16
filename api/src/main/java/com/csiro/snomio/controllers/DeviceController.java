package com.csiro.snomio.controllers;

import com.csiro.snomio.product.details.DeviceProductDetails;
import com.csiro.snomio.product.details.PackageDetails;
import com.csiro.snomio.service.DeviceCreationService;
import com.csiro.snomio.service.DeviceService;
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
public class DeviceController {

  final DeviceService deviceService;
  final DeviceCreationService deviceCreationService;

  @Autowired
  DeviceController(DeviceService deviceService, DeviceCreationService deviceCreationService) {
    this.deviceService = deviceService;
    this.deviceCreationService = deviceCreationService;
  }

  @GetMapping("/{branch}/devices/{productId}")
  @ResponseBody
  public PackageDetails<DeviceProductDetails> getDevicePackageAtomioData(
      @PathVariable String branch, @PathVariable Long productId) {
    return deviceService.getPackageAtomicData(branch, productId.toString());
  }

  @GetMapping("/{branch}/devices/product/{productId}")
  @ResponseBody
  public DeviceProductDetails getDeviceProductAtomioData(
      @PathVariable String branch, @PathVariable Long productId) {
    return deviceService.getProductAtomicData(branch, productId.toString());
  }

  // TODO: Implement these endpoints
  //  @PostMapping("/{branch}/devices/product")
  //  @ResponseBody
  //  public PackageDetails<DeviceProductDetails> createDeviceProductFromAtomioData(
  //      @PathVariable String branch, @Valid DeviceCreationDetails creationDetails) {
  //    return deviceCreationService.createProductFromAtomicData(branch, creationDetails);
  //  }
  //  @PostMapping("/{branch}/devices/product/$calculate")
  //  @ResponseBody
  //  public DeviceCreationDetails calculateDeviceProductFromAtomioData(
  //      @PathVariable String branch, @Valid DeviceProductDetails productDetails) {
  //    return deviceCreationService.calculateProductFromAtomicData(branch, productDetails);
  //  }
}
