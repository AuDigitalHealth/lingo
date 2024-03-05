package com.csiro.tickets.controllers;

import com.csiro.snomio.auth.ImsUser;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.models.UiSearchConfiguration;
import com.csiro.tickets.repository.UiSearchConfigurationRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(
    value = "/api/tickets",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class UiSearchConfigurationController {

  private final UiSearchConfigurationRepository uiSearchConfigurationRepository;

  @Autowired
  public UiSearchConfigurationController(
      UiSearchConfigurationRepository uiSearchConfigurationRepository) {
    this.uiSearchConfigurationRepository = uiSearchConfigurationRepository;
  }

  @GetMapping("/uiSearchConfigurations")
  public List<UiSearchConfiguration> getAllConfigurations() {
    ImsUser user = (ImsUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return uiSearchConfigurationRepository.findByUsername(user.getLogin());
  }

  @DeleteMapping("/uiSearchConfigurations/{id}")
  public ResponseEntity<Void> deleteConfiguration(@PathVariable Long id) {
    UiSearchConfiguration uiSearchConfiguration =
        uiSearchConfigurationRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Configuration with ID %s not found", id)));
    uiSearchConfigurationRepository.delete(uiSearchConfiguration);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/uiSearchConfigurations")
  public ResponseEntity<UiSearchConfiguration> createConfiguration(
      @RequestBody UiSearchConfiguration uiSearchConfiguration) {
    ImsUser user = (ImsUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

    uiSearchConfiguration.setUsername(user.getLogin());

    UiSearchConfiguration createdUiSearchConfiguration =
        uiSearchConfigurationRepository.save(uiSearchConfiguration);
    return new ResponseEntity<>(createdUiSearchConfiguration, HttpStatus.CREATED);
  }

  @PutMapping("/uiSearchConfigurations")
  public ResponseEntity<List<UiSearchConfiguration>> updateConfigurations(
      @RequestBody List<UiSearchConfiguration> updatedConfigurations) {
    List<UiSearchConfiguration> updatedUiSearchConfigurations = new ArrayList<>();
    for (UiSearchConfiguration updatedConfiguration : updatedConfigurations) {
      UiSearchConfiguration existingUiSearchConfiguration =
          uiSearchConfigurationRepository
              .findById(updatedConfiguration.getId())
              .orElseThrow(
                  () ->
                      new ResourceNotFoundProblem(
                          String.format(
                              "Configuration with ID %s not found", updatedConfiguration.getId())));

      String user = updatedConfiguration.getUsername();

      existingUiSearchConfiguration.setUsername(user);
      existingUiSearchConfiguration.setFilter(updatedConfiguration.getFilter());
      existingUiSearchConfiguration.setGrouping(updatedConfiguration.getGrouping());

      UiSearchConfiguration updatedUiSearchConfiguration =
          uiSearchConfigurationRepository.save(existingUiSearchConfiguration);
      updatedUiSearchConfigurations.add(updatedUiSearchConfiguration);
    }
    return new ResponseEntity<>(updatedUiSearchConfigurations, HttpStatus.OK);
  }
}
