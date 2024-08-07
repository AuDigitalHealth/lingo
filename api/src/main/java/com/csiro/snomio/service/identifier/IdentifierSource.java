package com.csiro.snomio.service.identifier;

import com.csiro.snomio.exception.SnomioProblem;
import com.csiro.snomio.models.ServiceStatus.Status;
import java.util.List;

public interface IdentifierSource {

  Status getStatus();

  default boolean isReservationAvailable() {
    return false;
  }

  List<Long> reserveIds(int namespace, String partitionId, int quantity)
      throws SnomioProblem, InterruptedException;
}
