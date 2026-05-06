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
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.urlMatching;
import static org.assertj.core.api.Assertions.assertThat;

import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
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

  // Wire-contract tests focus on the URL/body format the SnowstormClient sends. The branch path
  // here is irrelevant to the wire shape — any string round-trips identically.
  private static final String BRANCH = "MAIN/TEST/TEST-1";

  private WireMockServer wireMock;
  private SnowstormClient client;

  @BeforeAll
  void startWireMock() throws ReflectiveOperationException {
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
    // @Value-injected fields default to their Java defaults (0) outside Spring; set them so
    // waitForBranchLock loops at least once and reads the stubbed branch metadata.
    setField("maxBranchLockChecks", 5);
    setField("delayBetweenBranchLockChecks", 1L);
  }

  private void setField(String name, Object value) throws ReflectiveOperationException {
    java.lang.reflect.Field f = SnowstormClient.class.getDeclaredField(name);
    f.setAccessible(true);
    f.set(client, value);
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
    // Branch metadata: returned by waitForBranchLock — must report locked=false to let
    // mutating endpoints (updateConcept, etc.) proceed.
    wireMock.stubFor(
        any(urlMatching(".*/branches/.*"))
            .willReturn(
                aResponse()
                    .withStatus(200)
                    .withHeader("Content-Type", "application/json")
                    .withBody("{\"path\":\"" + BRANCH + "\",\"locked\":false}")));
  }

  @Test
  void findActiveNonDefiningRelationshipsForConcepts_usesEnumNameNotSctid() {
    // Snowstorm rejects SCTIDs for the characteristicType query param — it expects the
    // CharacteristicType enum name (ADDITIONAL_RELATIONSHIP). This test pins that contract:
    // it issues the call and verifies the outgoing request carried the enum name.
    client.findActiveNonDefiningRelationshipsForConcepts(BRANCH, java.util.Set.of("100")).block();

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
  void findActiveRefsetMembersForConcepts_sendsActiveAndReferencedComponentIds() {
    client.findActiveRefsetMembersForConcepts(BRANCH, java.util.Set.of("100")).block();

    List<LoggedRequest> requests =
        wireMock.findAll(anyRequestedFor(urlMatching(".*/members/search.*")));
    assertThat(requests).as("members search endpoint should have been called").isNotEmpty();
    String body = requests.get(0).getBodyAsString();
    assertThat(body).contains("\"active\":true");
    assertThat(body).contains("\"referencedComponentIds\":[\"100\"]");
  }

  @Test
  void deleteRefsetMember_issuesDeleteWithMemberIdsBodyAndForceFalse() {
    client.deleteRefsetMember(BRANCH, "m-1");

    List<LoggedRequest> requests = wireMock.findAll(anyRequestedFor(urlMatching(".*/members.*")));
    assertThat(requests).as("members endpoint should have been called").isNotEmpty();
    LoggedRequest req = requests.get(0);
    assertThat(req.getMethod().getName()).isEqualTo("DELETE");
    assertThat(req.queryParameter("force").firstValue()).isEqualTo("false");
    assertThat(req.getBodyAsString()).contains("\"memberIds\":[\"m-1\"]");
  }

  @Test
  void inactivateRefsetMember_issuesPutToMemberUuidWithActiveFalse() {
    SnowstormReferenceSetMember member =
        new SnowstormReferenceSetMember()
            .memberId("m-1")
            .refsetId("refset-1")
            .moduleId("module-1")
            .referencedComponentId("c-1")
            .released(true)
            .active(true);

    client.inactivateRefsetMember(BRANCH, member);

    List<LoggedRequest> requests =
        wireMock.findAll(anyRequestedFor(urlMatching(".*/members/m-1.*")));
    assertThat(requests).as("PUT /{branch}/members/{uuid} should have been called").isNotEmpty();
    LoggedRequest req = requests.get(0);
    assertThat(req.getMethod().getName()).isEqualTo("PUT");
    assertThat(req.getBodyAsString())
        .as("PUT body must carry active=false to inactivate the released member")
        .contains("\"active\":false");
    assertThat(req.getBodyAsString()).contains("\"memberId\":\"m-1\"");
    assertThat(req.getBodyAsString()).contains("\"refsetId\":\"refset-1\"");
    assertThat(req.getBodyAsString()).contains("\"referencedComponentId\":\"c-1\"");
  }

  @Test
  void deleteRelationship_issuesDeleteWithForceFalse() {
    client.deleteRelationship(BRANCH, "r-1");

    List<LoggedRequest> requests =
        wireMock.findAll(anyRequestedFor(urlMatching(".*/relationships/r-1.*")));
    assertThat(requests)
        .as("DELETE /{branch}/relationships/{id} should have been called")
        .isNotEmpty();
    LoggedRequest req = requests.get(0);
    assertThat(req.getMethod().getName()).isEqualTo("DELETE");
    assertThat(req.queryParameter("force").firstValue()).isEqualTo("false");
  }

  @Test
  void inactivateRelationship_fetchesParentConceptAndPutsActiveFalse() {
    String fetchedConcept =
        "{\"conceptId\":\"c-source\",\"active\":true,\"relationships\":["
            + "  {\"relationshipId\":\"r-1\",\"sourceId\":\"c-source\",\"destinationId\":\"c-dst\","
            + "   \"typeId\":\"t\",\"active\":true,\"released\":true}"
            + "]}";
    wireMock.stubFor(
        any(urlMatching(".*/browser/.*/concepts/c-source"))
            .willReturn(
                aResponse()
                    .withStatus(200)
                    .withHeader("Content-Type", "application/json")
                    .withBody(fetchedConcept)));

    SnowstormRelationship rel =
        new SnowstormRelationship()
            .relationshipId("r-1")
            .sourceId("c-source")
            .destinationId("c-dst")
            .typeId("t")
            .released(true)
            .active(true);

    client.inactivateRelationship(BRANCH, rel);

    List<LoggedRequest> putRequests =
        wireMock.findAll(anyRequestedFor(urlMatching(".*/browser/.*/concepts/c-source.*")));
    LoggedRequest put =
        putRequests.stream()
            .filter(r -> r.getMethod().getName().equals("PUT"))
            .findFirst()
            .orElseThrow(() -> new AssertionError("expected PUT to browser concepts endpoint"));
    assertThat(put.getBodyAsString())
        .as("PUT body must inactivate the matching relationship")
        .contains("\"relationshipId\":\"r-1\"")
        .contains("\"active\":false");
  }

  // SnowstormClient's per-id loops swallow 404 (the traceability log claimed an id existed but
  // it's already been deleted on the branch — recoverable, not a hard error). Pin that contract
  // here at the wire level: a 404 on one id must NOT propagate; the surviving member is still
  // returned in the result list.
  @Test
  void fetchRefsetMembersByIds_skips404AndReturnsRemaining() {
    String foundBody = "{\"memberId\":\"m-found\",\"refsetId\":\"refset-1\",\"active\":true}";
    wireMock.stubFor(
        get(urlMatching(".*/members/m-found.*"))
            .willReturn(
                aResponse()
                    .withStatus(200)
                    .withHeader("Content-Type", "application/json")
                    .withBody(foundBody)));
    wireMock.stubFor(
        get(urlMatching(".*/members/m-missing.*")).willReturn(aResponse().withStatus(404)));

    List<SnowstormReferenceSetMember> result =
        client
            .fetchRefsetMembersByIds(
                BRANCH, new java.util.LinkedHashSet<>(java.util.List.of("m-found", "m-missing")))
            .block();

    assertThat(result)
        .as("404 on one id must be skipped, not propagated; surviving id is returned")
        .extracting(SnowstormReferenceSetMember::getMemberId)
        .containsExactly("m-found");
  }
}
