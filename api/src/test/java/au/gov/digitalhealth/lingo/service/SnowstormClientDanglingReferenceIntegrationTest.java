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
  void getRefsetMembersModifiedOnBranch_acceptsLiveSnowstormResponse() {
    assertThatCode(() -> client.getRefsetMembersModifiedOnBranch(BRANCH).block())
        .doesNotThrowAnyException();
  }

  @Test
  void getRefsetMembersModifiedOnBranch_returnsEmptyForCleanReleasedMain() {
    // Members on MAIN of a freshly imported release have effectiveTime set, so the
    // nullEffectiveTime=true filter must yield an empty list. Anything non-empty here would
    // signal that our scope filter is broken and we'd be tidying inherited released members.
    List<SnowstormReferenceSetMember> result =
        client.getRefsetMembersModifiedOnBranch(BRANCH).block();
    assertThat(result).isEmpty();
  }

  @Test
  void getNonDefiningRelationshipsModifiedOnBranch_acceptsLiveSnowstormResponse() {
    // This is the test that would have caught the original bug where we passed the SCTID
    // 900000000000227009 instead of the CharacteristicType enum name ADDITIONAL_RELATIONSHIP —
    // Snowstorm responds with 400 Bad Request on a malformed characteristicType.
    assertThatCode(() -> client.getNonDefiningRelationshipsModifiedOnBranch(BRANCH).block())
        .doesNotThrowAnyException();
  }

  @Test
  void getNonDefiningRelationshipsModifiedOnBranch_returnsEmptyForCleanReleasedMain() {
    List<SnowstormRelationship> result =
        client.getNonDefiningRelationshipsModifiedOnBranch(BRANCH).block();
    assertThat(result).isEmpty();
  }
}
