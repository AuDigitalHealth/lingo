package com.csiro.snomio.service;

import com.csiro.snomio.auth.exception.AuthenticationProblem;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.TicketMinimalDto;
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

  public TicketMinimalDto getTicketByArtgEntryId(Long artgEntryId) throws AccessDeniedException {
    TicketMinimalDto ticketMinimalDto =
        sergioApiClient
            .get()
            .uri(String.format("/api/artgid/%s", artgEntryId))
            .retrieve()
            .onStatus(
                // Handle specific status codes here
                status ->
                    status.equals(HttpStatus.FORBIDDEN) || status.equals(HttpStatus.BAD_REQUEST),
                response -> handleError(response, artgEntryId))
            .bodyToMono(TicketMinimalDto.class)
            .block();
    return ticketMinimalDto;
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
