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

import au.gov.digitalhealth.lingo.exception.LingoProblem;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Thin client over the SNOMED CT authoring-traceability-service. Currently only exposes the one
 * call dangling-reference detection needs: every CONTENT_CHANGE activity that originated on a
 * given branch.
 */
@Component
public class TraceabilityServiceClient {

  // Page size for /activities. The service caps the page; 100 is a balance between fewer round
  // trips for chatty branches and not pulling tens of MB on a quiet one.
  private static final int PAGE_SIZE = 100;
  // Hard cap on pages walked. A single task with thousands of activity pages is pathological
  // (millions of component changes); failing loudly is preferable to silently truncating.
  private static final int MAX_PAGES = 200;

  private final WebClient traceabilityClient;

  public TraceabilityServiceClient(
      @Qualifier("authoringTraceabilityApiClient") WebClient traceabilityClient) {
    this.traceabilityClient = traceabilityClient;
  }

  /**
   * Fetch every CONTENT_CHANGE activity originally written to the given branch. Promotions and
   * higher-level rebases are excluded — we only want what was actually authored on this branch.
   * Pages are walked until the service marks the page as {@code last}; reaching {@link
   * #MAX_PAGES} without a last page throws so dangling-reference detection can't silently scope
   * to a partial activity log.
   */
  public List<Activity> getContentChangeActivitiesOnBranch(String branch) {
    List<Activity> all = new ArrayList<>();
    for (int page = 0; page < MAX_PAGES; page++) {
      PageActivity result = fetchPage(branch, page);
      if (result.content() != null) all.addAll(result.content());
      if (isLastPage(result)) return all;
    }
    throw new LingoProblem(
        "Traceability activity log for branch "
            + branch
            + " exceeded the page-walk cap ("
            + MAX_PAGES
            + " pages of "
            + PAGE_SIZE
            + "). Refusing to scope dangling-reference detection to a truncated log.");
  }

  private PageActivity fetchPage(String branch, int page) {
    PageActivity result =
        traceabilityClient
            .get()
            .uri(
                uriBuilder ->
                    uriBuilder
                        .path("/activities")
                        .queryParam("originalBranch", branch)
                        .queryParam("activityType", "CONTENT_CHANGE")
                        .queryParam("brief", "false")
                        .queryParam("page", page)
                        .queryParam("size", PAGE_SIZE)
                        .build())
            .retrieve()
            .bodyToMono(PageActivity.class)
            .block();
    if (result == null) {
      throw new LingoProblem(
          "Traceability service returned no body for /activities page "
              + page
              + " on branch "
              + branch);
    }
    return result;
  }

  // The service signals end-of-stream three ways; any one of them stops the walk. The "items
  // smaller than PAGE_SIZE" check guards against responses where last is null (older versions).
  private static boolean isLastPage(PageActivity result) {
    if (Boolean.TRUE.equals(result.last())) return true;
    List<Activity> content = result.content();
    if (content == null || content.isEmpty()) return true;
    return content.size() < PAGE_SIZE;
  }
}
