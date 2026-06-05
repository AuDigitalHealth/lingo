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
package au.gov.digitalhealth.tickets;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;
import java.util.Set;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Data
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class TicketMinimalDto extends BaseAuditableDto implements Serializable {

  public static final String TGA_ENTRY_FIELD_NAME = "Tga Entry";
  public static final String ARTGID_ADDITIONAL_FIELD_TYPE = "ARTGID";

  private String title;

  private String ticketNumber;

  private String description;

  private String assignee;

  private StateDto state;

  private Set<LabelDto> labels;

  private Set<JsonFieldDto> jsonFields;

  @JsonProperty("ticket-additional-fields")
  private Set<AdditionalFieldValueDto> additionalFieldValues;

  public String fetchValueOfAdditionalFieldByType(String additionalFieldType) {
    return additionalFieldValues.stream()
        .filter(
            field -> field.getAdditionalFieldType().getName().equalsIgnoreCase(additionalFieldType))
        .map(AdditionalFieldValueDto::getValueOf)
        .findFirst()
        .orElse(null);
  }

  public JsonFieldDto fetchJsonEntryByFieldName(String jsonFieldName) {
    return jsonFields.stream()
        .filter(jsonFieldDto -> jsonFieldDto.getName().equals(jsonFieldName))
        .findFirst()
        .orElse(null);
  }
}
