package com.csiro.snomio.service.identifier;

import com.csiro.snomio.exception.SnomioProblem;
import java.util.List;

public interface IdentifierSource {

  default boolean isReservationAvailable() {
    return false;
  }

  List<Long> reserveIds(int namespace, String partitionId, int quantity)
      throws SnomioProblem, InterruptedException;
}
