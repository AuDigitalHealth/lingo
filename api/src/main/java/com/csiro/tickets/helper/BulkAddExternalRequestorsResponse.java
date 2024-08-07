package com.csiro.tickets.helper;

import com.csiro.tickets.TicketBacklogDto;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class BulkAddExternalRequestorsResponse {

  private List<TicketBacklogDto> updatedTickets;
  private List<TicketBacklogDto> createdTickets;
  private List<String> skippedAdditionalFieldValues;
}
