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
package au.gov.digitalhealth.tickets.helper;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketMetadata {

  private String name;
  private String description;
  private String descriptionMarkup;
  private List<String> externalRequestors;
  private String dedupeKey;
  private List<String> labels;

  @JsonIgnore
  public String getResolvedDescription() {
    if (descriptionMarkup != null && !descriptionMarkup.isEmpty()) {
      return descriptionMarkup;
    }
    if (description != null && !description.isEmpty()) {
      return description;
    }
    return null;
  }
}
