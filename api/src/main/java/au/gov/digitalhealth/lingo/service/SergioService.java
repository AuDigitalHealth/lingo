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
package au.gov.digitalhealth.lingo.service;

import au.gov.digitalhealth.lingo.auth.exception.AuthenticationProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.TicketDto;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class SergioService {

  private final WebClient sergioApiClient;

  public SergioService(@Qualifier("sergioApiClient") WebClient sergioApiClient) {
    this.sergioApiClient = sergioApiClient;
  }

  public TicketDto getTicketByArtgEntryId(Long artgEntryId) throws AccessDeniedException {
    return sergioApiClient
        .get()
        .uri(String.format("/api/artgid/%s", artgEntryId))
        .retrieve()
        .onStatus(
            // Handle specific status codes here
            status -> status.equals(HttpStatus.FORBIDDEN) || status.equals(HttpStatus.BAD_REQUEST),
            response -> handleError(response, artgEntryId))
        .bodyToMono(TicketDto.class)
        .block();
  }

  private Mono<? extends Throwable> handleError(ClientResponse response, Long artgEntryId) {
    HttpStatus status = (HttpStatus) response.statusCode();
    if (status.equals(HttpStatus.FORBIDDEN)) {
      throw new AuthenticationProblem("Incorrect cookie supplied");
    } else if (status.equals(HttpStatus.BAD_REQUEST)) {
      throw new ResourceNotFoundProblem(
          String.format("Cannot find artgEntry for id: %s", artgEntryId));
    } else {
      // Handle other status codes if needed
      return Mono.error(new RuntimeException("Unexpected error occurred"));
    }
  }
}
