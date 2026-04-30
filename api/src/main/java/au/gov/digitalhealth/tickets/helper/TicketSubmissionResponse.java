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

import au.gov.digitalhealth.tickets.models.AdditionalFieldValue;
import au.gov.digitalhealth.tickets.models.Label;
import au.gov.digitalhealth.tickets.models.Product;
import au.gov.digitalhealth.tickets.models.Ticket;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketSubmissionResponse {

  private Long ticketId;
  private String ticketNumber;
  private String title;
  private String status;
  private List<String> warnings;
  private Set<Product> products = new HashSet<>();
  private Set<Label> labels = new HashSet<>();
  private String artgId;

  public TicketSubmissionResponse(Ticket ticket) {
    this.ticketId = ticket.getId();
    this.ticketNumber = ticket.getTicketNumber();
    this.title = ticket.getTitle();
    this.status = ticket.getState() != null ? ticket.getState().getLabel() : null;
    this.products = ticket.getProducts() != null ? ticket.getProducts() : new HashSet<>();
    this.labels = ticket.getLabels() != null ? ticket.getLabels() : new HashSet<>();
    Set<AdditionalFieldValue> fieldValues = ticket.getAdditionalFieldValues();
    this.artgId =
        fieldValues != null
            ? fieldValues.stream()
                .filter(value -> value.getAdditionalFieldType().getName().equals("ARTGID"))
                .findFirst()
                .map(AdditionalFieldValue::getValueOf)
                .orElse(null)
            : null;
  }
}
