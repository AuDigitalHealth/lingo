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
package au.gov.digitalhealth.lingo.service.identifier.cis;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public final class CISGenerateRequest {

  private final String softwareName;
  private final int namespace;
  private final String partitionId;
  private final int quantity;

  @JsonCreator
  public CISGenerateRequest(
      @JsonProperty("namespace") int namespace,
      @JsonProperty("partitionId") String partitionId,
      @JsonProperty("quantity") int quantity,
      @JsonProperty("software") String software) {

    this.namespace = namespace;
    this.partitionId = partitionId;
    this.quantity = quantity;
    this.softwareName = software;
  }
}
