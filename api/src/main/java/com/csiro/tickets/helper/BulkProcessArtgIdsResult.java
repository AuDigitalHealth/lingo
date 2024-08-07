package com.csiro.tickets.helper;

import com.csiro.tickets.models.Ticket;
import java.util.List;
import java.util.Map;

public class BulkProcessArtgIdsResult {
  private List<Ticket> createdTickets;
  private Map<String, Throwable> failedItems;

  public BulkProcessArtgIdsResult(List<Ticket> createdTickets, Map<String, Throwable> failedItems) {
    this.createdTickets = createdTickets;
    this.failedItems = failedItems;
  }

  public List<Ticket> getCreatedTickets() {
    return createdTickets;
  }

  public Map<String, Throwable> getFailedItems() {
    return failedItems;
  }
}
