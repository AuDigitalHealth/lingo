package com.csiro.tickets.helper;

import com.csiro.snomio.exception.CsvCreationProblem;
import com.csiro.tickets.models.ExternalRequestor;
import com.csiro.tickets.models.Ticket;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;

public class CsvUtils {

  private CsvUtils() {}

  public static ByteArrayInputStream createAdhaCsv(List<Ticket> tickets) {

    ByteArrayOutputStream out = new ByteArrayOutputStream();

    String[] headers = {
      "Date Requested", "External Requesters", "ARTG ID", "Title", "Priority", "Release Date"
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

  public static String getExternalRequesters(List<ExternalRequestor> externalRequestors) {

    return externalRequestors.stream()
        .map(ExternalRequestor::getName)
        .collect(Collectors.joining(", "));
  }
}
