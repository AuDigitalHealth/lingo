package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ResourceAlreadyExists;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.models.Iteration;
import com.csiro.tickets.repository.IterationRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class IterationController {

  @Autowired private IterationRepository iterationRepository;

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
}
