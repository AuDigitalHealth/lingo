package com.csiro.snomio.service.cis;

import com.csiro.snomio.exception.SnomioProblem;
import com.csiro.snomio.service.IdentifierSource;
import io.netty.channel.ChannelOption;
import io.netty.handler.logging.LogLevel;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.java.Log;
import org.codehaus.plexus.util.StringUtils;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.netty.http.client.HttpClient;
import reactor.netty.transport.logging.AdvancedByteBufFormat;

@Log
public class CISClient implements IdentifierSource {

  public static final String TOKEN_VAR_NAME = "token";
  private static final int MAX_BULK_REQUEST = 1000;
  private final String username;
  private final String password;
  private final String softwareName;
  private final WebClient client;
  private String token = "";

  public CISClient(
      String cisApiUrl, String username, String password, String softwareName, int timeoutSeconds) {

    if (timeoutSeconds < 1 || timeoutSeconds > 100) {
      throw new IllegalArgumentException("Timeout must be between 1 and 100 seconds.");
    }

    if (StringUtils.isBlank(cisApiUrl)) {
      throw new IllegalArgumentException("CIS API URL must be provided.");
    }

    if (StringUtils.isBlank(username)) {
      throw new IllegalArgumentException("Username must be provided.");
    }

    if (StringUtils.isBlank(password)) {
      throw new IllegalArgumentException("Password must be provided.");
    }

    if (StringUtils.isBlank(softwareName)) {
      throw new IllegalArgumentException("Software name must be provided.");
    }

    this.username = username;
    this.password = password;
    this.softwareName = softwareName;

    HttpClient httpClient =
        HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, timeoutSeconds * 1000) // Connect timeout
            .responseTimeout(Duration.ofSeconds(timeoutSeconds))
            .wiretap(log.getName(), LogLevel.DEBUG, AdvancedByteBufFormat.TEXTUAL);

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
          .contentType(MediaType.APPLICATION_JSON)
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
        client
            .post()
            .uri("/login")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(request)
            .retrieve()
            .bodyToMono(Map.class)
            .block();
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
                          .queryParam(TOKEN_VAR_NAME, token)
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
                          .queryParam(TOKEN_VAR_NAME, token)
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
                        .queryParam(TOKEN_VAR_NAME, token)
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
