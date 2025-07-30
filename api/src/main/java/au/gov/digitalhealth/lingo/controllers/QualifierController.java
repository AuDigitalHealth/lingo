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
package au.gov.digitalhealth.lingo.controllers;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.gov.digitalhealth.lingo.aspect.LogExecutionTime;
import au.gov.digitalhealth.lingo.product.PrimitiveConceptCreationRequest;
import au.gov.digitalhealth.lingo.service.ProductCreationService;
import au.gov.digitalhealth.lingo.service.TaskManagerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(
    value = "/api",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class QualifierController {

  private final TaskManagerService taskManagerService;
  private final ProductCreationService productCreationService;

  QualifierController(
      TaskManagerService taskManagerService, ProductCreationService productCreationService) {
    this.taskManagerService = taskManagerService;
    this.productCreationService = productCreationService;
  }

  @LogExecutionTime
  @PostMapping("/{branch}/qualifier/product-name")
  public ResponseEntity<SnowstormConceptMini> createPrimitive(
      @PathVariable String branch,
      @RequestBody @Valid PrimitiveConceptCreationRequest brandCreationRequest)
      throws InterruptedException {
    taskManagerService.validateTaskState(branch);
    return new ResponseEntity<>(
        productCreationService.createPrimitiveConcept(branch, brandCreationRequest),
        HttpStatus.CREATED);
  }
}
