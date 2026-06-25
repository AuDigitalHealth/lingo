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
package au.gov.digitalhealth.lingo;

import au.csiro.snowstorm_client.api.AdminApi;
import au.csiro.snowstorm_client.api.BranchingApi;
import au.csiro.snowstorm_client.invoker.ApiClient;
import au.csiro.snowstorm_client.model.SnowstormCreateBranchRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Test-only helper that creates and deletes Snowstorm branches against the test Snowstorm
 * container, so each test can author onto its own isolated child branch.
 */
@Slf4j
public class SnowstormBranchManager {

  private final BranchingApi branchingApi;
  private final AdminApi adminApi;

  public SnowstormBranchManager(String snowstormUrl) {
    ApiClient apiClient = new ApiClient(WebClient.builder().build());
    apiClient.setBasePath(snowstormUrl);
    this.branchingApi = new BranchingApi(apiClient);
    this.adminApi = new AdminApi(apiClient);
  }

  /**
   * Creates {@code parent/name} as a child branch and returns the actual path assigned by
   * Snowstorm. Snowstorm normalises branch names to uppercase, so the returned path may differ in
   * case from the supplied {@code name}. Blocks.
   */
  public String createChildBranch(String parent, String name) {
    var branch =
        branchingApi
            .createBranch(new SnowstormCreateBranchRequest().parent(parent).name(name))
            .block();
    return branch != null ? branch.getPath() : parent + "/" + name;
  }

  /** Best-effort branch deletion. Never throws; logs a warning on failure. */
  public void deleteBranch(String branchPath) {
    try {
      adminApi.hardDeleteBranch(branchPath).block();
    } catch (Exception e) {
      log.warn("Best-effort delete of branch {} failed: {}", branchPath, e.getMessage());
    }
  }

  static String sanitise(String segment) {
    return segment.replaceAll("[^A-Za-z0-9-]", "-");
  }
}
