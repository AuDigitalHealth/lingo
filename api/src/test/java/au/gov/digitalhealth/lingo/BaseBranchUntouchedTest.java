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
import au.csiro.snowstorm_client.model.SnowstormBranchPojo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Guards the branch-per-test single-instance invariant: creating per-test child branches must never
 * mutate the shared base branch, so the Snowstorm/ES container stays pristine for the whole run.
 */
@ExtendWith(AmtV4SnowstormExtension.class)
class BaseBranchUntouchedTest {

  private static final String BASE = "MAIN/SNOMEDCT-AU/AUAMT";

  @Test
  void creatingChildBranchesDoesNotChangeBaseHead() {
    String url = System.getProperty("ihtsdo.snowstorm.api.url");
    ApiClient client = new ApiClient(WebClient.builder().build());
    client.setBasePath(url);
    BranchingApi api = new BranchingApi(client);

    SnowstormBranchPojo before = api.retrieveBranch(BASE, false).block();

    SnowstormBranchManager manager = new SnowstormBranchManager(url);
    manager.createChildBranch(BASE, "BaseBranchUntouchedTest-probe-12ab34cd");

    SnowstormBranchPojo after = api.retrieveBranch(BASE, false).block();

    // The base branch head must not move when only a child branch is created.
    assertThat(after.getHeadTimestamp()).isEqualTo(before.getHeadTimestamp());
  }
}
