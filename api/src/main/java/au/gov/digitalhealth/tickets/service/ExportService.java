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

import au.gov.digitalhealth.lingo.exception.ErrorMessages;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.helper.AdditionalFieldUtils;
import au.gov.digitalhealth.tickets.helper.BacklogExportRequest;
import au.gov.digitalhealth.tickets.helper.CsvUtils;
import au.gov.digitalhealth.tickets.helper.SearchCondition;
import au.gov.digitalhealth.tickets.helper.SearchConditionBody;
import au.gov.digitalhealth.tickets.helper.TicketPredicateBuilder;
import au.gov.digitalhealth.tickets.models.AdditionalFieldType;
import au.gov.digitalhealth.tickets.models.Iteration;
import au.gov.digitalhealth.tickets.models.PriorityBucket;
import au.gov.digitalhealth.tickets.models.State;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.models.TicketExternalRequestor;
import au.gov.digitalhealth.tickets.repository.AdditionalFieldTypeRepository;
import au.gov.digitalhealth.tickets.repository.ExternalRequestorRepository;
import au.gov.digitalhealth.tickets.repository.IterationRepository;
import au.gov.digitalhealth.tickets.repository.LabelRepository;
import au.gov.digitalhealth.tickets.repository.StateRepository;
import au.gov.digitalhealth.tickets.repository.TicketAuditRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import com.querydsl.core.types.Predicate;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Component
public class ExportService {

  public static final List<String> NON_EXTERNAL_REQUESTERS =
      List.of("JiraExport", "SAS", "BlackTriangle");
  // Sentinel column-order key for the positional "External Requester N" group. All dynamic
  // "erPos_*" columns are ordered as one unit at this key's position. Must match the frontend.
  private static final String ER_POSITIONAL_ORDER_KEY = "__erPositional__";
  // The one column whose value comes from audit history rather than the ticket itself.
  private static final String CLOSED_DATE_KEY = "closedDate";
  private static final ZoneId BRISBANE_ZONE = ZoneId.of("Australia/Brisbane");
  private static final DateTimeFormatter LOCAL_DATE_FORMAT =
      DateTimeFormatter.ofPattern("dd/MM/yyyy");
  private static final DateTimeFormatter FILENAME_TIMESTAMP_FORMAT =
      DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss").withZone(BRISBANE_ZONE);
  final TicketRepository ticketRepository;
  final LabelRepository labelRepository;
  final IterationRepository iterationRepository;
  final StateRepository stateRepository;
  final TicketAuditRepository ticketAuditRepository;
  final ExternalRequestorRepository externalRequestorRepository;
  final AdditionalFieldTypeRepository additionalFieldTypeRepository;

  @Autowired
  public ExportService(
      TicketRepository ticketRepository,
      LabelRepository labelRepository,
      IterationRepository iterationRepository,
      StateRepository stateRepository,
      TicketAuditRepository ticketAuditRepository,
      ExternalRequestorRepository externalRequestorRepository,
      AdditionalFieldTypeRepository additionalFieldTypeRepository) {
    this.ticketRepository = ticketRepository;
    this.labelRepository = labelRepository;
    this.iterationRepository = iterationRepository;
    this.stateRepository = stateRepository;
    this.ticketAuditRepository = ticketAuditRepository;
    this.externalRequestorRepository = externalRequestorRepository;
    this.additionalFieldTypeRepository = additionalFieldTypeRepository;
  }

