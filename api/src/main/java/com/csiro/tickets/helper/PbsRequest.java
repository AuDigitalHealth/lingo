package com.csiro.tickets.helper;

import com.csiro.tickets.models.Ticket;
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
