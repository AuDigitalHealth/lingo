package com.csiro.snomio.service.identifier.cis;

import static com.csiro.snomio.exception.CISClientProblem.cisClientProblemForOperation;

import com.csiro.snomio.aspect.LogExecutionTime;
import com.csiro.snomio.exception.CISClientProblem;
import com.csiro.snomio.exception.SnomioProblem;
import com.csiro.snomio.service.identifier.IdentifierSource;
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

/**
 * Client for the CIS API. Based on
 * https://github.com/IHTSDO/component-identifier-service-legacy/blob/cf65d7023a34a477cef9d422dede7ad04101ac2f/java-client/src/main/java/org/snomed/cis/client/CISClient.java
 */
@Log
public class CISClient implements IdentifierSource {

  public static final String TOKEN_VAR_NAME = "token";
  public static final int STATUS_SUCCESS = 2;
  private static final int MAX_BULK_REQUEST = 1000;
  private final String username;
  private final String password;
  private final String softwareName;
  private final WebClient client;
  private final int timeoutSeconds;
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
    this.timeoutSeconds = timeoutSeconds;

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
          .doOnError(
              e -> {
                throw new CISClientProblem("Failed to authenticate with CIS", e);
              })
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
            .doOnError(
                e -> {
                  throw new CISClientProblem("Failed to login to CIS", e);
                })
            .block();
    token = response.get(TOKEN_VAR_NAME);
  }

  @LogExecutionTime
  @Override
  public List<Long> reserveIds(int namespace, String partitionId, int quantity)
      throws SnomioProblem, InterruptedException {
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
      throws SnomioProblem, InterruptedException {
    String bulkJobId = executeBulkRequest(operation, request, includeSchemeName);

    waitForJobToComplete(bulkJobId);

    return getSctIdsFromBulkJob(bulkJobId);
  }

  private List<Long> getSctIdsFromBulkJob(String bulkJobId) {
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
            .doOnError(
                e -> {
                  throw new CISClientProblem("Failed to fetch records for job " + bulkJobId, e);
                })
            .block();

    // this null checking looks clumsy but it was hard to get Sonar to stop complaining about it
    if (recordsResponse != null) {
      List<CISRecord> body = recordsResponse.getBody();
      if (body != null) {
        return body.stream().map(CISRecord::getSctidAsLong).toList();
      }
    }
    throw new CISClientProblem("Failed to fetch records for job " + bulkJobId);
  }

  private void waitForJobToComplete(String bulkJobId) throws InterruptedException {
    long timeout = System.currentTimeMillis() + timeoutSeconds * 1000L;
    CISBulkJobStatusResponse statusResponse;
    do {
      if (timeout < System.currentTimeMillis()) {
        throw new CISClientProblem("Bulk job " + bulkJobId + " timed out.");
      }
      statusResponse =
          client
              .get()
              .uri(
                  uriBuilder ->
                      uriBuilder
                          .path("/bulk/jobs/{jobId}")
                          .queryParam(TOKEN_VAR_NAME, token)
                          .build(bulkJobId))
              .retrieve()
              .bodyToMono(CISBulkJobStatusResponse.class)
              .doOnError(
                  e -> {
                    throw new CISClientProblem("Failed to fetch status for job " + bulkJobId, e);
                  })
              .block();

      if (statusResponse == null || statusResponse.getStatus() == null) {
        throw new CISClientProblem("Failed to fetch status for job " + bulkJobId);
      }

      Thread.sleep(500);

    } while (Integer.parseInt(statusResponse.getStatus()) < STATUS_SUCCESS);

    if (Integer.parseInt(statusResponse.getStatus()) != STATUS_SUCCESS) {
      throw new CISClientProblem(
          "Bulk identifier reservation job "
              + bulkJobId
              + " failed with status "
              + statusResponse.getStatus()
              + " due to "
              + statusResponse.getLog());
    }
  }

  private String executeBulkRequest(
      String operation, CISGenerateRequest request, boolean includeSchemeName) {
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
              .doOnError(
                  e -> {
                    throw cisClientProblemForOperation(operation, e);
                  })
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
              .doOnError(
                  e -> {
                    throw cisClientProblemForOperation(operation, e);
                  })
              .block();
    }

    if (responseBody == null || responseBody.getId() == null) {
      throw cisClientProblemForOperation(operation);
    }

    return responseBody.getId();
  }
}
