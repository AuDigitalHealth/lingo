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
package au.gov.digitalhealth.tickets.controllers;

import au.gov.digitalhealth.tickets.models.ExportPreset;
import au.gov.digitalhealth.tickets.service.ExportPresetService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/api/tickets",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class ExportPresetController {

  private final ExportPresetService exportPresetService;

  public ExportPresetController(ExportPresetService exportPresetService) {
    this.exportPresetService = exportPresetService;
  }

  @GetMapping("/exportPresets")
  public List<ExportPreset> getAllPresets() {
    return exportPresetService.getAllPresets();
  }

  @PostMapping("/exportPresets")
  public ResponseEntity<ExportPreset> createPreset(@RequestBody ExportPreset exportPreset) {
    return new ResponseEntity<>(exportPresetService.createPreset(exportPreset), HttpStatus.OK);
  }

  @PutMapping("/exportPresets/{id}")
  public ResponseEntity<ExportPreset> updatePreset(
      @PathVariable Long id, @RequestBody ExportPreset exportPreset) {
    return new ResponseEntity<>(exportPresetService.updatePreset(id, exportPreset), HttpStatus.OK);
  }

  @DeleteMapping("/exportPresets/{id}")
  public ResponseEntity<Void> deletePreset(@PathVariable Long id) {
    exportPresetService.deletePreset(id);
    return new ResponseEntity<>(HttpStatus.NO_CONTENT);
  }
}
