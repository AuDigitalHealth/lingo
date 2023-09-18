package com.csiro.snomio.controllers;

import com.csiro.snomio.models.product.DeviceProductDetails;
import com.csiro.snomio.models.product.PackageDetails;
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

  @Autowired
  DeviceController(DeviceService deviceService) {
    this.deviceService = deviceService;
  }

  @GetMapping("/{branch}/devices/{productId}")
  @ResponseBody
  public PackageDetails<DeviceProductDetails> getDeviceAtomioData(
      @PathVariable String branch, @PathVariable Long productId) {
    return deviceService.getAtomicData(branch, productId.toString());
  }
}
