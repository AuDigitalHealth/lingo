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

import au.gov.digitalhealth.tickets.models.Ticket;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PbsRequest {

  // corresponds to a ticket id
  private Long id;

  private Long artgid;

  private String name;

  private String description;

  public String createDescriptionMarkup() {
    return "<p><strong>Pbs Description:</strong>" + this.getDescription() + "</p>";
  }

  // TODO: name and description, as these aren't necassarily what is in the title & description of
  // the ticket
  public static PbsRequest fromTicket(Ticket ticket) {
    String artgid = AdditionalFieldUtils.findValueByAdditionalFieldName("ARTGID", ticket);
    Long artgidLong = artgid != null ? Long.valueOf(artgid) : null;
    return PbsRequest.builder().id(ticket.getId()).artgid(artgidLong).build();
  }
}
