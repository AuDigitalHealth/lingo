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
package au.gov.digitalhealth.lingo.traceability;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.any;
import static com.github.tomakehurst.wiremock.client.WireMock.anyRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.anyUrl;
import static com.github.tomakehurst.wiremock.client.WireMock.urlMatching;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.traceability.ComponentChange.ChangeType;
import au.gov.digitalhealth.lingo.traceability.ComponentChange.ComponentType;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import java.util.List;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Wire-contract tests for {@link TraceabilityServiceClient}. The client builds query parameters and
 * parses {@code PageActivity} JSON over a separate WebClient — without these tests, a typo in
 * {@code originalBranch}/{@code activityType}/{@code page}/{@code size} or an upstream JSON field
 * rename would silently produce an empty activity log, and dangling-reference detection would scope
 * to nothing (false-clean) without anyone noticing.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class TraceabilityServiceClientWireContractTest {

  private static final String BRANCH = "MAIN/SNOMEDCT-IE/IEDC/IEDC-7374";

  private WireMockServer wireMock;
  private TraceabilityServiceClient client;

  @BeforeAll
  void startWireMock() {
    wireMock =
        new WireMockServer(
            WireMockConfiguration.wireMockConfig().dynamicPort().bindAddress("127.0.0.1"));
    wireMock.start();
    WebClient webClient =
        WebClient.builder().baseUrl("http://127.0.0.1:" + wireMock.port()).build();
    client = new TraceabilityServiceClient(webClient);
  }

  @AfterAll
  void stopWireMock() {
    wireMock.stop();
  }

  @BeforeEach
  void resetStubs() {
    wireMock.resetAll();
  }

  @Test
  void getContentChangeActivitiesOnBranch_sendsExpectedQueryParams() {
    stubPage(0, "[]", true);

    client.getContentChangeActivitiesOnBranch(BRANCH);

    List<LoggedRequest> requests =
        wireMock.findAll(anyRequestedFor(urlMatching(".*/activities.*")));
    assertThat(requests).as("/activities endpoint must be called").isNotEmpty();
    LoggedRequest req = requests.get(0);
    assertThat(req.getMethod().getName()).isEqualTo("GET");
    assertThat(req.queryParameter("originalBranch").firstValue()).isEqualTo(BRANCH);
    assertThat(req.queryParameter("activityType").firstValue()).isEqualTo("CONTENT_CHANGE");
    assertThat(req.queryParameter("brief").firstValue()).isEqualTo("false");
    assertThat(req.queryParameter("page").firstValue()).isEqualTo("0");
    assertThat(req.queryParameter("size").firstValue()).isEqualTo("100");
  }

  @Test
  void getContentChangeActivitiesOnBranch_deserialisesActivityFields() {
    // Pin the JSON shape we depend on: ids, commitDate as ISO-8601, nested conceptChanges with
    // componentChanges, ChangeType / ComponentType enum names. A field rename upstream would
    // surface here, not as silent empty-scope detection.
    String activityJson =
            """
        {"id":"act-1",
         "username":"tester",
         "branch":"%s",
         "highestPromotedBranch":"%s",
         "commitDate":"2026-05-01T06:11:51.514+00:00",
         "activityType":"CONTENT_CHANGE",
         "conceptChanges":[
           {"conceptId":"1396241000220104",
            "componentChanges":[
              {"componentId":"3004411000220119",
               "changeType":"CREATE",
               "componentType":"DESCRIPTION",
               "componentSubType":"900000000000013009",
               "effectiveTimeNull":true,
               "superseded":null}]}]}
        """
            .formatted(BRANCH, BRANCH);
    stubPage(0, "[" + activityJson + "]", true);

    List<Activity> result = client.getContentChangeActivitiesOnBranch(BRANCH);

    assertThat(result).hasSize(1);
    Activity activity = result.get(0);
    assertThat(activity.id()).isEqualTo("act-1");
    assertThat(activity.username()).isEqualTo("tester");
    assertThat(activity.commitDate()).isNotNull();
    assertThat(activity.conceptChanges()).hasSize(1);
    assertThat(activity.conceptChanges().get(0).conceptId()).isEqualTo("1396241000220104");
    ComponentChange change = activity.conceptChanges().get(0).componentChanges().get(0);
    assertThat(change.componentId()).isEqualTo("3004411000220119");
    assertThat(change.changeType()).isEqualTo(ChangeType.CREATE);
    assertThat(change.componentType()).isEqualTo(ComponentType.DESCRIPTION);
    assertThat(change.effectiveTimeNull()).isTrue();
  }

  @Test
  void getContentChangeActivitiesOnBranch_walksMultiplePagesUntilLast() {
    // 100 activities on page 0, 1 activity on page 1 marked last. The walker must request both
    // and concatenate results.
    StringBuilder fullPage = new StringBuilder("[");
    for (int i = 0; i < 100; i++) {
      if (i > 0) fullPage.append(",");
      fullPage.append(activityJson("act-page0-" + i));
    }
    fullPage.append("]");
    stubPage(0, fullPage.toString(), false);
    stubPage(1, "[" + activityJson("act-page1-only") + "]", true);

    List<Activity> result = client.getContentChangeActivitiesOnBranch(BRANCH);

    assertThat(result).hasSize(101);
    assertThat(result.get(0).id()).isEqualTo("act-page0-0");
    assertThat(result.get(100).id()).isEqualTo("act-page1-only");
  }

  @Test
  void getContentChangeActivitiesOnBranch_stopsOnShortPageEvenWhenLastIsNull() {
    // Older traceability builds may not emit `last`. Use a raw stub (last omitted entirely)
    // and verify the walker falls back to size < PAGE_SIZE.
    String body =
            """
        {"content":[%s],"totalElements":1,"totalPages":1,"number":0}
        """
            .formatted(activityJson("solo"));
    wireMock.stubFor(
        any(urlMatching(".*/activities.*page=0.*"))
            .willReturn(
                aResponse()
                    .withStatus(200)
                    .withHeader("Content-Type", "application/json")
                    .withBody(body)));

    List<Activity> result = client.getContentChangeActivitiesOnBranch(BRANCH);

    assertThat(result).extracting(Activity::id).containsExactly("solo");
  }

  @Test
  void getContentChangeActivitiesOnBranch_throwsWhenServiceReturnsEmptyBody() {
    // 200 with an empty body would silently truncate under the previous implementation. We now
    // throw so callers can't mistake "service is broken" for "no activity on branch".
    wireMock.stubFor(
        any(anyUrl())
            .willReturn(
                aResponse()
                    .withStatus(200)
                    .withHeader("Content-Type", "application/json")
                    .withBody("")));

    assertThatThrownBy(() -> client.getContentChangeActivitiesOnBranch(BRANCH))
        .isInstanceOf(LingoProblem.class)
        .hasMessageContaining("Traceability service returned no body");
  }

  // Stubs page `page` to return the given content array as a PageActivity body.
  private void stubPage(int page, String contentArray, boolean last) {
    String body =
            """
        {"content":%s,"last":%s,"totalElements":0,"totalPages":1,"number":%d}
        """
            .formatted(contentArray, last, page);
    wireMock.stubFor(
        any(urlMatching(".*/activities.*page=" + page + ".*"))
            .willReturn(
                aResponse()
                    .withStatus(200)
                    .withHeader("Content-Type", "application/json")
                    .withBody(body)));
  }

  private static String activityJson(String id) {
    return
        """
        {"id":"%s","username":"u","branch":"b","commitDate":"2026-05-01T00:00:00Z",
         "activityType":"CONTENT_CHANGE","conceptChanges":[]}
        """
        .formatted(id);
  }
}
