package com.csiro.tickets.controllers;

import static com.csiro.tickets.helper.StringUtils.removePageAndAfter;

import com.csiro.snomio.exception.ErrorMessages;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.exception.TicketImportProblem;
import com.csiro.tickets.TicketBacklogDto;
import com.csiro.tickets.TicketDto;
import com.csiro.tickets.TicketDtoExtended;
import com.csiro.tickets.TicketImportDto;
import com.csiro.tickets.TicketMinimalDto;
import com.csiro.tickets.helper.PbsRequest;
import com.csiro.tickets.helper.PbsRequestResponse;
import com.csiro.tickets.helper.SafeUtils;
import com.csiro.tickets.helper.SearchConditionBody;
import com.csiro.tickets.helper.TicketPredicateBuilder;
import com.csiro.tickets.models.*;
import com.csiro.tickets.models.mappers.TicketMapper;
import com.csiro.tickets.repository.*;
import com.csiro.tickets.service.TicketServiceImpl;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.querydsl.core.types.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import java.io.File;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TicketController {

  private static final String STATE_NOT_FOUND_MESSAGE = "State with ID %s not found";
  protected final Log logger = LogFactory.getLog(getClass());
  private final TicketServiceImpl ticketService;
  private final TicketRepository ticketRepository;
  private final StateRepository stateRepository;

  private final ScheduleRepository scheduleRepository;
  private final IterationRepository iterationRepository;
  private final TicketMapper ticketMapper;

  @Value("${snomio.import.allowed.directory}")
  private String allowedImportDirectory;

  public TicketController(
      TicketServiceImpl ticketService,
      TicketRepository ticketRepository,
      StateRepository stateRepository,
      ScheduleRepository scheduleRepository,
      IterationRepository iterationRepository,
      TicketMapper ticketMapper) {
    this.ticketService = ticketService;
    this.ticketRepository = ticketRepository;
    this.stateRepository = stateRepository;
    this.scheduleRepository = scheduleRepository;
    this.iterationRepository = iterationRepository;
    this.ticketMapper = ticketMapper;
  }

  @GetMapping("/api/tickets")
  public ResponseEntity<CollectionModel<?>> getAllTickets(
      @RequestParam(defaultValue = "0") final Integer page,
      @RequestParam(defaultValue = "20") final Integer size,
      PagedResourcesAssembler<TicketDto> pagedResourcesAssembler) {
    Pageable pageable = PageRequest.of(page, size);
    final Page<TicketDto> pagedTicketDto = ticketService.findAllTickets(pageable);
    if (page > pagedTicketDto.getTotalPages()) {
      throw new ResourceNotFoundProblem("Page does not exist");
    }

    return new ResponseEntity<>(pagedResourcesAssembler.toModel(pagedTicketDto), HttpStatus.OK);
  }

  @GetMapping("/api/tickets/search")
  public ResponseEntity<CollectionModel<?>> searchTickets(
      HttpServletRequest request,
      @RequestParam(defaultValue = "0") final Integer page,
      @RequestParam(defaultValue = "20") final Integer size,
      PagedResourcesAssembler<TicketBacklogDto> pagedResourcesAssembler) {
    Pageable pageable = PageRequest.of(page, size);

    String search =
        URLDecoder.decode(removePageAndAfter(request.getQueryString()), StandardCharsets.UTF_8);

    Predicate predicate = TicketPredicateBuilder.buildPredicate(search);
    Page<TicketBacklogDto> ticketDtos =
        ticketService.findAllTicketsByQueryParam(predicate, pageable, null);

    return new ResponseEntity<>(pagedResourcesAssembler.toModel(ticketDtos), HttpStatus.OK);
  }

  @PostMapping(value = "/api/tickets/search", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<CollectionModel<?>> searchTicketsByBody(
      @RequestParam(defaultValue = "0") final Integer page,
      @RequestParam(defaultValue = "20") final Integer size,
      @RequestBody final SearchConditionBody searchConditionBody,
      PagedResourcesAssembler<TicketBacklogDto> pagedResourcesAssembler) {
    Pageable pageable = PageRequest.of(page, size);

    Predicate predicate =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(
            searchConditionBody.getSearchConditions());

    Page<TicketBacklogDto> ticketDtos =
        ticketService.findAllTicketsByQueryParam(
            predicate, pageable, searchConditionBody.getOrderCondition());

    return new ResponseEntity<>(pagedResourcesAssembler.toModel(ticketDtos), HttpStatus.OK);
  }

  @PostMapping(value = "/api/tickets", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<TicketDto> createTicket(@RequestBody TicketDto ticketDto) {
    Ticket responseTicket = ticketService.createTicketFromDto(ticketDto);
    return new ResponseEntity<>(ticketMapper.toDto(responseTicket), HttpStatus.OK);
  }

  @PatchMapping(value = "/api/tickets/{ticketId}", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<TicketDto> patchTicket(
      @RequestBody TicketDto ticketDto, @PathVariable Long ticketId) {
    return new ResponseEntity<>(ticketService.patchTicket(ticketDto, ticketId), HttpStatus.OK);
  }

  @PutMapping(value = "/api/tickets/bulk", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<List<TicketBacklogDto>> bulkUpdateTicket(
      @RequestBody List<TicketBacklogDto> ticketDtos) {

    return new ResponseEntity<>(ticketService.bulkUpdateTickets(ticketDtos), HttpStatus.OK);
  }

  @DeleteMapping(value = "/api/tickets/{ticketId}")
  public ResponseEntity<Void> deleteTicket(@PathVariable Long ticketId) {
    ticketService.deleteTicket(ticketId);

    return ResponseEntity.noContent().build();
  }

  @GetMapping("/api/tickets/{additionalFieldTypeName}/{valueOf}")
  public ResponseEntity<List<TicketDto>> searchByAdditionalFieldTypeNameValueOf(
      @PathVariable String additionalFieldTypeName, @PathVariable String valueOf) {
    List<TicketDto> tickets =
        ticketService.findDtoByAdditionalFieldTypeValueOf(additionalFieldTypeName, valueOf);

    if (tickets.isEmpty()) {
      throw new ResourceNotFoundProblem(String.format("Ticket with ARTGID %s not found", valueOf));
    }

    return new ResponseEntity<>(tickets, HttpStatus.OK);
  }

  @PostMapping(
      value = "/api/tickets/search/additionalFieldType/{additionalFieldTypeName}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<List<TicketMinimalDto>> searchByAdditionalFieldTypeNameValueOfList(
      @PathVariable String additionalFieldTypeName, @RequestBody List<String> valueOfs) {
    List<TicketMinimalDto> tickets =
        ticketService.findByAdditionalFieldTypeNameAndListValueOf(
            additionalFieldTypeName, valueOfs);

    return new ResponseEntity<>(tickets, HttpStatus.OK);
  }

  @PutMapping(value = "/api/tickets/{ticketId}", consumes = MediaType.APPLICATION_JSON_VALUE)
  @Transactional
  public ResponseEntity<TicketDto> updateTicket(
      @RequestBody TicketDto ticketDto, @PathVariable Long ticketId) {

    Ticket savedTicket = ticketService.updateTicketFromDto(ticketDto, ticketId);
    return new ResponseEntity<>(ticketMapper.toDto(savedTicket), HttpStatus.OK);
  }

  @GetMapping("/api/tickets/{ticketId}")
  public ResponseEntity<TicketDtoExtended> getTicket(@PathVariable Long ticketId) {
    return new ResponseEntity<>(ticketService.findTicket(ticketId), HttpStatus.OK);
  }

  @PostMapping("/api/tickets/searchByList")
  public ResponseEntity<List<TicketMinimalDto>> getTickets(@RequestBody List<String> ids) {
    return new ResponseEntity<>(ticketService.getTickets(ids), HttpStatus.OK);
  }

  @PutMapping(value = "/api/tickets/{ticketId}/state/{stateId}")
  public ResponseEntity<State> updateTicketState(
      @PathVariable Long ticketId, @PathVariable Long stateId) {
    Optional<State> stateOptional = stateRepository.findById(stateId);
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    if (ticketOptional.isPresent() && stateOptional.isPresent()) {
      Ticket ticket = ticketOptional.get();
      State state = stateOptional.get();
      ticket.setState(state);
      ticketRepository.save(ticket);
      return new ResponseEntity<>(state, HttpStatus.OK);
    } else {
      String message =
          String.format(
              ticketOptional.isPresent()
                  ? STATE_NOT_FOUND_MESSAGE
                  : ErrorMessages.TICKET_ID_NOT_FOUND);
      Long id = ticketOptional.isPresent() ? stateId : ticketId;
      throw new ResourceNotFoundProblem(String.format(message, id));
    }
  }

  @DeleteMapping(value = "/api/tickets/{ticketId}/state")
  public ResponseEntity<Void> deleteTicketState(@PathVariable Long ticketId) {
    Ticket ticket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));
    ticket.setState(null);
    ticketRepository.save(ticket);
    return ResponseEntity.noContent().build();
  }

  @PutMapping("/api/tickets/{ticketId}/schedule/{scheduleId}")
  public ResponseEntity<Schedule> updateTicketSchedule(
      @PathVariable Long ticketId, @PathVariable Long scheduleId) {
    Optional<Schedule> scheduleOptional = scheduleRepository.findById(scheduleId);
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    if (ticketOptional.isPresent() && scheduleOptional.isPresent()) {
      Ticket ticket = ticketOptional.get();
      Schedule schedule = scheduleOptional.get();
      ticket.setSchedule(schedule);
      ticketRepository.save(ticket);
      return new ResponseEntity<>(schedule, HttpStatus.OK);
    } else {
      String message =
          String.format(
              ticketOptional.isPresent()
                  ? "Schedule not found for id: %d"
                  : "Ticket not found for id: %d",
              ticketOptional.isPresent() ? scheduleId : ticketId);
      throw new ResourceNotFoundProblem(message);
    }
  }

  @DeleteMapping("/api/tickets/{ticketId}/schedule")
  public ResponseEntity<Void> deleteTicketSchedule(@PathVariable Long ticketId) {
    Ticket ticket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundProblem("Ticket not found for id: " + ticketId));
    ticket.setSchedule(null);
    ticketRepository.save(ticket);
    return ResponseEntity.noContent().build();
  }

  @PutMapping(
      value = "/api/tickets/{ticketId}/iteration/{iterationId}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Iteration> updateIteration(
      @PathVariable Long ticketId, @PathVariable Long iterationId) {
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    Optional<Iteration> iterationOption = iterationRepository.findById(iterationId);

    if (ticketOptional.isPresent() && iterationOption.isPresent()) {
      Ticket ticket = ticketOptional.get();
      ticketService.validateTicketState(ticket);
      Iteration iteration = iterationOption.get();
      ticket.setIteration(iteration);
      ticketRepository.save(ticket);
      return new ResponseEntity<>(iteration, HttpStatus.OK);
    } else {
      String message =
          String.format(
              ticketOptional.isPresent()
                  ? STATE_NOT_FOUND_MESSAGE
                  : ErrorMessages.TICKET_ID_NOT_FOUND);
      Long id = ticketOptional.isPresent() ? iterationId : ticketId;
      throw new ResourceNotFoundProblem(String.format(message, id));
    }
  }

  @DeleteMapping(value = "/api/tickets/{ticketId}/iteration")
  public ResponseEntity<Void> deleteIteration(@PathVariable Long ticketId) {
    Ticket ticket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));
    ticketService.validateTicketState(ticket);

    ticket.setIteration(null);
    ticketRepository.save(ticket);
    return ResponseEntity.noContent().build();
  }

  /*
   * First attempts to find a ticket by the artgid, if it is found, mark the ticket as a pbs ticket
   * through a label. If not found, we need to create a new pbs ticket, with open state storing the
   * artgid, sctid, name & description
   */
  @PostMapping(value = "/api/tickets/pbsRequest", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<PbsRequestResponse> createPbsRequest(@RequestBody PbsRequest pbsRequest) {
    Ticket ticket = ticketService.createPbsRequest(pbsRequest);
    return new ResponseEntity<>(new PbsRequestResponse(pbsRequest, ticket), HttpStatus.CREATED);
  }

  @GetMapping(
      value = "/api/tickets/{ticketId}/pbsRequest",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<PbsRequestResponse> getPbsRequest(@PathVariable Long ticketId) {
    return new ResponseEntity<>(ticketService.getPbsStatus(ticketId), HttpStatus.OK);
  }

  @GetMapping(value = "api/tickets/{ticketId}/pbsRequest")
  public ResponseEntity<PbsRequestResponse> getTicketAuthoringStatus(
      @PathVariable String ticketId) {

    return new ResponseEntity<>(ticketService.getPbsStatus(Long.valueOf(ticketId)), HttpStatus.OK);
  }

  /*
   * Ticket import requires a local copy of the Jira Attachment directory from
   * $JIRA_HIME/data/attachments/AA directory on the Blue Jira server and the matching Jira export
   * JSON file that was created with the utils/jira-ticket-export tool pointing to the Jira
   * attachment directory.
   *
   * Example process to export is: - Run the following rsync command to sync the attachment
   * directory to the local machine: `rsync -avz -e "ssh -i ~/devops.pem" --rsync-path='sudo rsync'
   * usertouse@jira.aws.tooling:/home/jira/jira-home/data/attachments/AA/
   * /opt/jira-export/attachments/` This needs to finish before starting the Jira export as the
   * export process generates SHA256 suns from the actual attacments - export JIRA_USERNAME and
   * JIRA_PASSWORD environment variables then spin up the utils/jira-ticket-export NodeJS tool witn
   * `npm run dev` and use /opt/jira-export as an export path. This will create the export JSON file
   * at /opt/jira-export/snomio-jira-export.json - Then call this export REST call with
   * importPath=/opt/jira-export/snomio-jira-export.json e.g.:
   * http://localhost:8080/api/ticketimport?importPath=/opt/jira-export/snomio-jira-export.json -
   * This will import all tickets into Snomio database and import the attachment files and
   * thumbnails from /opt/jira-export/attachments to /opt/data/attachments for Snomio to host those
   * files.
   *
   * @param importPath is the path to the Jira export JSON file. It must be under
   * `snomio.import.allowed.directory` and it must be in the same directory where the Jira
   * attachments are.
   *
   * @param startAt is the first item to import
   */
  @PostMapping(value = "/api/ticketimport")
  public ResponseEntity<ImportResponse> importTickets(
      @RequestParam() String importPath,
      @RequestParam(required = false) Long startAt,
      @RequestParam(required = false) Long size) {

    long startTime = System.currentTimeMillis();
    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);
    objectMapper.registerModule(new JavaTimeModule());

    File importFile = new File(importPath);
    SafeUtils.checkFile(importFile, allowedImportDirectory, TicketImportProblem.class);
    SafeUtils.loginfo(logger, "Importing tickets using " + importPath);
    TicketImportDto[] ticketImportDtos;
    try {
      ticketImportDtos = objectMapper.readValue(importFile, TicketImportDto[].class);
    } catch (IOException e) {
      throw new TicketImportProblem(e.getMessage());
    }
    if (startAt == null) {
      startAt = 0L;
    }
    if (size == null) {
      size = (long) ticketImportDtos.length;
    }
    logger.info("Import starting, number of tickets to import: " + size + "...");
    int importedTickets =
        ticketService.importTickets(ticketImportDtos, startAt.intValue(), size.intValue());

    long endTime = System.currentTimeMillis();
    Long importTime = endTime - startTime;
    String duration =
        String.format(
            "%d min, %d sec",
            TimeUnit.MILLISECONDS.toMinutes(importTime.intValue()),
            TimeUnit.MILLISECONDS.toSeconds(importTime.intValue())
                - TimeUnit.MINUTES.toSeconds(
                    TimeUnit.MILLISECONDS.toMinutes(importTime.intValue())));
    logger.info("Finished importing in " + duration);
    return new ResponseEntity<>(
        ImportResponse.builder()
            .message(importedTickets + " tickets have been imported successfully in " + duration)
            .status(HttpStatus.OK)
            .build(),
        HttpStatus.OK);
  }

  @PostMapping(value = "/api/ticketimport/createupdatefiles")
  public ResponseEntity<ImportResponse> importTickets(
      @RequestParam() String oldImportFilePath, @RequestParam() String newImportFilePath) {

    File oldFile = new File(oldImportFilePath);
    File newFile = new File(newImportFilePath);
    String updateImportFilePath = ticketService.generateImportFile(oldFile, newFile);

    SafeUtils.loginfo(logger, "Saving import file with updates to:  " + updateImportFilePath);
    return new ResponseEntity<>(
        ImportResponse.builder()
            .message(
                "Successfully created new import files at ["
                    + updateImportFilePath
                    + "]. Please revise the files before import!")
            .status(HttpStatus.OK)
            .build(),
        HttpStatus.OK);
  }
}
