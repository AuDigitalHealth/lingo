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

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Data
@Builder
public class ServiceStatus {
  private Status authoringPlatform;
  private SnowstormStatus snowstorm;
  private Status cis;

  @Data
  @SuperBuilder
  public static class Status {
    private boolean running;
    private String version;
  }

  @EqualsAndHashCode(callSuper = true)
  @Data
  @SuperBuilder
  public static class SnowstormStatus extends Status {
    private String effectiveDate;
  }
}
