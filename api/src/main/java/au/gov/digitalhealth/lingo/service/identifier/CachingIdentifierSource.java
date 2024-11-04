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

import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.service.ServiceStatus.Status;
import au.gov.digitalhealth.lingo.service.identifier.cis.CISClient;
import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Log
public class CachingIdentifierSource implements IdentifierSource {
  private final Map<Pair<Integer, String>, IdentifierCache> reservedIds = new HashMap<>();

  @Value("${cis.api.url}")
  String cisApiUrl;

  @Value("${cis.username}")
  String username;

  @Value("${cis.password}")
  String password;

  @Value("${cis.softwareName}")
  String softwareName;

  @Value("${cis.timeout:20}")
  int timeoutSeconds;

  @Value("${cis.cache.size:50}")
  int cacheSize;

  @Value("${cis.cache.refill.threshold:0.2}")
  float refillThreshold;

  @Value("${cis.cache.precreate}")
  List<String> precreate = new ArrayList<>();

  @Value("${cis.backoff.levels:30,60,180,300,600,1800}")
  List<Integer> backoffLevels = new ArrayList<>();

  private IdentifierSource identifierSource = null;

  @PostConstruct
  public void init() throws InterruptedException {
    log.info("Initialising CachingIdentifierSource");
    if (cisApiUrl != null && !cisApiUrl.isBlank() && !cisApiUrl.equals("local")) {
      identifierSource =
          new CISClient(cisApiUrl, username, password, softwareName, timeoutSeconds, backoffLevels);

      precreate.forEach(
          cacheKey -> {
            String[] parts = cacheKey.split(":");
            int namespace = Integer.parseInt(parts[0]);
            String partitionId = parts[1];
            reservedIds.put(
                Pair.of(namespace, partitionId),
                new IdentifierCache(
                    namespace, partitionId, cacheSize, refillThreshold, identifierSource));
          });

      if (identifierSource.isReservationAvailable()) {
        topUp();

        log.info(
            "CachingIdentifierSource initialised with "
                + reservedIds.keySet().stream()
                    .map(k -> k.getLeft() + ":" + k.getRight())
                    .collect(Collectors.joining(", "))
                + " caches preloaded with "
                + cacheSize
                + " identifiers.");
      } else {
        log.warning(
            "CIS client not available, configured but identifiers are not reserved "
                + "and identifier allocation not available");
      }

    } else {
      log.warning("CIS client not available, identifier allocation not available");
    }
  }

  @Scheduled(fixedDelayString = "${cis.cache.topup.interval:10000}")
  public void topUp() throws InterruptedException {
    if (identifierSource != null && identifierSource.isReservationAvailable()) {
      log.fine("Topping up identifier caches");
      for (IdentifierCache cache : reservedIds.values()) {
        try {
          cache.topUp();
        } catch (LingoProblem e) {
          log.severe(
              "Error topping up cache "
                  + cache.getNamespaceId()
                  + " "
                  + cache.getPartitionId()
                  + ": "
                  + e.getMessage());
        }
      }
    }
  }

  @Override
  public Status getStatus() {
    return identifierSource == null
        ? Status.builder().running(false).version("CIS not configured").build()
        : identifierSource.getStatus();
  }

  @Override
  public boolean isReservationAvailable() {
    return identifierSource != null && identifierSource.isReservationAvailable();
  }

  @Override
  public List<Long> reserveIds(int namespace, String partitionId, int quantity)
      throws LingoProblem, InterruptedException {
    if (identifierSource == null) {
      throw new LingoProblem(
          "identifier-service",
          "Identifier allocation not available",
          HttpStatus.INTERNAL_SERVER_ERROR,
          "CIS client not available.");
    }

    Pair<Integer, String> key = Pair.of(namespace, partitionId);

    IdentifierCache cache =
        reservedIds.computeIfAbsent(
            key,
            k ->
                new IdentifierCache(
                    namespace, partitionId, quantity, refillThreshold, identifierSource));

    List<Long> identifiers = new ArrayList<>(quantity);

    for (int i = 0; i < quantity; i++) {
      identifiers.add(cache.getIdentifier());
    }

    return identifiers;
  }
}
