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

import au.gov.digitalhealth.lingo.exception.ResourceAlreadyExists;
import au.gov.digitalhealth.lingo.exception.ResourceInUseProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.models.Iteration;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.IterationRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class IterationController {

  private final IterationRepository iterationRepository;
  private final TicketRepository ticketRepository;

  public IterationController(
      IterationRepository iterationRepository, TicketRepository ticketRepository) {
    this.iterationRepository = iterationRepository;
    this.ticketRepository = ticketRepository;
  }

  @GetMapping("/api/tickets/iterations")
  public ResponseEntity<List<Iteration>> getAllIterations() {
    List<Iteration> iterations = iterationRepository.findAll();

    return new ResponseEntity<>(iterations, HttpStatus.OK);
  }

  @PostMapping(value = "/api/tickets/iterations", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Iteration> createIteration(@RequestBody Iteration iteration) {

    String iterationName = iteration.getName();
    Optional<Iteration> iterationOptional = iterationRepository.findByName(iterationName);

    if (iterationOptional.isPresent()) {
      throw new ResourceAlreadyExists(
          String.format("Iteration with name %s already exists", iterationName));
    }
    Iteration createdIteration = iterationRepository.save(iteration);

    return new ResponseEntity<>(createdIteration, HttpStatus.OK);
  }

  @PutMapping(
      value = "/api/tickets/iterations/{iterationId}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Iteration> updateIteration(
      @PathVariable Long iterationId, @RequestBody Iteration iteration) {
    Iteration foundIteration =
        iterationRepository
            .findById(iterationId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Iteration with id %s not found", iterationId)));

    foundIteration.setStartDate(iteration.getStartDate());
    foundIteration.setEndDate(iteration.getEndDate());
    foundIteration.setName(iteration.getName());
    foundIteration.setCompleted(iteration.isCompleted());
    foundIteration.setActive(iteration.isActive());

    Iteration updatedIteration = iterationRepository.save(foundIteration);

    return new ResponseEntity<>(updatedIteration, HttpStatus.OK);
  }

  @DeleteMapping(value = "/api/tickets/iterations/{iterationId}")
  public ResponseEntity<Void> deleteIteration(@PathVariable Long iterationId) {
    Iteration existingIteration =
        iterationRepository
            .findById(iterationId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Iteration with ID %s not found", iterationId)));
    List<Ticket> tickets = ticketRepository.findAllByIteration(existingIteration);
    if (!tickets.isEmpty()) {
      throw new ResourceInUseProblem(
          String.format(
              "Iteration with ID %s is mapped to tickets and can't be deleted", iterationId));
    }
    iterationRepository.deleteById(iterationId);
    return ResponseEntity.noContent().build();
  }
}
