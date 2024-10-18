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

import au.gov.digitalhealth.tickets.models.State;
import au.gov.digitalhealth.tickets.repository.StateRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StateController {

  final StateRepository stateRepository;

  public StateController(StateRepository stateRepository) {
    this.stateRepository = stateRepository;
  }

  @GetMapping("/api/tickets/state")
  public ResponseEntity<List<State>> getAllStates() {

    final List<State> states = stateRepository.findAll();
    return new ResponseEntity<>(states, HttpStatus.OK);
  }
}
