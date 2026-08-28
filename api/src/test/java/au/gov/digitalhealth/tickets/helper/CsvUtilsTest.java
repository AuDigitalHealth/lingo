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

import static org.assertj.core.api.Assertions.assertThat;

import au.gov.digitalhealth.tickets.models.Iteration;
import au.gov.digitalhealth.tickets.models.PriorityBucket;
import au.gov.digitalhealth.tickets.models.Schedule;
import au.gov.digitalhealth.tickets.models.State;
import au.gov.digitalhealth.tickets.models.Ticket;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.junit.jupiter.api.Test;

class CsvUtilsTest {

  private static final ZoneId BRISBANE = ZoneId.of("Australia/Brisbane");

  // ---------------------------------------------------------------------------
  // resolveColumns
  // ---------------------------------------------------------------------------

  @Test
  void resolveColumns_returnsMatchingColumnsInSelectedOrder() {
    List<CsvUtils.ColumnDef> cols =
        CsvUtils.resolveColumns(List.of("status", "ticketNumber", "priority"), BRISBANE);

    assertThat(cols)
        .extracting(CsvUtils.ColumnDef::key)
        .containsExactly("status", "ticketNumber", "priority");
  }

  @Test
  void resolveColumns_skipsUnknownKeys() {
    List<CsvUtils.ColumnDef> cols =
        CsvUtils.resolveColumns(List.of("ticketNumber", "unknownKey", "status"), BRISBANE);

    assertThat(cols).extracting(CsvUtils.ColumnDef::key).containsExactly("ticketNumber", "status");
  }

  @Test
  void resolveColumns_returnsEmptyListForEmptyInput() {
    assertThat(CsvUtils.resolveColumns(List.of(), BRISBANE)).isEmpty();
  }

  // ---------------------------------------------------------------------------
  // columnDef factory
  // ---------------------------------------------------------------------------

  @Test
  void columnDef_factoryCreatesColumnWithCustomExtractor() {
    CsvUtils.ColumnDef col = CsvUtils.columnDef("myKey", "My Header", t -> "fixed");

    assertThat(col.key()).isEqualTo("myKey");
    assertThat(col.header()).isEqualTo("My Header");
    assertThat(col.extractor().apply(new Ticket())).isEqualTo("fixed");
  }

  // ---------------------------------------------------------------------------
  // createBacklogCsv — structure
  // ---------------------------------------------------------------------------

  @Test
  void createBacklogCsv_writesHeaderRow() throws IOException {
    List<CsvUtils.ColumnDef> cols =
        CsvUtils.resolveColumns(List.of("ticketNumber", "status"), BRISBANE);

    String csv = toCsv(CsvUtils.createBacklogCsv(List.of(), cols));
    try (CSVParser parser = CSVParser.parse(csv, CSVFormat.DEFAULT.withFirstRecordAsHeader())) {
      assertThat(parser.getHeaderNames()).containsExactly("Ticket Number", "Status");
    }
  }

  @Test
  void createBacklogCsv_writesDataRowsForEachTicket() throws IOException {
    Ticket t1 = new Ticket();
    t1.setTicketNumber("SNOMIO-1");
    Ticket t2 = new Ticket();
    t2.setTicketNumber("SNOMIO-2");

    List<CsvUtils.ColumnDef> cols = CsvUtils.resolveColumns(List.of("ticketNumber"), BRISBANE);
    String csv = toCsv(CsvUtils.createBacklogCsv(List.of(t1, t2), cols));

    try (CSVParser parser = CSVParser.parse(csv, CSVFormat.DEFAULT.withFirstRecordAsHeader())) {
      List<CSVRecord> records = parser.getRecords();
      assertThat(records).hasSize(2);
      assertThat(records.get(0).get("Ticket Number")).isEqualTo("SNOMIO-1");
      assertThat(records.get(1).get("Ticket Number")).isEqualTo("SNOMIO-2");
    }
  }

  // ---------------------------------------------------------------------------
  // submissionDate column
  // ---------------------------------------------------------------------------

