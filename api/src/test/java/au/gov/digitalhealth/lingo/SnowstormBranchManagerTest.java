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

import static org.assertj.core.api.Assertions.assertThat;

import au.csiro.snowstorm_client.api.BranchingApi;
import au.csiro.snowstorm_client.invoker.ApiClient;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.web.reactive.function.client.WebClient;

@ExtendWith(AmtV4SnowstormExtension.class)
class SnowstormBranchManagerTest {

  private static final String BASE = "MAIN/SNOMEDCT-AU/AUAMT";

  private String url() {
    return System.getProperty("ihtsdo.snowstorm.api.url");
  }

  @Test
  void createChildBranchCreatesRetrievableBranch() {
    SnowstormBranchManager manager = new SnowstormBranchManager(url());

    String path = manager.createChildBranch(BASE, "SnowstormBranchManagerTest-create-abc12345");

    // Snowstorm normalises branch names to uppercase; the returned path reflects that.
    assertThat(path).isEqualTo(BASE + "/SNOWSTORMBRANCHMANAGERTEST-CREATE-ABC12345");
    // Lock in Snowstorm's branch-name normalisation: the child segment is uppercased.
    assertThat(path).isEqualTo(path.toUpperCase());

    ApiClient client = new ApiClient(WebClient.builder().build());
    client.setBasePath(url());
    // retrieveBranch throws WebClientResponseException if the branch does not exist
    assertThat(new BranchingApi(client).retrieveBranch(path, false).block()).isNotNull();
  }

  @Test
  void deleteBranchRemovesIt() {
    SnowstormBranchManager manager = new SnowstormBranchManager(url());
    String path = manager.createChildBranch(BASE, "SnowstormBranchManagerTest-del-def67890");

    manager.deleteBranch(path);

    ApiClient client = new ApiClient(WebClient.builder().build());
    client.setBasePath(url());
    org.assertj.core.api.Assertions.assertThatThrownBy(
            () -> new BranchingApi(client).retrieveBranch(path, false).block())
        .isInstanceOf(
            org.springframework.web.reactive.function.client.WebClientResponseException.class);
  }

  @Test
  void sanitiseReplacesIllegalChars() {
    assertThat(SnowstormBranchManager.sanitise("Foo.Bar$Baz 1")).isEqualTo("Foo-Bar-Baz-1");
  }
}
