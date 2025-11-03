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

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;

@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
@Log
public class RequestScopedBranchTimestampService {
  private final Map<String, Long> branchTimestamps = new ConcurrentHashMap<>();
  private final SnowstormClient snowstormClient;

  @Autowired
  public RequestScopedBranchTimestampService(SnowstormClient snowstormClient) {
    this.snowstormClient = snowstormClient;
  }

  /** Get the current timestamp for a branch, calculating it only once per request. */
  public Long getBranchTimestamp(String branch) {
    return branchTimestamps.computeIfAbsent(branch, this::fetchBranchTimestamp);
  }

  private Long fetchBranchTimestamp(String branch) {
    Long timestamp = snowstormClient.getBranchHeadAndBaseTimestamp(branch);
    log.fine("Fetched timestamps for branch " + branch + ": " + timestamp);
    return timestamp;
  }
}