  @Test
  void submissionDate_prefersJiraCreatedOverCreated() throws IOException {
    Ticket ticket = new Ticket();
    ticket.setJiraCreated(Instant.parse("2023-06-15T00:00:00Z"));
    ticket.setCreated(Instant.parse("2024-01-01T00:00:00Z"));

    String csv = singleColumnCsv("submissionDate", ticket);
    assertThat(firstValue(csv, "Submission Date")).isEqualTo("15/06/2023");
  }

  @Test
  void submissionDate_fallsBackToCreatedWhenJiraCreatedIsNull() throws IOException {
    Ticket ticket = new Ticket();
    ticket.setCreated(Instant.parse("2024-03-20T00:00:00Z"));

    String csv = singleColumnCsv("submissionDate", ticket);
    assertThat(firstValue(csv, "Submission Date")).isEqualTo("20/03/2024");
  }

  // ---------------------------------------------------------------------------
  // title column
  // ---------------------------------------------------------------------------

  @Test
  void title_returnsTicketTitle() throws IOException {
    Ticket ticket = new Ticket();
    ticket.setTitle("Paracetamol 500 mg tablet");

    String csv = singleColumnCsv("title", ticket);
    assertThat(firstValue(csv, "Title")).isEqualTo("Paracetamol 500 mg tablet");
  }

  @Test
  void title_returnsEmptyStringWhenTitleIsNull() throws IOException {
    String csv = singleColumnCsv("title", new Ticket());
    assertThat(firstValue(csv, "Title")).isEmpty();
  }

  // ---------------------------------------------------------------------------
  // release column
  // ---------------------------------------------------------------------------

  @Test
  void release_formatsYyyymmddIterationNameAsDate() throws IOException {
    Ticket ticket = ticketWithIteration("20240701");
    assertThat(firstValue(singleColumnCsv("release", ticket), "Release")).isEqualTo("01/07/2024");
  }

  @Test
  void release_passesNonDateIterationNameThrough() throws IOException {
    Ticket ticket = ticketWithIteration("Sprint 12");
    assertThat(firstValue(singleColumnCsv("release", ticket), "Release")).isEqualTo("Sprint 12");
  }

  @Test
  void release_returnsEmptyStringWhenIterationIsNull() throws IOException {
    assertThat(firstValue(singleColumnCsv("release", new Ticket()), "Release")).isEmpty();
  }

  // ---------------------------------------------------------------------------
  // schedule, priority, status columns (basic sanity)
  // ---------------------------------------------------------------------------

  @Test
  void schedule_returnsScheduleName() throws IOException {
    Ticket ticket = new Ticket();
    Schedule schedule = new Schedule();
    schedule.setName("Weekly");
    ticket.setSchedule(schedule);

    assertThat(firstValue(singleColumnCsv("schedule", ticket), "Schedule")).isEqualTo("Weekly");
  }

  @Test
  void priority_returnsPriorityBucketName() throws IOException {
    Ticket ticket = new Ticket();
    PriorityBucket pb = new PriorityBucket();
    pb.setName("High");
    ticket.setPriorityBucket(pb);

    assertThat(firstValue(singleColumnCsv("priority", ticket), "Priority")).isEqualTo("High");
  }

  @Test
  void status_returnsStateLabel() throws IOException {
    Ticket ticket = new Ticket();
    State state = new State();
    state.setLabel("In Progress");
    ticket.setState(state);

    assertThat(firstValue(singleColumnCsv("status", ticket), "Status")).isEqualTo("In Progress");
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private static Ticket ticketWithIteration(String iterationName) {
    Ticket ticket = new Ticket();
    Iteration iteration = new Iteration();
    iteration.setName(iterationName);
    ticket.setIteration(iteration);
    return ticket;
  }

  private static String singleColumnCsv(String columnKey, Ticket ticket) {
    List<CsvUtils.ColumnDef> cols = CsvUtils.resolveColumns(List.of(columnKey), BRISBANE);
    return toCsv(CsvUtils.createBacklogCsv(List.of(ticket), cols));
  }

  private static String toCsv(java.io.ByteArrayInputStream stream) {
    return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
  }

  private static String firstValue(String csv, String header) throws IOException {
    try (CSVParser parser = CSVParser.parse(csv, CSVFormat.DEFAULT.withFirstRecordAsHeader())) {
      List<CSVRecord> records = parser.getRecords();
      assertThat(records).isNotEmpty();
      return records.get(0).get(header);
    }
  }
}
