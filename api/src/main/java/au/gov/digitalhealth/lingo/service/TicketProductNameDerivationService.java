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
package au.gov.digitalhealth.lingo.service;

import au.gov.digitalhealth.tickets.repository.TicketRepository;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Derives a suggested branded product name from a ticket's HPRA/PCRS jsonFields. */
@Service
public class TicketProductNameDerivationService {

  private static final String ENTRY_FIELD = "HPRA Entry";

  private final TicketRepository ticketRepository;

  public TicketProductNameDerivationService(TicketRepository ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  /**
   * Loads the ticket and derives a branded product name; empty if none can be determined.
   *
   * <p>Read-only transactional so the Hibernate session stays open while the lazy {@code labels}
   * and {@code jsonFields} collections are initialised.
   */
  @Transactional(readOnly = true)
  public Optional<String> derive(Long ticketId) {
    return ticketRepository
        .findById(ticketId)
        .flatMap(
            ticket -> {
              Set<String> labels =
                  ticket.getLabels().stream().map(l -> l.getName()).collect(Collectors.toSet());
              return ticket.getJsonFields().stream()
                  .filter(f -> ENTRY_FIELD.equals(f.getName()))
                  .map(f -> f.getValue())
                  .filter(Objects::nonNull)
                  .findFirst()
                  .flatMap(value -> deriveFrom(labels, value));
            });
  }

  /** Pure derivation from label names + the "HPRA Entry" jsonField value. */
  public static Optional<String> deriveFrom(Set<String> labelNames, JsonNode entryValue) {
    if (entryValue == null) {
      return Optional.empty();
    }
    JsonNode productName = entryValue.get("ProductName");
    if (productName == null || productName.isNull()) {
      return Optional.empty();
    }

    boolean pcrs = labelNames.contains("PCRS") || productName.isArray();
    if (!pcrs) {
      String name = productName.asText();
      return name.isBlank() ? Optional.empty() : Optional.of(name);
    }

    String name = firstText(productName);
    String packDescription = firstText(entryValue.get("PackDescription"));
    if (name == null || packDescription == null) {
      return Optional.empty();
    }
    int idx = packDescription.toLowerCase(Locale.ROOT).indexOf(name.toLowerCase(Locale.ROOT));
    if (idx < 0) {
      return Optional.empty();
    }
    return Optional.of(packDescription.substring(idx, idx + name.length()));
  }

  private static String firstText(JsonNode node) {
    if (node == null || node.isNull()) {
      return null;
    }
    if (node.isArray()) {
      return node.isEmpty() ? null : node.get(0).asText();
    }
    return node.asText();
  }
}
