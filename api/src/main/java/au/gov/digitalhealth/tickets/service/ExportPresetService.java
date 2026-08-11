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
package au.gov.digitalhealth.tickets.service;

import au.gov.digitalhealth.lingo.exception.ResourceAlreadyExists;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.models.ExportPreset;
import au.gov.digitalhealth.tickets.repository.ExportPresetRepository;
import java.util.List;
import java.util.Optional;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Log
@Service
public class ExportPresetService {

  private final ExportPresetRepository exportPresetRepository;

  @Autowired
  ExportPresetService(ExportPresetRepository exportPresetRepository) {
    this.exportPresetRepository = exportPresetRepository;
  }

  public List<ExportPreset> getAllPresets() {
    return exportPresetRepository.findAll();
  }

  @Transactional
  public ExportPreset createPreset(ExportPreset exportPreset) {
    String name = exportPreset.getName();
    Optional<ExportPreset> existing = exportPresetRepository.findByName(name);
    if (existing.isPresent()) {
      throw new ResourceAlreadyExists(
          String.format("Export preset with name %s already exists", name));
    }
    return exportPresetRepository.save(exportPreset);
  }

  @Transactional
  public ExportPreset updatePreset(Long id, ExportPreset exportPreset) {
    ExportPreset found =
        exportPresetRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Export preset with ID %s not found", id)));
    found.setName(exportPreset.getName());
    found.setConfig(exportPreset.getConfig());
    return exportPresetRepository.save(found);
  }

  @Transactional
  public void deletePreset(Long id) {
    ExportPreset found =
        exportPresetRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Export preset with ID %s not found", id)));
    log.info("Deleting export preset: " + found.getName());
    exportPresetRepository.delete(found);
  }
}
