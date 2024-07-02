package com.csiro.tickets.helper;

import com.csiro.tickets.models.Ticket;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PbsRequestResponse {
  // correspends to a ticket Id
  private Long id;

  private Instant submissionDate;

  // intentionally returned as null, as this is handled by the amtapi, depending on what the
  // concepts status is in snowstorm
  private RequestStatus status;

  private PbsRequest productSubmission;

  private List<RequestConcept> relatedConcepts = new ArrayList<RequestConcept>();

  public PbsRequestResponse(Ticket ticket) {
    this(PbsRequest.fromTicket(ticket), ticket);
  }

  public PbsRequestResponse(PbsRequest pbsRequest, Ticket ticket) {
    this.id = ticket.getId();
    this.submissionDate = ticket.getCreated();
    this.relatedConcepts =
        ticket.getProducts().stream()
            .map(
                product -> {
                  return RequestConcept.builder()
                      .id(product.getConceptId())
                      .name(product.getName())
                      .build();
                })
            .toList();
    this.productSubmission =
        PbsRequest.builder()
            .id(ticket.getId())
            .artgid(pbsRequest.getArtgid())
            .name(ticket.getTitle())
            .build();
  }

  private enum RequestStatus {
    PENDING("Pending"),
    AUTHORED_FOR_RELEASE("Authored for release"),
    RELEASED("Released"),
    REJECTED("Rejected");

    private final String status;

    RequestStatus(String status) {
      this.status = status;
    }

    public String getStatus() {
      return status;
    }
  }

  @Builder
  private static class RequestConcept {

    Long id;

    String name;
  }
}
