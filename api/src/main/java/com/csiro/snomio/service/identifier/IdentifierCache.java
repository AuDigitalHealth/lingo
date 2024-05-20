package com.csiro.snomio.service.identifier;

import java.util.Deque;
import java.util.NoSuchElementException;
import java.util.concurrent.ConcurrentLinkedDeque;
import lombok.Getter;
import lombok.extern.java.Log;

@Getter
@Log
public class IdentifierCache {
  @Getter private final int namespaceId;
  @Getter private final String partitionId;
  @Getter private final int maxCapacity;
  @Getter private final float refilThreshold;

  private final IdentifierSource source;

  private final Deque<Long> identifiers = new ConcurrentLinkedDeque<>();

  IdentifierCache(
      int namespaceId,
      String partitionId,
      int maxCapacity,
      float refilThreshold,
      IdentifierSource source) {
    this.namespaceId = namespaceId;
    this.partitionId = partitionId;
    this.maxCapacity = maxCapacity;
    this.refilThreshold = refilThreshold;
    this.source = source;
  }

  public void topUp() throws InterruptedException {
    log.fine("Top up identifiers in cache " + namespaceId + " " + partitionId);
    if (identifiers.size() < (maxCapacity / refilThreshold)) {
      int quantity = maxCapacity - identifiers.size();
      log.fine(
          "Reserving "
              + quantity
              + "more identifiers for cache "
              + namespaceId
              + " "
              + partitionId);
      identifiers.addAll(source.reserveIds(namespaceId, partitionId, quantity));
    }
  }

  public Long getIdentifier() throws InterruptedException {
    Long identifier = null;
    try {
      identifier = identifiers.pop();
    } catch (NoSuchElementException e) {
      topUp();
      identifier = identifiers.pop();
    }
    return identifier;
  }
}
