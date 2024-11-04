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

import au.gov.digitalhealth.tickets.AdditionalFieldTypeDto;
import au.gov.digitalhealth.tickets.AdditionalFieldValueDto;
import au.gov.digitalhealth.tickets.AdditionalFieldValuesForListTypeDto;
import au.gov.digitalhealth.tickets.service.AdditionalFieldService;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdditionalFieldController {
  private final AdditionalFieldService additionalFieldService;

  public AdditionalFieldController(AdditionalFieldService additionalFieldService) {
    this.additionalFieldService = additionalFieldService;
  }

  @GetMapping("/api/tickets/additionalFieldTypes")
  public ResponseEntity<Set<AdditionalFieldTypeDto>> getAllAdditionalFieldTypes() {

    return new ResponseEntity<>(additionalFieldService.getAllAdditionalFieldTypes(), HttpStatus.OK);
  }

  @PostMapping(
      value = "/api/tickets/{ticketId}/additionalFieldValue/{additionalFieldTypeId}/{valueOf}")
  public ResponseEntity<AdditionalFieldValueDto> createTicketAdditionalField(
      @PathVariable Long ticketId,
      @PathVariable Long additionalFieldTypeId,
      @PathVariable String valueOf) {

    return new ResponseEntity<>(
        additionalFieldService.createTicketAdditionalField(
            ticketId, additionalFieldTypeId, valueOf),
        HttpStatus.OK);
  }

  @PostMapping(
      value = "/api/tickets/{ticketId}/additionalFieldValue/{additionalFieldTypeId}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<AdditionalFieldValueDto> createTicketAdditionalFieldByBody(
      @PathVariable Long ticketId,
      @PathVariable Long additionalFieldTypeId,
      @RequestBody AdditionalFieldValueDto afv) {

    return new ResponseEntity<>(
        additionalFieldService.createTicketAdditionalField(ticketId, additionalFieldTypeId, afv),
        HttpStatus.OK);
  }

  @GetMapping(value = "/api/tickets/additionalFieldType/{aftId}/additionalFieldValues")
  public ResponseEntity<Map<String, Collection<Long>>> getAllValuesByAdditionalFieldType(
      @PathVariable Long aftId) {
    return new ResponseEntity<>(
        additionalFieldService.getAllValuesByAdditionalFieldType(aftId), HttpStatus.OK);
  }

  @DeleteMapping(value = "/api/tickets/{ticketId}/additionalFieldValue/{additionalFieldTypeId}")
  public ResponseEntity<Void> deleteTicketAdditionalField(
      @PathVariable Long ticketId, @PathVariable Long additionalFieldTypeId) {
    additionalFieldService.deleteTicketAdditionalField(ticketId, additionalFieldTypeId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/api/additionalFieldValuesForListType")
  public ResponseEntity<Collection<AdditionalFieldValuesForListTypeDto>>
      getAdditionalFieldValuesForListType() {

    return new ResponseEntity<>(
        additionalFieldService.getAdditionalFieldValuesForListType(), HttpStatus.OK);
  }

  @PostMapping(
      value = "/api/tickets/additionalFieldType",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<AdditionalFieldTypeDto> createAdditionalFieldType(
      @RequestBody AdditionalFieldTypeDto aft) {
    return new ResponseEntity<>(
        additionalFieldService.createAdditionalFieldType(aft), HttpStatus.OK);
  }
}
