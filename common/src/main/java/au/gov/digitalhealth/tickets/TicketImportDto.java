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
import java.time.Instant;
import java.util.List;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TicketImportDto {

  private Long id;

  private Instant created;

  private String assignee;

  private String title;

  private String description;

  private TicketTypeDto ticketType;

  private StateDto state;

  private ScheduleDto schedule;

  @JsonProperty(value = "labels")
  private Set<LabelDto> labels;

  @JsonProperty(value = "externalRequestors")
  private Set<ExternalRequesterDto> externalRequestors;

  @JsonProperty(value = "ticket-comment")
  private List<CommentDto> comments;

  @JsonProperty(value = "ticket-additional-fields")
  private Set<AdditionalFieldValueDto> additionalFieldValues;

  @JsonProperty(value = "ticket-attachment")
  private List<AttachmentDto> attachments;
}
