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
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.models.TicketExternalRequestor;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;

public class CsvUtils {

  private CsvUtils() {}

  public record ColumnDef(String key, String header, Function<Ticket, String> extractor) {}

  public static final List<String> DEFAULT_BACKLOG_COLUMNS =
      List.of(
          "ticketNumber",
          "createdDate",
          "title",
          "schedule",
          "priority",
          "iteration",
          "status",
          "dueDate",
          "closedDate");

  private static final List<ColumnDef> COLUMN_DEFINITIONS =
      List.of(
          new ColumnDef("ticketNumber", "Ticket Number", t -> str(t.getTicketNumber())),
          new ColumnDef("title", "Title", t -> str(t.getTitle())),
          new ColumnDef(
              "submissionDate",
              "Submission Date",
              t ->
                  AdditionalFieldUtils.formatDate(
                      t.getJiraCreated() != null ? t.getJiraCreated() : t.getCreated())),
          new ColumnDef(
              "priority",
              "Priority",
              t -> t.getPriorityBucket() != null ? t.getPriorityBucket().getName() : ""),
          new ColumnDef(
              "release",
              "Release",
              t ->
                  t.getIteration() != null
                      ? AdditionalFieldUtils.formatDateFromTitle(t.getIteration().getName())
                      : ""),
          new ColumnDef(
              "iteration",
              "Release",
              t -> t.getIteration() != null ? t.getIteration().getName() : ""),
          new ColumnDef("description", "Description", t -> str(t.getDescription())),
          new ColumnDef("assignee", "Assignee", t -> str(t.getAssignee())),
          new ColumnDef(
              "status", "Status", t -> t.getState() != null ? t.getState().getLabel() : ""),
          new ColumnDef(
              "schedule",
              "Schedule",
              t -> t.getSchedule() != null ? t.getSchedule().getName() : ""),
          new ColumnDef(
              "dueDate",
              "Due Date",
              t ->
                  t.getDueDate() != null
                      ? t.getDueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                      : ""),
          new ColumnDef(
              "externalRequesters",
              "External Requesters",
              t -> getExternalRequesters(t.getTicketExternalRequestors())),
          new ColumnDef(
              "labels",
              "Labels",
              t ->
                  t.getLabels().stream()
                      .map(l -> l.getName())
                      .sorted()
                      .collect(Collectors.joining(", "))),
          new ColumnDef(
              "hasProducts",
              "Has Products",
              t -> t.getProducts() != null && !t.getProducts().isEmpty() ? "Yes" : "No"),
          new ColumnDef(
              "createdDate", "Created Date", t -> AdditionalFieldUtils.formatDate(t.getCreated())),
          new ColumnDef(
              "modifiedDate",
              "Modified Date",
              t -> AdditionalFieldUtils.formatDate(t.getModified())),
          new ColumnDef("createdBy", "Created By", t -> str(t.getCreatedBy())),
          new ColumnDef("modifiedBy", "Modified By", t -> str(t.getModifiedBy())));

  public static ColumnDef columnDef(String key, String header, Function<Ticket, String> extractor) {
    return new ColumnDef(key, header, extractor);
  }

  public static List<ColumnDef> resolveColumns(List<String> selectedKeys) {
    Map<String, ColumnDef> byKey =
        COLUMN_DEFINITIONS.stream()
            .collect(Collectors.toMap(ColumnDef::key, cd -> cd, (a, b) -> a));
    return selectedKeys.stream().map(byKey::get).filter(Objects::nonNull).toList();
  }

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
                  CsvUtils.getExternalRequesters(ticket.getTicketExternalRequestors()),
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

  public static ByteArrayInputStream createBacklogCsv(
      List<Ticket> tickets, List<ColumnDef> columns) {

    String[] headers = columns.stream().map(ColumnDef::header).toArray(String[]::new);

    ByteArrayOutputStream out = new ByteArrayOutputStream();
    CSVFormat csvFormat = CSVFormat.DEFAULT.builder().setHeader(headers).build();

    try (final CSVPrinter printer = new CSVPrinter(new PrintWriter(out), csvFormat)) {
      tickets.forEach(
          ticket -> {
            try {
              printer.printRecord(
                  columns.stream().map(col -> col.extractor().apply(ticket)).toList());
            } catch (IOException ioException) {
              throw new CsvCreationProblem(ioException.getMessage());
            }
          });
    } catch (IOException ioException) {
      throw new CsvCreationProblem(ioException.getMessage());
    }

    return new ByteArrayInputStream(out.toByteArray());
  }

  public static String getExternalRequesters(Set<TicketExternalRequestor> associations) {
    return associations.stream()
        .map(ter -> ter.getExternalRequestor().getName())
        .collect(Collectors.joining(", "));
  }

  private static String str(String value) {
    return value != null ? value : "";
  }
}
