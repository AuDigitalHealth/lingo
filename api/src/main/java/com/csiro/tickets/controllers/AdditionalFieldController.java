package com.csiro.tickets.controllers;

import com.csiro.tickets.models.AdditionalFieldType;
import com.csiro.tickets.repository.AdditionalFieldTypeRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdditionalFieldController {

  @Autowired private AdditionalFieldTypeRepository additionalFieldTypeRepository;

  @GetMapping("/api/tickets/additionalFieldTypes")
  public ResponseEntity<List<AdditionalFieldType>> getAllAdditionalFieldTypes() {
    List<AdditionalFieldType> additionalFieldTypes = additionalFieldTypeRepository.findAll();

    return new ResponseEntity<>(additionalFieldTypes, HttpStatus.OK);
  }
}
