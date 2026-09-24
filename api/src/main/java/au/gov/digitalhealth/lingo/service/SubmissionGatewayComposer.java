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

import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.helper.TicketMetadata;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Asks the submission gateway what a ticket's register-derived content should be.
 *
 * <p>Replaces asking the feed processor the same question. The answer is the same either way —
 * composition has a single owner — but the feed processor is a nightly batch job, and depending on
 * it meant this application could not create a ticket by ARTG ID while that job was unavailable.
 *
 * <p>This only asks. The ticket is still created here, so the requestors, labels and description
 * addendum a caller supplies are merged locally exactly as before; nothing about who writes the
 * ticket changes.
 *
 * <p>The gateway requires an OAuth2 client-credentials bearer token rather than the session cookie
 * the feed processor accepted, so a token is obtained and cached here.
 */
@Service
public class SubmissionGatewayComposer {

  private static final long EXPIRY_BUFFER_SECONDS = 60;

  private static final Logger logger = LoggerFactory.getLogger(SubmissionGatewayComposer.class);

  private final WebClient gatewayApiClient;
  private final WebClient tokenWebClient;
  private final String tokenUri;
  private final String basicCredentials;

  private volatile CachedToken cachedToken;

  public SubmissionGatewayComposer(
      WebClient.Builder webClientBuilder,
      @Value("${submissiongateway.base.url:}") String gatewayBaseUrl,
      @Value("${submissiongateway.oauth2.token-uri:}") String tokenUri,
      @Value("${submissiongateway.oauth2.client-id:}") String clientId,
      @Value("${submissiongateway.oauth2.client-secret:}") String clientSecret) {
    this.gatewayApiClient = webClientBuilder.baseUrl(gatewayBaseUrl).build();
    this.tokenWebClient = webClientBuilder.build();
    this.tokenUri = tokenUri;
    this.basicCredentials =
        Base64.getEncoder()
            .encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
  }

  /**
   * Returns the composed ticket content for an ARTG ID.
   *
   * @throws ResourceNotFoundProblem when the register holds no entry for the ID
   */
  public TicketMetadata getComposedContent(Long artgId) {
    logger.info(
        "Requesting composed ticket content for ARTG ID {} from submission gateway", artgId);

    TicketMetadata metadata =
        gatewayApiClient
            .get()
            .uri("/api/lookup/artg/{artgId}/composed", artgId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + getAccessToken())
            .retrieve()
            .onStatus(
                status -> status.equals(HttpStatus.NOT_FOUND),
                response ->
                    reactor.core.publisher.Mono.error(
                        new ResourceNotFoundProblem(
                            String.format("Cannot find artgEntry for id: %s", artgId))))
            .bodyToMono(TicketMetadata.class)
            .block();

    if (metadata == null || metadata.getName() == null || metadata.getName().isBlank()) {
      // A payload with no name would be indistinguishable from "nothing was composed", and the
      // caller would silently fall back rather than surfacing that the gateway answered oddly.
      throw new IllegalStateException(
          "Submission gateway returned no composed content for ARTG ID " + artgId);
    }
    return metadata;
  }

  private synchronized String getAccessToken() {
    if (cachedToken == null || cachedToken.isExpiring()) {
      cachedToken = fetchToken();
    }
    return cachedToken.accessToken();
  }

  private CachedToken fetchToken() {
    logger.info("Fetching submission gateway OAuth2 access token");

    GatewayTokenResponse response =
        tokenWebClient
            .post()
            .uri(tokenUri)
            .header(HttpHeaders.AUTHORIZATION, "Basic " + basicCredentials)
            .body(BodyInserters.fromFormData("grant_type", "client_credentials"))
            .retrieve()
            .bodyToMono(GatewayTokenResponse.class)
            .block();

    if (response == null || response.accessToken() == null) {
      throw new IllegalStateException("No access_token in submission gateway token response");
    }
    return new CachedToken(response.accessToken(), Instant.now().plusSeconds(response.expiresIn()));
  }

  private record GatewayTokenResponse(
      @com.fasterxml.jackson.annotation.JsonProperty("access_token") String accessToken,
      @com.fasterxml.jackson.annotation.JsonProperty("expires_in") long expiresIn) {}

  private record CachedToken(String accessToken, Instant expiresAt) {
    boolean isExpiring() {
      return Instant.now().isAfter(expiresAt.minusSeconds(EXPIRY_BUFFER_SECONDS));
    }
  }
}
