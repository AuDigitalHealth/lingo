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
package au.gov.digitalhealth.lingo.service.identifier;

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
    log.finest("Top up check for identifiers in cache " + namespaceId + " " + partitionId);
    if (identifiers.size() < (maxCapacity * refilThreshold)) {
      int quantity = maxCapacity - identifiers.size();
      log.fine(
          "Reserving "
              + quantity
              + " more identifiers for cache "
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
