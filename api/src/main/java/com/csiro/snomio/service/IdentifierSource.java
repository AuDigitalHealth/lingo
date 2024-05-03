package com.csiro.snomio.service;

import com.csiro.snomio.exception.SnomioProblem;
import java.util.List;

public interface IdentifierSource {

  default boolean isReservationAvailable() {
    return false;
  }

  List<Long> reserveIds(int namespace, String partitionId, int quantity) throws SnomioProblem;
}
