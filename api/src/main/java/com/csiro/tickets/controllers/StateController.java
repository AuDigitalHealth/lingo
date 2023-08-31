package com.csiro.tickets.controllers;

import com.csiro.tickets.models.State;
import com.csiro.tickets.repository.StateRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StateController {

  @Autowired StateRepository stateRepository;

  @GetMapping("/api/tickets/state")
  public ResponseEntity<List<State>> getAllStates() {

    final List<State> states = stateRepository.findAll();
    return new ResponseEntity<>(states, HttpStatus.OK);
  }
}
