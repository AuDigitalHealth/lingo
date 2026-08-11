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
package au.gov.digitalhealth.tickets.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import au.gov.digitalhealth.tickets.helper.BacklogExportRequest;
import au.gov.digitalhealth.tickets.models.AdditionalFieldType;
import au.gov.digitalhealth.tickets.models.AdditionalFieldValue;
import au.gov.digitalhealth.tickets.models.ExternalRequestor;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.models.TicketExternalRequestor;
import au.gov.digitalhealth.tickets.repository.AdditionalFieldTypeRepository;
import au.gov.digitalhealth.tickets.repository.ExternalRequestorRepository;
import au.gov.digitalhealth.tickets.repository.IterationRepository;
import au.gov.digitalhealth.tickets.repository.LabelRepository;
import au.gov.digitalhealth.tickets.repository.StateRepository;
import au.gov.digitalhealth.tickets.repository.TicketAuditRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ExportServiceTest {

  @Mock TicketRepository ticketRepository;
  @Mock LabelRepository labelRepository;
  @Mock IterationRepository iterationRepository;
  @Mock StateRepository stateRepository;
  @Mock TicketAuditRepository ticketAuditRepository;
  @Mock ExternalRequestorRepository externalRequestorRepository;
  @Mock AdditionalFieldTypeRepository additionalFieldTypeRepository;

  @InjectMocks ExportService exportService;

  // ---------------------------------------------------------------------------
  // Default columns
  // ---------------------------------------------------------------------------

  @Test
  void backlogCsvExport_nullRequest_producesDefaultColumnHeaders() throws IOException {
    List<Long> ids = List.of(1L);
    Ticket ticket = basicTicket(1L, "Aspirin 100 mg tablet", "SNOMIO-1");
    stubTickets(ids, List.of(ticket));
    when(ticketAuditRepository.findClosedDates(ids)).thenReturn(List.of());

    List<String> headers = parseHeaders(exportService.backlogCsvExport(null));

    assertThat(headers)
        .containsExactly(
            "Ticket Number",
            "Created Date",
            "Title",
            "Schedule",
            "Priority",
            "Release",
            "Status",
            "Due Date",
            "Closed Date");
  }

  // ---------------------------------------------------------------------------
  // Explicit column selection
  // ---------------------------------------------------------------------------

  @Test
  void backlogCsvExport_selectedColumns_buildsExactHeaders() throws IOException {
    List<Long> ids = List.of(1L);
    stubTickets(ids, List.of(basicTicket(1L, "Product A", "SNOMIO-1")));

    BacklogExportRequest request =
        BacklogExportRequest.builder().columns(List.of("ticketNumber", "status")).build();

    List<String> headers = parseHeaders(exportService.backlogCsvExport(request));

    assertThat(headers).containsExactly("Ticket Number", "Status");
    verify(ticketAuditRepository, never()).findClosedDates(any());
  }

  @Test
  void backlogCsvExport_selectedColumns_populatesDataCorrectly() throws IOException {
    List<Long> ids = List.of(1L);
    Ticket ticket = basicTicket(1L, "Paracetamol 500 mg", "SNOMIO-42");
    stubTickets(ids, List.of(ticket));

    BacklogExportRequest request =
        BacklogExportRequest.builder().columns(List.of("ticketNumber", "title")).build();

    List<CSVRecord> records = parseRecords(exportService.backlogCsvExport(request));

    assertThat(records).hasSize(1);
    assertThat(records.get(0).get("Ticket Number")).isEqualTo("SNOMIO-42");
    assertThat(records.get(0).get("Title")).isEqualTo("Paracetamol 500 mg");
  }

  // ---------------------------------------------------------------------------
  // closedDate column
  // ---------------------------------------------------------------------------

  @Test
  void backlogCsvExport_closedDateSelected_populatesDateFromAudit() throws IOException {
    List<Long> ids = List.of(1L);
    Ticket ticket = basicTicket(1L, "Product A", "SNOMIO-1");
    stubTickets(ids, List.of(ticket));

    Instant closedAt = Instant.parse("2024-08-01T04:00:00Z"); // 01/08/2024 in Brisbane (UTC+10)
    when(ticketAuditRepository.findClosedDates(ids))
        .thenReturn(List.<Object[]>of(new Object[] {1L, closedAt.toEpochMilli()}));

    BacklogExportRequest request =
        BacklogExportRequest.builder().columns(List.of("ticketNumber", "closedDate")).build();

    List<CSVRecord> records = parseRecords(exportService.backlogCsvExport(request));

    assertThat(records.get(0).get("Ticket Number")).isEqualTo("SNOMIO-1");
    assertThat(records.get(0).get("Closed Date")).isEqualTo("01/08/2024");
  }

  @Test
  void backlogCsvExport_closedDateSelected_blankWhenNoAuditRecord() throws IOException {
    List<Long> ids = List.of(1L);
    stubTickets(ids, List.of(basicTicket(1L, "Product A", "SNOMIO-1")));
    when(ticketAuditRepository.findClosedDates(ids)).thenReturn(List.of());

    BacklogExportRequest request =
        BacklogExportRequest.builder().columns(List.of("ticketNumber", "closedDate")).build();

    List<CSVRecord> records = parseRecords(exportService.backlogCsvExport(request));

    assertThat(records.get(0).get("Closed Date")).isEmpty();
  }

  @Test
  void backlogCsvExport_closedDateSelected_emptyResultSet_stillIncludesHeader() throws IOException {
    stubTickets(List.of(), List.of());

    BacklogExportRequest request =
        BacklogExportRequest.builder().columns(List.of("ticketNumber", "closedDate")).build();

    List<String> headers = parseHeaders(exportService.backlogCsvExport(request));

    assertThat(headers).contains("Closed Date");
    verify(ticketAuditRepository, never()).findClosedDates(any());
  }

  // ---------------------------------------------------------------------------
  // Dynamic external requestor date columns
  // ---------------------------------------------------------------------------

  @Test
  void backlogCsvExport_externalRequestorDateColumns_addsColumnsWithDates() throws IOException {
    List<Long> ids = List.of(1L);
    Ticket ticket = basicTicket(1L, "Product A", "SNOMIO-1");
    stubTickets(ids, List.of(ticket));

    Instant addedAt = Instant.parse("2024-05-20T00:00:00Z"); // 20/05/2024
    when(ticketAuditRepository.findExternalRequestorAddedDates(eq(ids), eq(List.of("TGA"))))
        .thenReturn(List.<Object[]>of(new Object[] {1L, "TGA", addedAt.toEpochMilli()}));

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber"))
            .externalRequestorColumns(List.of("TGA"))
            .erDateAdded(true)
            .build();

    List<CSVRecord> records = parseRecords(exportService.backlogCsvExport(request));

    assertThat(records.get(0).get("TGA Added Date")).isEqualTo("20/05/2024");
  }

  // ---------------------------------------------------------------------------
  // Dynamic additional-field columns
  // ---------------------------------------------------------------------------

  @Test
  void backlogCsvExport_additionalFieldColumns_addColumnPerFieldWithValue() throws IOException {
    List<Long> ids = List.of(1L);
    Ticket ticket = basicTicket(1L, "Product A", "SNOMIO-1");
    ticket.getAdditionalFieldValues().add(additionalFieldValue("ARTGID", "123456"));
    stubTickets(ids, List.of(ticket));

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber"))
            .additionalFieldColumns(List.of("ARTGID"))
            .build();

    List<CSVRecord> records = parseRecords(exportService.backlogCsvExport(request));

    assertThat(records.get(0).get("ARTGID")).isEqualTo("123456");
  }

  @Test
  void backlogCsvExport_additionalFieldColumns_blankWhenTicketHasNoValue() throws IOException {
    List<Long> ids = List.of(1L);
    stubTickets(ids, List.of(basicTicket(1L, "Product A", "SNOMIO-1")));

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber"))
            .additionalFieldColumns(List.of("ARTGID"))
            .build();

    List<CSVRecord> records = parseRecords(exportService.backlogCsvExport(request));

    assertThat(records.get(0).get("ARTGID")).isEmpty();
  }

  @Test
  void backlogCsvExport_additionalFieldColumns_headerUsesDisplayName() throws IOException {
    List<Long> ids = List.of(1L);
    Ticket ticket = basicTicket(1L, "Product A", "SNOMIO-1");
    ticket.getAdditionalFieldValues().add(additionalFieldValue("ARTGID", "123456"));
    stubTickets(ids, List.of(ticket));
    when(additionalFieldTypeRepository.findAll())
        .thenReturn(List.of(additionalFieldType("ARTGID", "ARTG ID")));

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber"))
            .additionalFieldColumns(List.of("ARTGID"))
            .build();

    List<CSVRecord> records = parseRecords(exportService.backlogCsvExport(request));

    // The selection is keyed by name, but the header shows the display name.
    assertThat(records.get(0).get("ARTG ID")).isEqualTo("123456");
  }

  @Test
  void backlogCsvExport_additionalFieldColumns_headerFallsBackToNameWhenTypeUnknown()
      throws IOException {
    List<Long> ids = List.of(1L);
    Ticket ticket = basicTicket(1L, "Product A", "SNOMIO-1");
    ticket.getAdditionalFieldValues().add(additionalFieldValue("ARTGID", "123456"));
    stubTickets(ids, List.of(ticket));
    // A saved preset referencing a since-deleted type resolves to nothing.
    when(additionalFieldTypeRepository.findAll()).thenReturn(List.of());

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber"))
            .additionalFieldColumns(List.of("ARTGID"))
            .build();

    List<String> headers = parseHeaders(exportService.backlogCsvExport(request));

    assertThat(headers).containsExactly("Ticket Number", "ARTGID");
  }

  // ---------------------------------------------------------------------------
  // Positional external requestor columns (erWithDateRequested)
  // ---------------------------------------------------------------------------

  @Test
  void backlogCsvExport_erWithDateRequested_emitsPositionalNameAndDatePairs() throws IOException {
    List<Long> ids = List.of(1L);
    Ticket ticket = basicTicket(1L, "Product A", "SNOMIO-1");
    ticket.setTicketExternalRequestors(
        new LinkedHashSet<>(
            List.of(
                ticketExternalRequestor("Michael", LocalDate.of(2024, 2, 15)),
                ticketExternalRequestor("Andreas", LocalDate.of(2024, 1, 10)),
                ticketExternalRequestor("NoDate", null))));
    stubTickets(ids, List.of(ticket));

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber"))
            .erWithDateRequested(true)
            .build();

    List<CSVRecord> records = parseRecords(exportService.backlogCsvExport(request));
    CSVRecord row = records.get(0);

    // Every requestor is included, ordered by requested date with undated ones last. Requestors
    // without a requested date still get a column pair — only the date cell is left blank.
    assertThat(row.get("External Requester 1")).isEqualTo("Andreas");
    assertThat(row.get("External Requester 1 Date Requested")).isEqualTo("10/01/2024");
    assertThat(row.get("External Requester 2")).isEqualTo("Michael");
    assertThat(row.get("External Requester 2 Date Requested")).isEqualTo("15/02/2024");
    assertThat(row.get("External Requester 3")).isEqualTo("NoDate");
    assertThat(row.get("External Requester 3 Date Requested")).isEmpty();
    assertThat(row.toMap()).doesNotContainKey("External Requester 4");
  }

  @Test
  void backlogCsvExport_erWithDateRequested_ordersByDateRequestedNotAlphabetically()
      throws IOException {
    List<Long> ids = List.of(1L);
    Ticket ticket = basicTicket(1L, "Product A", "SNOMIO-1");
    ticket.setTicketExternalRequestors(
        new LinkedHashSet<>(
            List.of(
                ticketExternalRequestor("Alpha", LocalDate.of(2024, 6, 1)),
                ticketExternalRequestor("Zeta", LocalDate.of(2024, 1, 5)),
                ticketExternalRequestor("Beta", null))));
    stubTickets(ids, List.of(ticket));

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber"))
            .erWithDateRequested(true)
            .build();

    List<CSVRecord> records = parseRecords(exportService.backlogCsvExport(request));
    CSVRecord row = records.get(0);

    // Zeta has the earliest date so it comes first despite sorting last alphabetically; the
    // undated "Beta" trails the dated requestors.
    assertThat(row.get("External Requester 1")).isEqualTo("Zeta");
    assertThat(row.get("External Requester 1 Date Requested")).isEqualTo("05/01/2024");
    assertThat(row.get("External Requester 2")).isEqualTo("Alpha");
    assertThat(row.get("External Requester 2 Date Requested")).isEqualTo("01/06/2024");
    assertThat(row.get("External Requester 3")).isEqualTo("Beta");
    assertThat(row.get("External Requester 3 Date Requested")).isEmpty();
  }

  @Test
  void backlogCsvExport_erWithDateRequested_includesRequestorsThatHaveNoDateAtAll()
      throws IOException {
    List<Long> ids = List.of(1L);
    Ticket ticket = basicTicket(1L, "Product A", "SNOMIO-1");
    ticket.setTicketExternalRequestors(
        new LinkedHashSet<>(
            List.of(
                ticketExternalRequestor("Zeta", null), ticketExternalRequestor("Alpha", null))));
    stubTickets(ids, List.of(ticket));

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber"))
            .erWithDateRequested(true)
            .build();

    List<CSVRecord> records = parseRecords(exportService.backlogCsvExport(request));
    CSVRecord row = records.get(0);

    // A ticket whose requestors all lack a requested date still lists them, with blank dates.
    // With no dates to order by, the name breaks the tie so the output stays deterministic.
    assertThat(row.get("External Requester 1")).isEqualTo("Alpha");
    assertThat(row.get("External Requester 1 Date Requested")).isEmpty();
    assertThat(row.get("External Requester 2")).isEqualTo("Zeta");
    assertThat(row.get("External Requester 2 Date Requested")).isEmpty();
  }

  @Test
  void backlogCsvExport_erWithDateRequested_columnCountIsMaxAcrossTickets() throws IOException {
    List<Long> ids = List.of(1L, 2L);
    Ticket ticket1 = basicTicket(1L, "Product A", "SNOMIO-1");
    ticket1.setTicketExternalRequestors(
        new LinkedHashSet<>(
            List.of(
                ticketExternalRequestor("Andreas", LocalDate.of(2024, 1, 10)),
                ticketExternalRequestor("Michael", LocalDate.of(2024, 2, 15)))));
    Ticket ticket2 = basicTicket(2L, "Product B", "SNOMIO-2");
    ticket2.setTicketExternalRequestors(
        new LinkedHashSet<>(List.of(ticketExternalRequestor("Beata", LocalDate.of(2024, 3, 1)))));
    stubTickets(ids, List.of(ticket1, ticket2));

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber"))
            .erWithDateRequested(true)
            .build();

    List<CSVRecord> records = parseRecords(exportService.backlogCsvExport(request));

    // maxCount is 2, so ticket2's second pair is present but empty.
    assertThat(records.get(1).get("External Requester 1")).isEqualTo("Beata");
    assertThat(records.get(1).get("External Requester 2")).isEmpty();
    assertThat(records.get(1).get("External Requester 2 Date Requested")).isEmpty();
  }

  // ---------------------------------------------------------------------------
  // Empty ticket list
  // ---------------------------------------------------------------------------

  @Test
  void backlogCsvExport_emptyTicketList_skipsAllAuditQueries() throws IOException {
    stubTickets(List.of(), List.of());

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber", "closedDate"))
            .externalRequestorColumns(List.of("TGA"))
            .erDateAdded(true)
            .build();

    exportService.backlogCsvExport(request);

    verify(ticketAuditRepository, never()).findClosedDates(any());
    verify(ticketAuditRepository, never()).findExternalRequestorAddedDates(any(), any());
  }

  @Test
  void backlogCsvExport_emptyTicketList_dynamicColumnsStillAppearInHeaders() throws IOException {
    stubTickets(List.of(), List.of());

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber"))
            .externalRequestorColumns(List.of("TGA"))
            .erDateAdded(true)
            .build();

    List<String> headers = parseHeaders(exportService.backlogCsvExport(request));

    assertThat(headers).contains("TGA Added Date");
  }

  // ---------------------------------------------------------------------------
  // User-defined column order
  // ---------------------------------------------------------------------------

  @Test
  void backlogCsvExport_columnOrder_reordersHeadersByKey() throws IOException {
    List<Long> ids = List.of(1L);
    stubTickets(ids, List.of(basicTicket(1L, "Product A", "SNOMIO-1")));

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber", "title", "status"))
            .columnOrder(List.of("status", "ticketNumber", "title"))
            .build();

    List<String> headers = parseHeaders(exportService.backlogCsvExport(request));

    assertThat(headers).containsExactly("Status", "Ticket Number", "Title");
  }

  @Test
  void backlogCsvExport_columnOrder_reordersClosedDateAndAdditionalFieldColumn()
      throws IOException {
    List<Long> ids = List.of(1L);
    Ticket ticket = basicTicket(1L, "Product A", "SNOMIO-1");
    ticket.getAdditionalFieldValues().add(additionalFieldValue("ARTGID", "123456"));
    stubTickets(ids, List.of(ticket));
    when(ticketAuditRepository.findClosedDates(ids)).thenReturn(List.of());

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber", "closedDate"))
            .additionalFieldColumns(List.of("ARTGID"))
            .columnOrder(List.of("af_ARTGID", "closedDate", "ticketNumber"))
            .build();

    List<String> headers = parseHeaders(exportService.backlogCsvExport(request));

    // Both the audit-derived closedDate column and the dynamic additional-field column obey the
    // explicit order alongside static columns.
    assertThat(headers).containsExactly("ARTGID", "Closed Date", "Ticket Number");
  }

  @Test
  void backlogCsvExport_columnOrder_positionalRequestorColumnsStayLast() throws IOException {
    List<Long> ids = List.of(1L);
    Ticket ticket = basicTicket(1L, "Product A", "SNOMIO-1");
    ticket.setTicketExternalRequestors(
        new LinkedHashSet<>(
            List.of(ticketExternalRequestor("Andreas", LocalDate.of(2024, 1, 10)))));
    stubTickets(ids, List.of(ticket));

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber", "title"))
            .erWithDateRequested(true)
            .columnOrder(List.of("title", "ticketNumber"))
            .build();

    List<String> headers = parseHeaders(exportService.backlogCsvExport(request));

    // Static columns follow the explicit order; dynamic positional requestor columns are not in
    // columnOrder, so they keep their relative order and fall to the end.
    assertThat(headers)
        .containsExactly(
            "Title",
            "Ticket Number",
            "External Requester 1",
            "External Requester 1 Date Requested");
  }

  @Test
  void backlogCsvExport_columnOrder_positionalGroupMovesToSentinelPosition() throws IOException {
    List<Long> ids = List.of(1L);
    Ticket ticket = basicTicket(1L, "Product A", "SNOMIO-1");
    ticket.setTicketExternalRequestors(
        new LinkedHashSet<>(
            List.of(ticketExternalRequestor("Andreas", LocalDate.of(2024, 1, 10)))));
    stubTickets(ids, List.of(ticket));

    BacklogExportRequest request =
        BacklogExportRequest.builder()
            .columns(List.of("ticketNumber", "title"))
            .erWithDateRequested(true)
            .columnOrder(List.of("__erPositional__", "title", "ticketNumber"))
            .build();

    List<String> headers = parseHeaders(exportService.backlogCsvExport(request));

    // The positional group sits where the sentinel was placed (first), then the static columns.
    assertThat(headers)
        .containsExactly(
            "External Requester 1",
            "External Requester 1 Date Requested",
            "Title",
            "Ticket Number");
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private void stubTickets(List<Long> ids, List<Ticket> tickets) {
    when(ticketRepository.findAllIdsByPredicate(any(), any(Sort.class), any())).thenReturn(ids);
    when(ticketRepository.findByIdIn(ids)).thenReturn(tickets);
  }

  private static AdditionalFieldType additionalFieldType(String name, String displayName) {
    AdditionalFieldType fieldType = new AdditionalFieldType();
    fieldType.setName(name);
    fieldType.setDisplayName(displayName);
    fieldType.setType(AdditionalFieldType.Type.STRING);
    return fieldType;
  }

  private static AdditionalFieldValue additionalFieldValue(String name, String value) {
    AdditionalFieldType fieldType = additionalFieldType(name, name);
    AdditionalFieldValue fieldValue = new AdditionalFieldValue();
    fieldValue.setAdditionalFieldType(fieldType);
    fieldValue.setValueOf(value);
    return fieldValue;
  }

  private static TicketExternalRequestor ticketExternalRequestor(
      String name, LocalDate dateRequested) {
    ExternalRequestor externalRequestor = new ExternalRequestor();
    externalRequestor.setName(name);
    TicketExternalRequestor ter = new TicketExternalRequestor();
    ter.setExternalRequestor(externalRequestor);
    ter.setDateRequested(dateRequested);
    return ter;
  }

  private static Ticket basicTicket(long id, String title, String ticketNumber) {
    Ticket ticket = new Ticket();
    ReflectionTestUtils.setField(ticket, "id", id);
    ticket.setTitle(title);
    ticket.setTicketNumber(ticketNumber);
    ticket.setCreated(Instant.parse("2024-01-15T00:00:00Z"));
    return ticket;
  }

  private static List<String> parseHeaders(ResponseEntity<InputStreamResource> response)
      throws IOException {
    try (CSVParser parser = toCsvParser(response)) {
      return parser.getHeaderNames();
    }
  }

  private static List<CSVRecord> parseRecords(ResponseEntity<InputStreamResource> response)
      throws IOException {
    try (CSVParser parser = toCsvParser(response)) {
      return parser.getRecords();
    }
  }

  private static CSVParser toCsvParser(ResponseEntity<InputStreamResource> response)
      throws IOException {
    InputStream is = response.getBody().getInputStream();
    String csv = new String(is.readAllBytes(), StandardCharsets.UTF_8);
    return CSVParser.parse(csv, CSVFormat.DEFAULT.withFirstRecordAsHeader());
  }
}
