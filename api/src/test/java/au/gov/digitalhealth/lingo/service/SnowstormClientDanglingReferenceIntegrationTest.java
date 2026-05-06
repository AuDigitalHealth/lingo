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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import au.csiro.snowstorm_client.api.RefsetMembersApi;
import au.csiro.snowstorm_client.model.SnowstormMemberSearchRequestComponent;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.AmtV4SnowstormExtension;
import au.gov.digitalhealth.lingo.log.SnowstormLogger;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Field;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

/**
 * Integration test for SnowstormClient's dangling-reference helpers against a real Snowstorm
 * instance booted via {@link AmtV4SnowstormExtension} (Snowstorm + Elasticsearch in Testcontainers
 * with a reduced AMT dataset).
 *
 * <p>This is the strongest layer of test we have for these methods: it catches anything WireMock
 * can't (Snowstorm-side validation, accept-header handling, encoding edge cases) and pins the fact
 * that our request format is one the live Snowstorm actually accepts. It is heavier than the {@link
 * SnowstormClientWireContractTest} because container startup takes ~30s, but it remains read-only
 * against the test dataset and uses only the canonical {@code MAIN} branch — so it is safe to run
 * on every CI build.
 */
@ExtendWith(AmtV4SnowstormExtension.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SnowstormClientDanglingReferenceIntegrationTest {

  private static final String BRANCH = "MAIN";

  private SnowstormClient client;

  @BeforeAll
  void setupClient() throws ReflectiveOperationException {
    String url = System.getProperty("ihtsdo.snowstorm.api.url");
    assertThat(url)
        .as("AmtV4SnowstormExtension must have set ihtsdo.snowstorm.api.url")
        .isNotNull();
    WebClient webClient = WebClient.builder().baseUrl(url).build();
    client =
        new SnowstormClient(
            webClient,
            url,
            new ObjectMapper(),
            Mockito.mock(SnowstormLogger.class),
            Mockito.mock(SnowstormClient.class));
    setField("maxBranchLockChecks", 5);
    setField("delayBetweenBranchLockChecks", 50L);
  }

  private void setField(String name, Object value) throws ReflectiveOperationException {
    Field f = SnowstormClient.class.getDeclaredField(name);
    f.setAccessible(true);
    f.set(client, value);
  }

  @Test
  void findActiveRefsetMembersForConcepts_emptyConceptSet_returnsEmpty() {
    List<SnowstormReferenceSetMember> result =
        client.findActiveRefsetMembersForConcepts(BRANCH, java.util.Set.of()).block();
    assertThat(result).isEmpty();
  }

  @Test
  void findActiveNonDefiningRelationshipsForConcepts_acceptsLiveSnowstormResponse() {
    // This is the test that would have caught the original bug where we passed the SCTID
    // 900000000000227009 instead of the CharacteristicType enum name ADDITIONAL_RELATIONSHIP —
    // Snowstorm responds with 400 Bad Request on a malformed characteristicType.
    assertThatCode(
            () ->
                client
                    .findActiveNonDefiningRelationshipsForConcepts(
                        BRANCH, java.util.Set.of("138875005"))
                    .block())
        .doesNotThrowAnyException();
  }

  @Test
  void findActiveNonDefiningRelationshipsForConcepts_emptyConceptSet_returnsEmpty() {
    List<SnowstormRelationship> result =
        client.findActiveNonDefiningRelationshipsForConcepts(BRANCH, java.util.Set.of()).block();
    assertThat(result).isEmpty();
  }

  @Test
  void findRefsetMembers_rejectsOffsetPlusLimitBeyondResultWindow() throws Exception {
    // Pins the Elasticsearch result-window constraint that broke offset-based pagination on
    // findRefsetMembers: Snowstorm rejects offset+limit > 10000 with HTTP 400. Any future
    // attempt to add offset-based pagination on this POST endpoint must reckon with this — the
    // way through is the GET /{branch}/members + searchAfter variant, but that has its own
    // semantic mismatch with the POST endpoint that needs untangling first. Until then this
    // test is the canary that fails loudly if someone re-introduces offset > 10000 here.
    RefsetMembersApi api = (RefsetMembersApi) invokeOnClient(client, "getRefsetMembersApi");
    SnowstormMemberSearchRequestComponent request =
        new SnowstormMemberSearchRequestComponent().active(true).nullEffectiveTime(true);

    // First page (offset=0, limit=10000) is fine — well within the result window.
    assertThatCode(() -> api.findRefsetMembers(BRANCH, request, 0, 10000, null).block())
        .as("first page within result window must succeed")
        .doesNotThrowAnyException();

    // Second page (offset=10000) crosses the result window and Snowstorm 400s.
    assertThatThrownBy(() -> api.findRefsetMembers(BRANCH, request, 10000, 10000, null).block())
        .as(
            "Snowstorm rejects offset+limit > 10000 — this is the constraint our pagination has"
                + " to respect")
        .isInstanceOf(WebClientResponseException.BadRequest.class);
  }

  private static Object invokeOnClient(SnowstormClient client, String methodName) throws Exception {
    java.lang.reflect.Method m = SnowstormClient.class.getDeclaredMethod(methodName);
    m.setAccessible(true);
    return m.invoke(client);
  }
}
