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
package au.gov.digitalhealth.tickets.helper;

import au.gov.digitalhealth.lingo.exception.CsvCreationProblem;
import au.gov.digitalhealth.tickets.models.ExternalRequestor;
import au.gov.digitalhealth.tickets.models.Ticket;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;

public class CsvUtils {

  private CsvUtils() {}

  public static ByteArrayInputStream createAdhaCsv(List<Ticket> tickets) {

    ByteArrayOutputStream out = new ByteArrayOutputStream();

    String[] headers = {
      "Date Requested",
      "External Requesters",
      "ARTG ID",
      "Ticket Number",
      "Title",
      "Priority",
      "Release Date"
    };

    CSVFormat csvFormat = CSVFormat.DEFAULT.builder().setHeader(headers).build();

    try (final CSVPrinter printer = new CSVPrinter(new PrintWriter(out), csvFormat)) {
      tickets.forEach(
          ticket -> {
            try {
              printer.printRecord(
                  AdditionalFieldUtils.findValueByAdditionalFieldName("StartDate", ticket),
                  CsvUtils.getExternalRequesters(ticket.getExternalRequestors()),
                  AdditionalFieldUtils.findValueByAdditionalFieldName("ARTGID", ticket),
                  ticket.getTicketNumber(),
                  ticket.getTitle(),
                  ticket.getPriorityBucket() != null ? ticket.getPriorityBucket().getName() : "",
                  ticket.getIteration() != null
                      ? AdditionalFieldUtils.formatDateFromTitle(ticket.getIteration().getName())
                      : "");

            } catch (IOException ioException) {
              throw new CsvCreationProblem(ioException.getMessage());
            }
          });

    } catch (IOException ioException) {
      throw new CsvCreationProblem(ioException.getMessage());
    }

    return new ByteArrayInputStream(out.toByteArray());
  }

  public static String getExternalRequesters(Set<ExternalRequestor> externalRequestors) {

    return externalRequestors.stream()
        .map(ExternalRequestor::getName)
        .collect(Collectors.joining(", "));
  }
}
