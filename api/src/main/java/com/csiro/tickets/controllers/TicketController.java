package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ErrorMessages;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.exception.TicketImportProblem;
import com.csiro.tickets.controllers.dto.ImportResponse;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.dto.TicketImportDto;
import com.csiro.tickets.models.Iteration;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.CommentRepository;
import com.csiro.tickets.repository.IterationRepository;
import com.csiro.tickets.repository.PriorityBucketRepository;
import com.csiro.tickets.repository.StateRepository;
import com.csiro.tickets.repository.TicketRepository;
import com.csiro.tickets.service.TicketService;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.querydsl.core.types.Predicate;
import java.io.File;
import java.io.IOException;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
  final TicketService ticketService;
  final TicketRepository ticketRepository;
  final CommentRepository commentRepository;
  final StateRepository stateRepository;
  final IterationRepository iterationRepository;
  final PriorityBucketRepository priorityBucketRepository;

  @Autowired
  public TicketController(
      TicketService ticketService,
      TicketRepository ticketRepository,
      CommentRepository commentRepository,
      StateRepository stateRepository,
      IterationRepository iterationRepository,
      PriorityBucketRepository priorityBucketRepository) {
    this.ticketService = ticketService;
    this.ticketRepository = ticketRepository;
    this.commentRepository = commentRepository;
    this.stateRepository = stateRepository;
    this.iterationRepository = iterationRepository;
    this.priorityBucketRepository = priorityBucketRepository;
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
      @QuerydslPredicate(root = Ticket.class) Predicate predicate,
      @RequestParam(defaultValue = "0") final Integer page,
      @RequestParam(defaultValue = "20") final Integer size,
      PagedResourcesAssembler<TicketDto> pagedResourcesAssembler) {
    Pageable pageable = PageRequest.of(page, size);

    Page<TicketDto> ticketDtos = ticketService.findAllTicketsByQueryParam(predicate, pageable);

    return new ResponseEntity<>(pagedResourcesAssembler.toModel(ticketDtos), HttpStatus.OK);
  }

  @PostMapping(value = "/api/tickets", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Ticket> createTicket(@RequestBody TicketDto ticketDto) {
    Ticket responseTicket = ticketService.createTicketFromDto(ticketDto);
    return new ResponseEntity<>(responseTicket, HttpStatus.OK);
  }

  @GetMapping("/api/tickets/artgSearch")
  public ResponseEntity<TicketDto> searchByArtgid(@RequestParam String artgId) {
    TicketDto ticket = ticketService.findByArtgId(artgId);
    return new ResponseEntity<>(ticket, HttpStatus.OK);
  }

  @PutMapping(value = "/api/tickets/{ticketId}", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Ticket> updateTicket(
      @RequestBody Ticket ticket, @PathVariable Long ticketId) {

    final Optional<Ticket> optional = ticketRepository.findById(ticketId);
    if (optional.isPresent()) {
      Ticket existingTicket = optional.get();

      existingTicket.setAssignee(ticket.getAssignee());
      existingTicket.setTitle(ticket.getTitle());
      existingTicket.setDescription(ticket.getDescription());

      Ticket savedTicket = ticketRepository.save(existingTicket);
      return new ResponseEntity<>(savedTicket, HttpStatus.OK);
    } else {
      throw new ResourceNotFoundProblem(String.format("Ticket with Id %s not found", ticketId));
    }
  }

  @GetMapping("/api/tickets/{ticketId}")
  public ResponseEntity<Ticket> getTicket(@PathVariable Long ticketId) {

    final Optional<Ticket> optional = ticketRepository.findById(ticketId);
    if (optional.isPresent()) {
      Ticket ticket = optional.get();
      return new ResponseEntity<>(ticket, HttpStatus.OK);
    } else {
      throw new ResourceNotFoundProblem(String.format("Ticket with Id %s not found", ticketId));
    }
  }

  @PutMapping(
      value = "/api/tickets/{ticketId}/state/{stateId}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Ticket> updateTicketState(
      @PathVariable Long ticketId, @PathVariable Long stateId) {
    Optional<State> stateOptional = stateRepository.findById(stateId);
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    if (ticketOptional.isPresent() && stateOptional.isPresent()) {
      Ticket ticket = ticketOptional.get();
      State state = stateOptional.get();
      ticket.setState(state);
      Ticket updatedTicket = ticketRepository.save(ticket);
      return new ResponseEntity<>(updatedTicket, HttpStatus.OK);
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

  @PutMapping(
      value = "/api/tickets/{ticketId}/assignee/{assignee}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Ticket> updateAssignee(
      @PathVariable Long ticketId, @PathVariable String assignee) {
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    // need to check if the assignee exists, user table..
    if (ticketOptional.isPresent()) {
      Ticket ticket = ticketOptional.get();
      if (assignee.equals("unassign")) {
        ticket.setAssignee(null);
      } else {
        ticket.setAssignee(assignee);
      }
      Ticket updatedTicket = ticketRepository.save(ticket);
      return new ResponseEntity<>(updatedTicket, HttpStatus.OK);
    } else {
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));
    }
  }

  @DeleteMapping(value = "/api/tickets/{ticketId}/assignee")
  public ResponseEntity<Void> deleteAssignee(@PathVariable Long ticketId) {
    Ticket ticket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));
    ticket.setAssignee(null);
    ticketRepository.save(ticket);
    return ResponseEntity.noContent().build();
  }

  @PutMapping(
      value = "/api/tickets/{ticketId}/iteration/{iterationId}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Ticket> updateIteration(
      @PathVariable Long ticketId, @PathVariable Long iterationId) {
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    Optional<Iteration> iterationOption = iterationRepository.findById(iterationId);

    if (ticketOptional.isPresent() && iterationOption.isPresent()) {
      Ticket ticket = ticketOptional.get();
      Iteration iteration = iterationOption.get();
      ticket.setIteration(iteration);
      Ticket updatedTicket = ticketRepository.save(ticket);
      return new ResponseEntity<>(updatedTicket, HttpStatus.OK);
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

    ticket.setIteration(null);
    ticketRepository.save(ticket);
    return ResponseEntity.noContent().build();
  }

  //  @PutMapping(
  //      value = "/api/tickets/{ticketId}/priorityBucket/{priorityBucketId}",
  //      consumes = MediaType.APPLICATION_JSON_VALUE)
  //  public ResponseEntity<TicketDto> updatePriorityBucket(
  //      @PathVariable Long ticketId, @PathVariable Long priorityBucketId) {
  //    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
  //    Optional<PriorityBucket> priorityBucketOptional =
  //        priorityBucketRepository.findById(priorityBucketId);
  //
  //    if (ticketOptional.isPresent() && priorityBucketOptional.isPresent()) {
  //      Ticket ticket = ticketOptional.get();
  //      PriorityBucket priorityBucket = priorityBucketOptional.get();
  //      ticket.setPriorityBucket(priorityBucket);
  //      Ticket updatedTicket = ticketRepository.save(ticket);
  //      return new ResponseEntity<>(TicketDto.of(updatedTicket), HttpStatus.OK);
  //    } else {
  //      String message =
  //          String.format(
  //              ticketOptional.isPresent()
  //                  ? ErrorMessages.PRIORITY_BUCKET_ID_NOT_FOUND
  //                  : ErrorMessages.TICKET_ID_NOT_FOUND);
  //      Long id = ticketOptional.isPresent() ? priorityBucketId : ticketId;
  //      throw new ResourceNotFoundProblem(String.format(message, id));
  //    }
  //  }

  /*
   *  Ticket import requires a local copy of the Jira Attachment directory from
   *  $JIRA_HIME/data/attachments/AA directory on the Blue Jira server and the
   *  matching Jira export JSON file that was created with the utils/jira-ticket-export
   *  tool pointing to the Jira attachment directory.
   *
   *  Example process to export is:
   *    - Run the following rsync command to sync the attachment directory to the local
   *      machine:
   *      `rsync -avz -e "ssh -i ~/devops.pem" --rsync-path='sudo rsync'
   *      usertouse@jira.aws.tooling:/home/jira/jira-home/data/attachments/AA/ /opt/jira-export/attachments/`
   *      This needs to finish before starting the Jira export as the export process generates SHA256 suns from
   *      the actual attacments
   *    - export JIRA_USERNAME and JIRA_PASSWORD environment variables then spin up the utils/jira-ticket-export
   *      NodeJS tool witn `npm run dev` and use /opt/jira-export as an export path. This will create the export
   *      JSON file at /opt/jira-export/snomio-jira-export.json
   *    - Then call this export REST call with importPath=/opt/jira-export/snomio-jira-export.json
   *      e.g.: http://localhost:8080/api/ticketimport?importPath=/opt/jira-export/snomio-jira-export.json
   *    - This will import all tickets into Snomio database and import the attachment files and thumbnails
   *      from /opt/jira-export/attachments to /opt/data/attachments for Snomio to host those files.
   *
   *  @param importPath is the path to the Jira Attachment directory
   *  @param startAt is the first item to import
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

    logger.info("Importing tickets using " + importPath);
    if (!importFile.exists()) {
      throw new TicketImportProblem("File not found: " + importPath);
    }
    File importDirectory = importFile.getParentFile();
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
      size = Long.valueOf(ticketImportDtos.length);
    }
    logger.info("Import starting, number of tickets to import: " + size + "...");
    int importedTickets =
        ticketService.importTickets(
            ticketImportDtos, startAt.intValue(), size.intValue(), importDirectory);

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
            .message(+importedTickets + " tickets have been imported successfully in " + duration)
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

    logger.info("Saving import file with updates to:  " + updateImportFilePath);
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