  @Transactional
  public ResponseEntity<InputStreamResource> adhaCsvExport(Long iterationId) {

    StringBuilder filename = new StringBuilder().append("SnomioTickets_ExternallyRequested_");

    Iteration iteration =
        iterationRepository
            .findById(iterationId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.ITERATION_NOT_FOUND, iterationId)));

    filename.append(iteration.getName().replaceAll("\\s", ""));
    filename.append(".csv");

    State state =
        stateRepository
            .findByLabel("Closed")
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("State with label %s not found", "Closed")));

    List<Ticket> tickets =
        ticketRepository.findAllByIterationAdhaQuery(iteration.getId(), state.getId());

    List<Ticket> otherTickets = ticketRepository.findAllAdhaQuery(state.getId());

    tickets = sortAdhaTickets(tickets);

    otherTickets = sortAdhaTickets(otherTickets);

    tickets.addAll(otherTickets);

    InputStreamResource inputStream = new InputStreamResource(CsvUtils.createAdhaCsv(tickets));

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
        .contentType(MediaType.parseMediaType("text/csv"))
        .body(inputStream);
  }

  @Transactional
  public ResponseEntity<InputStreamResource> backlogCsvExport(BacklogExportRequest request) {

    String filename = "SnomioBacklog_" + FILENAME_TIMESTAMP_FORMAT.format(Instant.now()) + ".csv";

    BacklogExportOptions options = resolveOptions(request);
    SearchConditionBody body = options.body();
    List<SearchCondition> searchConditions = body != null ? body.getSearchConditions() : null;

    Predicate predicate =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(searchConditions);

    List<Long> ids =
        ticketRepository.findAllIdsByPredicate(predicate, Sort.unsorted(), searchConditions);

    List<Ticket> tickets = ticketRepository.findByIdIn(ids);

    List<CsvUtils.ColumnDef> allColumns = buildBacklogColumns(options, ids, tickets);

    InputStreamResource inputStream =
        new InputStreamResource(CsvUtils.createBacklogCsv(tickets, allColumns));

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
        .contentType(MediaType.parseMediaType("text/csv"))
        .body(inputStream);
  }

  /**
   * The export request with every optional field resolved to its default, so the column builders
   * below never have to null-check the request again.
   */
  private record BacklogExportOptions(
      SearchConditionBody body,
      List<String> selectedColumns,
      List<String> additionalFieldColumns,
      List<String> externalRequestorColumns,
      boolean erDateRequested,
      boolean erDateAdded,
      boolean erWithDateRequested,
      List<String> columnOrder) {}

  private static BacklogExportOptions resolveOptions(BacklogExportRequest request) {
    if (request == null) {
      return new BacklogExportOptions(
          null,
          CsvUtils.DEFAULT_BACKLOG_COLUMNS,
          Collections.emptyList(),
          Collections.emptyList(),
          false,
          false,
          false,
          Collections.emptyList());
    }
    List<String> selectedColumns =
        (request.getColumns() != null && !request.getColumns().isEmpty())
            ? request.getColumns()
            : CsvUtils.DEFAULT_BACKLOG_COLUMNS;
    return new BacklogExportOptions(
        request.getSearchConditionBody(),
        selectedColumns,
        orEmpty(request.getAdditionalFieldColumns()),
        orEmpty(request.getExternalRequestorColumns()),
        request.isErDateRequested(),
        request.isErDateAdded(),
        request.isErWithDateRequested(),
        orEmpty(request.getColumnOrder()));
  }

  private static List<String> orEmpty(List<String> values) {
    return values != null ? values : Collections.emptyList();
  }

  private List<CsvUtils.ColumnDef> buildBacklogColumns(
      BacklogExportOptions options, List<Long> ids, List<Ticket> tickets) {

    // Static columns (all except closedDate, which requires an audit query)
    List<String> staticKeys =
        options.selectedColumns().stream().filter(k -> !CLOSED_DATE_KEY.equals(k)).toList();
    List<CsvUtils.ColumnDef> allColumns = new ArrayList<>(CsvUtils.resolveColumns(staticKeys));

    if (options.selectedColumns().contains(CLOSED_DATE_KEY)) {
      allColumns.add(closedDateColumn(ids));
    }
    addAdditionalFieldColumns(allColumns, options.additionalFieldColumns());
    addExternalRequestorColumns(allColumns, options, ids);
    addPositionalRequestorColumns(allColumns, options, tickets);
    applyColumnOrder(allColumns, options.columnOrder());
    return allColumns;
  }

  /** Closed date column — derived from audit history; skips the query when no tickets match. */
  private CsvUtils.ColumnDef closedDateColumn(List<Long> ids) {
    Map<Long, Instant> closedDates = ids.isEmpty() ? Map.of() : buildClosedDatesMap(ids);
    return CsvUtils.columnDef(
        CLOSED_DATE_KEY,
        "Closed Date",
        t -> AdditionalFieldUtils.formatDate(closedDates.get(t.getId())));
  }

  /**
   * Dynamic additional-field columns — one column per selected additional field type, value read
   * from the ticket's matching additional field value (ARTG ID is one of these). Selections arrive
   * keyed by the type's name; the header shows its display name. Falls back to the name if a saved
   * preset references a since-deleted type.
   */
  private void addAdditionalFieldColumns(
      List<CsvUtils.ColumnDef> allColumns, List<String> additionalFieldCols) {
    if (additionalFieldCols.isEmpty()) {
      return;
    }
    Map<String, String> displayNames = new HashMap<>();
    for (AdditionalFieldType type : additionalFieldTypeRepository.findAll()) {
      if (type.getName() != null && type.getDisplayName() != null) {
        displayNames.put(type.getName(), type.getDisplayName());
      }
    }
    for (String fieldName : additionalFieldCols) {
      allColumns.add(
          CsvUtils.columnDef(
              "af_" + fieldName,
              displayNames.getOrDefault(fieldName, fieldName),
              t -> AdditionalFieldUtils.findValueByAdditionalFieldName(fieldName, t)));
    }
  }

  /** Per-external-requestor columns with optional date sub-columns. */
  private void addExternalRequestorColumns(
      List<CsvUtils.ColumnDef> allColumns, BacklogExportOptions options, List<Long> ids) {
    List<String> erColumns = options.externalRequestorColumns();
    if (erColumns.isEmpty()) {
      return;
    }
    Map<String, Map<Long, Instant>> erAuditDateMap =
        (options.erDateAdded() && !ids.isEmpty())
            ? buildNestedDateMap(
                ticketAuditRepository.findExternalRequestorAddedDates(ids, erColumns))
            : Map.of();

    for (String erName : erColumns) {
      allColumns.add(erPresenceColumn(erName));
      if (options.erDateRequested()) {
        allColumns.add(erDateRequestedColumn(erName));
      }
      if (options.erDateAdded()) {
        allColumns.add(erDateAddedColumn(erName, erAuditDateMap.getOrDefault(erName, Map.of())));
      }
    }
  }

  private static CsvUtils.ColumnDef erPresenceColumn(String erName) {
    return CsvUtils.columnDef(
        "er_" + erName,
        erName,
        t ->
            t.getTicketExternalRequestors().stream()
                    .anyMatch(ter -> ter.getExternalRequestor().getName().equals(erName))
                ? "Yes"
                : "");
  }

  /** Falls back to the association's created timestamp when no requested date was recorded. */
  private static CsvUtils.ColumnDef erDateRequestedColumn(String erName) {
    return CsvUtils.columnDef(
        "er_dateRequested_" + erName,
        erName + " Date Requested",
        t ->
            t.getTicketExternalRequestors().stream()
                .filter(ter -> ter.getExternalRequestor().getName().equals(erName))
                .findFirst()
                .map(ExportService::formatDateRequested)
                .orElse(""));
  }

  private static String formatDateRequested(TicketExternalRequestor ter) {
    LocalDate date = ter.getDateRequested();
    if (date == null && ter.getCreated() != null) {
      date = ter.getCreated().atZone(BRISBANE_ZONE).toLocalDate();
    }
    return date != null ? date.format(LOCAL_DATE_FORMAT) : "";
  }

  private static CsvUtils.ColumnDef erDateAddedColumn(
      String erName, Map<Long, Instant> datesForEr) {
    return CsvUtils.columnDef(
        "er_dateAdded_" + erName,
        erName + " Added Date",
        t -> AdditionalFieldUtils.formatDate(datesForEr.get(t.getId())));
  }

  /**
   * Positional external-requestor columns: one "External Requester N" / "... N Date Requested" pair
   * per external requestor on the ticket. The requestor name is the cell data (not the header).
   * Every requestor is included regardless of whether it has a requested date — the date cell is
   * simply left blank when none has been recorded. Requestors are ordered by requested date
   * (earliest first); those without a date sort last, with the name breaking ties so the output is
   * deterministic. The number of pairs is the maximum requestor count on any single matching
   * ticket.
   */
  private void addPositionalRequestorColumns(
      List<CsvUtils.ColumnDef> allColumns, BacklogExportOptions options, List<Ticket> tickets) {
    if (!options.erWithDateRequested()) {
      return;
    }
    Comparator<TicketExternalRequestor> byDateRequestedThenName =
        Comparator.comparing(
                TicketExternalRequestor::getDateRequested,
                Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(ter -> ter.getExternalRequestor().getName());
    Map<Long, List<TicketExternalRequestor>> requestorsByTicket = new HashMap<>();
    int maxCount = 0;
    for (Ticket t : tickets) {
      List<TicketExternalRequestor> requestors =
          t.getTicketExternalRequestors().stream().sorted(byDateRequestedThenName).toList();
      requestorsByTicket.put(t.getId(), requestors);
      maxCount = Math.max(maxCount, requestors.size());
    }

    for (int index = 0; index < maxCount; index++) {
      allColumns.add(positionalNameColumn(index, requestorsByTicket));
      allColumns.add(positionalDateColumn(index, requestorsByTicket));
    }
  }

  private static CsvUtils.ColumnDef positionalNameColumn(
      int index, Map<Long, List<TicketExternalRequestor>> requestorsByTicket) {
    return CsvUtils.columnDef(
        "erPos_name_" + index,
        "External Requester " + (index + 1),
        t -> {
          List<TicketExternalRequestor> requestors =
              requestorsByTicket.getOrDefault(t.getId(), List.of());
          return index < requestors.size()
              ? requestors.get(index).getExternalRequestor().getName()
              : "";
        });
  }

  private static CsvUtils.ColumnDef positionalDateColumn(
      int index, Map<Long, List<TicketExternalRequestor>> requestorsByTicket) {
    return CsvUtils.columnDef(
        "erPos_date_" + index,
        "External Requester " + (index + 1) + " Date Requested",
        t -> {
          List<TicketExternalRequestor> requestors =
              requestorsByTicket.getOrDefault(t.getId(), List.of());
          if (index >= requestors.size()) {
            return "";
          }
          LocalDate dateRequested = requestors.get(index).getDateRequested();
          return dateRequested != null ? dateRequested.format(LOCAL_DATE_FORMAT) : "";
        });
  }

  /**
   * Applies the user-defined column order. Columns whose key is listed sort by that index; any not
   * listed keep their relative order and fall to the end. The dynamic positional requestor columns
   * ("erPos_*") share a single sentinel entry (ER_POSITIONAL_ORDER_KEY) so the whole group moves
   * together to wherever the user placed it. List.sort is stable, so ties preserve the assembled
   * order (both within the positional group and among unlisted columns).
   */
  private static void applyColumnOrder(
      List<CsvUtils.ColumnDef> allColumns, List<String> columnOrder) {
    if (columnOrder.isEmpty()) {
      return;
    }
    Map<String, Integer> orderIndex = new HashMap<>();
    for (int i = 0; i < columnOrder.size(); i++) {
      orderIndex.putIfAbsent(columnOrder.get(i), i);
    }
    allColumns.sort(Comparator.comparingInt(col -> orderRank(col.key(), orderIndex)));
  }

  // Rank a column key against the user-defined order. Positional "erPos_*" columns all resolve
  // to the single ER_POSITIONAL_ORDER_KEY sentinel so the group stays contiguous; unlisted keys
  // fall to the end (Integer.MAX_VALUE) preserving assembled order via a stable sort.
  private static int orderRank(String key, Map<String, Integer> orderIndex) {
    String lookup = key.startsWith("erPos_") ? ER_POSITIONAL_ORDER_KEY : key;
    return orderIndex.getOrDefault(lookup, Integer.MAX_VALUE);
  }

  private Map<Long, Instant> buildClosedDatesMap(List<Long> ticketIds) {
    Map<Long, Instant> result = new HashMap<>();
    for (Object[] row : ticketAuditRepository.findClosedDates(ticketIds)) {
      result.put(
          ((Number) row[0]).longValue(), Instant.ofEpochMilli(((Number) row[1]).longValue()));
    }
    return result;
  }

  private Map<String, Map<Long, Instant>> buildNestedDateMap(List<Object[]> rows) {
    Map<String, Map<Long, Instant>> result = new HashMap<>();
    for (Object[] row : rows) {
      Long ticketId = ((Number) row[0]).longValue();
      String name = (String) row[1];
      Instant timestamp = Instant.ofEpochMilli(((Number) row[2]).longValue());
      result.computeIfAbsent(name, k -> new HashMap<>()).put(ticketId, timestamp);
    }
    return result;
  }

  public List<Ticket> sortAdhaTickets(List<Ticket> tickets) {
    return new ArrayList<>(
        tickets.stream()
            .sorted(
                Comparator.comparing(
                        (Ticket obj) -> {
                          PriorityBucket pb1 = obj.getPriorityBucket();
                          return pb1 != null ? pb1.getOrderIndex() : null;
                        },
                        Comparator.nullsLast(Integer::compareTo))
                    .thenComparing(Ticket::getTitle, Comparator.nullsLast(String::compareTo)))
            .toList());
  }
}
