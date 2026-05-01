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

import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.models.SynonymConfiguration;
import au.gov.digitalhealth.tickets.repository.SynonymConfigurationRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SynonymController {

  private static final String SYNONYM_API = "/api/synonyms/";
  protected final Log logger = LogFactory.getLog(getClass());
  final SynonymConfigurationRepository synonymConfigurationRepository;

  public SynonymController(SynonymConfigurationRepository synonymConfigurationRepository) {
    this.synonymConfigurationRepository = synonymConfigurationRepository;
  }

  @GetMapping("/api/synonyms")
  public ResponseEntity<List<SynonymConfiguration>> getAllSynonyms() {
    List<SynonymConfiguration> synonyms = synonymConfigurationRepository.findAll();
    return ResponseEntity.ok(synonyms);
  }

  @GetMapping("/api/synonyms/{id}")
  public ResponseEntity<SynonymConfiguration> getSynonym(@PathVariable Long id) {
    Optional<SynonymConfiguration> synonymOptional = synonymConfigurationRepository.findById(id);
    if (synonymOptional.isPresent()) {
      return ResponseEntity.ok(synonymOptional.get());
    } else {
      return ResponseEntity.notFound().build();
    }
  }

  @PostMapping("/api/synonyms")
  @Transactional
  public ResponseEntity<SynonymConfiguration> createSynonym(
      @RequestBody SynonymConfiguration synonymConfiguration) {
    if (synonymConfiguration.getId() != null) {
      throw new LingoProblem(
          SYNONYM_API,
          "Cannot create synonym with existing ID",
          HttpStatus.BAD_REQUEST,
          "A new synonym cannot have an ID. Please remove the ID field.");
    }

    validateSynonymConfiguration(synonymConfiguration);

    SynonymConfiguration savedSynonym = synonymConfigurationRepository.save(synonymConfiguration);
    return ResponseEntity.status(HttpStatus.CREATED).body(savedSynonym);
  }

  @PutMapping("/api/synonyms/{id}")
  @Transactional
  public ResponseEntity<SynonymConfiguration> updateSynonym(
      @PathVariable Long id, @RequestBody SynonymConfiguration synonymConfiguration) {
    Optional<SynonymConfiguration> existingSynonymOptional =
        synonymConfigurationRepository.findById(id);

    if (!existingSynonymOptional.isPresent()) {
      throw new ResourceNotFoundProblem(
          "Synonym configuration with ID " + id + " does not exist and cannot be updated");
    }

    validateSynonymConfiguration(synonymConfiguration);

    SynonymConfiguration existingSynonym = existingSynonymOptional.get();
    existingSynonym.setSearchString(synonymConfiguration.getSearchString());
    existingSynonym.setReplacementString(synonymConfiguration.getReplacementString());

    SynonymConfiguration updatedSynonym = synonymConfigurationRepository.save(existingSynonym);
    return ResponseEntity.ok(updatedSynonym);
  }

  @DeleteMapping("/api/synonyms/{id}")
  @Transactional
  public ResponseEntity<Void> deleteSynonym(@PathVariable Long id) {
    Optional<SynonymConfiguration> synonymOptional = synonymConfigurationRepository.findById(id);
    if (!synonymOptional.isPresent()) {
      throw new ResourceNotFoundProblem(
          "Synonym configuration " + id + " does not exist and cannot be deleted");
    }
    synonymConfigurationRepository.deleteById(id);
    return ResponseEntity.noContent().build();
  }

  private void validateSynonymConfiguration(SynonymConfiguration synonymConfiguration) {
    if (synonymConfiguration.getSearchString() == null
        || synonymConfiguration.getSearchString().isEmpty()) {
      throw new LingoProblem(
          SYNONYM_API,
          "Search string is required",
          HttpStatus.BAD_REQUEST,
          "The searchString field is required and cannot be empty");
    }
    if (synonymConfiguration.getReplacementString() == null
        || synonymConfiguration.getReplacementString().isEmpty()) {
      throw new LingoProblem(
          SYNONYM_API,
          "Replacement string is required",
          HttpStatus.BAD_REQUEST,
          "The replacementString field is required and cannot be empty");
    }
  }
}
