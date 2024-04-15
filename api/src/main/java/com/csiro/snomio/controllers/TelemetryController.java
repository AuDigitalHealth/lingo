package com.csiro.snomio.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/telemetry")
public class TelemetryController {

  @PostMapping("")
  public ResponseEntity<Void> forwardTelemetry(@RequestBody String telemetryData) {
    // This data will be forwarded to the OpenTelemetry Collector
    // The UI is using this to send telemetry data
    return ResponseEntity.ok().build();
  }
}
