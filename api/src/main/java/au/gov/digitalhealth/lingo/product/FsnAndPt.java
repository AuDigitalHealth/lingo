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
package au.gov.digitalhealth.lingo.product;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SuppressWarnings("java:S116")
public class FsnAndPt {

  // Jackson's default bean-property mangling lowercases the all-caps field name to "fsn"/"pt",
  // which no longer matches the name generator's exact-case "FSN"/"PT" response keys once
  // deserialization goes through setter-based binding instead of a parameter-name-aware
  // constructor (see jackson-module-parameter-names, which Spring Boot 4 no longer pulls in
  // transitively). Pinning the wire name explicitly makes the match independent of both the
  // mangling algorithm and which deserialization path Jackson picks.
  @JsonProperty("FSN")
  String FSN;

  @JsonProperty("PT")
  String PT;
}
