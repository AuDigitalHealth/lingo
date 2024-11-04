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
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.models.PriorityBucket;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.PriorityBucketRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import au.gov.digitalhealth.tickets.service.PriorityBucketService;
import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
import java.util.List;
import java.util.Optional;
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
public class PriorityBucketController {

  private final PriorityBucketRepository priorityBucketRepository;

  private final PriorityBucketService priorityBucketService;

  private final TicketRepository ticketRepository;

  private final TicketServiceImpl ticketService;

  public PriorityBucketController(
      PriorityBucketRepository priorityBucketRepository,
      PriorityBucketService priorityBucketService,
      TicketRepository ticketRepository,
      TicketServiceImpl ticketService) {
    this.priorityBucketRepository = priorityBucketRepository;
    this.priorityBucketService = priorityBucketService;
    this.ticketRepository = ticketRepository;
    this.ticketService = ticketService;
  }

  @GetMapping(value = "/api/tickets/priorityBuckets")
  public ResponseEntity<List<PriorityBucket>> getAllBuckets() {

    List<PriorityBucket> priorityBuckets = priorityBucketRepository.findAllByOrderByOrderIndexAsc();

    return new ResponseEntity<>(priorityBuckets, HttpStatus.OK);
  }

  @PostMapping(value = "/api/tickets/priorityBuckets")
  public ResponseEntity<PriorityBucket> createBucket(@RequestBody PriorityBucket priorityBucket) {

    Optional<PriorityBucket> priorityBucketNameOptional =
        priorityBucketRepository.findByName(priorityBucket.getName());

    if (priorityBucketNameOptional.isPresent()) {
      throw new ResourceAlreadyExists(
          String.format("PriorityBucket with name %s already exists", priorityBucket.getName()));
    }
    List<PriorityBucket> priorityBuckets = priorityBucketRepository.findAll();

    if (!priorityBuckets.isEmpty()) {
      PriorityBucket newPriorityBucket = priorityBucketService.createAndReorder(priorityBucket);
      return new ResponseEntity<>(newPriorityBucket, HttpStatus.OK);
    }

    PriorityBucket priorityBucket1 = priorityBucketRepository.save(priorityBucket);
    return new ResponseEntity<>(priorityBucket1, HttpStatus.OK);
  }

  @PutMapping(value = "/api/tickets/{ticketId}/priorityBuckets/{priorityBucketId}")
  public ResponseEntity<PriorityBucket> addBucket(
      @PathVariable Long ticketId, @PathVariable Long priorityBucketId) {

    Ticket ticket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Ticket with ID %s not found", ticketId)));
    ticketService.validateTicketState(ticket);

    PriorityBucket priorityBucket =
        priorityBucketRepository
            .findById(priorityBucketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Priority bucket ID %s not found", priorityBucketId)));

    ticket.setPriorityBucket(priorityBucket);
    ticketRepository.save(ticket);

    return new ResponseEntity<>(priorityBucket, HttpStatus.OK);
  }

  @DeleteMapping(value = "/api/tickets/{ticketId}/priorityBuckets")
  public ResponseEntity<Ticket> deleteBucket(@PathVariable Long ticketId) {

    Ticket ticket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Ticket with ID %s not found", ticketId)));
    ticketService.validateTicketState(ticket);

    ticket.setPriorityBucket(null);
    Ticket updatedTicket = ticketRepository.save(ticket);

    return new ResponseEntity<>(updatedTicket, HttpStatus.NO_CONTENT);
  }
}
