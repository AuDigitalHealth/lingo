package com.csiro.snomio.service.cis;

import com.csiro.snomio.exception.SnomioProblem;
import com.csiro.snomio.service.IdentifierSource;
import io.netty.channel.ChannelOption;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.java.Log;
import org.hibernate.validator.constraints.URL;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.netty.http.client.HttpClient;

@Log
public class CISClient implements IdentifierSource {

  public static final String TOKEN_VAR_NAME = "token";
  private static final int MAX_BULK_REQUEST = 1000;
  private final String username;
  private final String password;
  private final String softwareName;
  private final WebClient client;
  private String token = "";

  @Valid
  public CISClient(
      @NotBlank @URL String cisApiUrl,
      @NotBlank String username,
      @NotBlank String password,
      @NotBlank String softwareName,
      @Min(1) @Max(100) int timeoutSeconds) {
    this.username = username;
    this.password = password;
    this.softwareName = softwareName;

    HttpClient httpClient =
        HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, timeoutSeconds * 1000) // Connect timeout
            .responseTimeout(Duration.ofSeconds(timeoutSeconds));

    client =
        WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .baseUrl(cisApiUrl)
            .build();
    login();
    authenticate(); // Fail fast
  }

  @Override
  public boolean isReservationAvailable() {
    return true;
  }

  protected void authenticate() {
    Map<String, String> request = new HashMap<>();
    request.put(TOKEN_VAR_NAME, token);
    try {
      client
          .post()
          .uri("/authenticate")
          .bodyValue(request)
          .retrieve()
          .bodyToMono(Void.class)
          .block();
    } catch (WebClientResponseException e) {
      if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
        login();
      } else {
        throw e;
      }
    }
  }

  protected void login() {
    log.info("Logging in.");
    Map<String, String> request = new HashMap<>();
    request.put("username", username);
    request.put("password", password);
    Map<String, String> response =
        client.post().uri("/login").bodyValue(request).retrieve().bodyToMono(Map.class).block();
    token = response.get(TOKEN_VAR_NAME);
  }

  @Override
  public List<Long> reserveIds(int namespace, String partitionId, int quantity)
      throws SnomioProblem {
    authenticate();
    List<Long> reservedIdentifiers = new ArrayList<>();
    int requestQuantity = MAX_BULK_REQUEST;
    while (reservedIdentifiers.size() < quantity) {
      if (requestQuantity > quantity) {
        requestQuantity = quantity - reservedIdentifiers.size();
      }
      CISGenerateRequest request =
          new CISGenerateRequest(namespace, partitionId, requestQuantity, softwareName);
      reservedIdentifiers.addAll(callCis("reserve", request, false));
    }
    return reservedIdentifiers;
  }

  private List<Long> callCis(
      String operation, CISGenerateRequest request, boolean includeSchemeName)
      throws SnomioProblem {
    CISBulkRequestResponse responseBody;
    if (includeSchemeName) {
      responseBody =
          client
              .post()
              .uri(
                  uriBuilder ->
                      uriBuilder
                          .path("/sct/bulk/{operation}")
                          .queryParam("token", token)
                          .queryParam("schemeName", "SNOMEDID")
                          .build(operation))
              .bodyValue(request)
              .retrieve()
              .bodyToMono(CISBulkRequestResponse.class)
              .block();
    } else {
      responseBody =
          client
              .post()
              .uri(
                  uriBuilder ->
                      uriBuilder
                          .path("/sct/bulk/{operation}")
                          .queryParam("token", token)
                          .build(operation))
              .bodyValue(request)
              .retrieve()
              .bodyToMono(CISBulkRequestResponse.class)
              .block();
    }

    if (responseBody == null || responseBody.getId() == null) {
      throw new SnomioProblem(
          "cis-integration",
          "Failed to " + operation + " identifiers.",
          HttpStatus.INTERNAL_SERVER_ERROR);
    }

    String bulkJobId = responseBody.getId();

    ResponseEntity<List<CISRecord>> recordsResponse =
        client
            .get()
            .uri(
                uriBuilder ->
                    uriBuilder
                        .path("/bulk/jobs/{jobId}/records")
                        .queryParam("token", token)
                        .build(bulkJobId))
            .retrieve()
            .toEntity(new ParameterizedTypeReference<List<CISRecord>>() {})
            .block();

    if (recordsResponse == null || recordsResponse.getBody() == null) {
      throw new SnomioProblem(
          "cis-integration",
          "Failed to fetch records for job " + bulkJobId,
          HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return recordsResponse.getBody().stream().map(CISRecord::getSctidAsLong).toList();
  }
}
