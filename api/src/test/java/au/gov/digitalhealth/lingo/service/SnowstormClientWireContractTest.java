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

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.any;
import static com.github.tomakehurst.wiremock.client.WireMock.anyRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static com.github.tomakehurst.wiremock.client.WireMock.urlMatching;
import static org.assertj.core.api.Assertions.assertThat;

import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.log.SnowstormLogger;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import java.util.List;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.mockito.Mockito;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Wire-contract tests for SnowstormClient. Boots a real WireMock server and exercises the methods
 * end-to-end at the HTTP level so any mismatch between what the client sends and what Snowstorm
 * actually accepts is caught — the unit tests in {@link DanglingReferenceServiceTest} mock
 * SnowstormClient and therefore cannot catch wire-format errors (e.g. passing a SCTID where
 * Snowstorm expects an enum name for a query parameter).
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SnowstormClientWireContractTest {

  private static final String BRANCH = "MAIN/TEST/TEST-1";

  private WireMockServer wireMock;
  private SnowstormClient client;

  @BeforeAll
  void startWireMock() {
    wireMock =
        new WireMockServer(
            WireMockConfiguration.wireMockConfig().dynamicPort().bindAddress("127.0.0.1"));
    wireMock.start();
    String url = "http://127.0.0.1:" + wireMock.port();
    WebClient webClient = WebClient.builder().baseUrl(url).build();
    client =
        new SnowstormClient(
            webClient,
            url,
            new ObjectMapper(),
            Mockito.mock(SnowstormLogger.class),
            Mockito.mock(SnowstormClient.class));
  }

  @AfterAll
  void stopWireMock() {
    wireMock.stop();
  }

  @BeforeEach
  void resetStubs() {
    wireMock.resetAll();
    // Default: any unmatched request returns an empty page so missing stubs surface as
    // assertion failures, not silent 404s.
    wireMock.stubFor(
        any(anyUrl())
            .willReturn(
                aResponse()
                    .withStatus(200)
                    .withHeader("Content-Type", "application/json")
                    .withBody("{\"items\":[],\"total\":0,\"limit\":10000,\"offset\":0}")));
  }

  @Test
  void getNonDefiningRelationshipsModifiedOnBranch_usesEnumNameNotSctid() {
    // Snowstorm rejects SCTIDs for the characteristicType query param — it expects the
    // CharacteristicType enum name (ADDITIONAL_RELATIONSHIP). This test pins that contract:
    // it issues the call and verifies the outgoing request carried the enum name.
    client.getNonDefiningRelationshipsModifiedOnBranch(BRANCH).block();

    List<LoggedRequest> requests =
        wireMock.findAll(anyRequestedFor(urlMatching(".*/relationships.*")));
    assertThat(requests).as("relationships endpoint should have been called").isNotEmpty();
    LoggedRequest req = requests.get(0);
    assertThat(req.queryParameter("characteristicType").firstValue())
        .as("characteristicType must be the enum name, not the SCTID")
        .isEqualTo("ADDITIONAL_RELATIONSHIP");
    assertThat(req.queryParameter("active").firstValue()).isEqualTo("true");
  }

  @Test
  void getRefsetMembersModifiedOnBranch_sendsActiveAndNullEffectiveTimeFilters() {
    client.getRefsetMembersModifiedOnBranch(BRANCH).block();

    List<LoggedRequest> requests =
        wireMock.findAll(anyRequestedFor(urlMatching(".*/members/search.*")));
    assertThat(requests).as("members search endpoint should have been called").isNotEmpty();
    String body = requests.get(0).getBodyAsString();
    assertThat(body).contains("\"active\":true");
    assertThat(body).contains("\"nullEffectiveTime\":true");
  }

  @Test
  void getNonDefiningRelationshipsModifiedOnBranch_filtersToNullEffectiveTime() {
    String body =
        "{\"items\":["
            + "  {\"relationshipId\":\"r-modified\",\"sourceId\":\"s\",\"destinationId\":\"d\","
            + "   \"typeId\":\"t\",\"active\":true,\"released\":true,\"effectiveTime\":null},"
            + "  {\"relationshipId\":\"r-inherited\",\"sourceId\":\"s\",\"destinationId\":\"d\","
            + "   \"typeId\":\"t\",\"active\":true,\"released\":true,\"effectiveTime\":\"20240131\"}"
            + "],\"total\":2,\"limit\":10000,\"offset\":0}";
    wireMock.stubFor(
        any(urlMatching(".*/relationships.*"))
            .willReturn(
                aResponse()
                    .withStatus(200)
                    .withHeader("Content-Type", "application/json")
                    .withBody(body)));

    List<SnowstormRelationship> result =
        client.getNonDefiningRelationshipsModifiedOnBranch(BRANCH).block();

    assertThat(result)
        .as("only the row with null effectiveTime should pass the post-filter")
        .extracting(SnowstormRelationship::getRelationshipId)
        .containsExactly("r-modified");
  }
}
