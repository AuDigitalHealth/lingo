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
import au.gov.digitalhealth.lingo.exception.InvalidSearchProblem;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.lingo.exception.TicketImportProblem;
import au.gov.digitalhealth.lingo.exception.TicketStateClosedProblem;
import au.gov.digitalhealth.lingo.service.SubmissionGatewayComposer;
import au.gov.digitalhealth.tickets.AdditionalFieldTypeDto;
import au.gov.digitalhealth.tickets.AdditionalFieldValueDto;
import au.gov.digitalhealth.tickets.ExternalRequesterDto;
import au.gov.digitalhealth.tickets.IterationDto;
import au.gov.digitalhealth.tickets.JsonFieldDto;
import au.gov.digitalhealth.tickets.LabelDto;
import au.gov.digitalhealth.tickets.PriorityBucketDto;
import au.gov.digitalhealth.tickets.ScheduleDto;
import au.gov.digitalhealth.tickets.StateDto;
import au.gov.digitalhealth.tickets.TicketBacklogDto;
import au.gov.digitalhealth.tickets.TicketDto;
import au.gov.digitalhealth.tickets.TicketDtoExtended;
import au.gov.digitalhealth.tickets.TicketDtoOptionals;
import au.gov.digitalhealth.tickets.TicketExternalRequestorDto;
import au.gov.digitalhealth.tickets.TicketImportDto;
import au.gov.digitalhealth.tickets.TicketMinimalDto;
import au.gov.digitalhealth.tickets.controllers.BulkProductActionDto;
import au.gov.digitalhealth.tickets.controllers.ProductDto;
import au.gov.digitalhealth.tickets.controllers.TicketAuthoringHistoryDto;
import au.gov.digitalhealth.tickets.helper.*;
import au.gov.digitalhealth.tickets.models.AdditionalFieldType;
import au.gov.digitalhealth.tickets.models.AdditionalFieldType.Type;
import au.gov.digitalhealth.tickets.models.AdditionalFieldValue;
import au.gov.digitalhealth.tickets.models.Attachment;
import au.gov.digitalhealth.tickets.models.AttachmentType;
import au.gov.digitalhealth.tickets.models.BaseAuditableEntity;
import au.gov.digitalhealth.tickets.models.BulkProductAction;
import au.gov.digitalhealth.tickets.models.Comment;
import au.gov.digitalhealth.tickets.models.ExternalRequestor;
import au.gov.digitalhealth.tickets.models.Iteration;
import au.gov.digitalhealth.tickets.models.JsonField;
import au.gov.digitalhealth.tickets.models.Label;
import au.gov.digitalhealth.tickets.models.PriorityBucket;
import au.gov.digitalhealth.tickets.models.Product;
import au.gov.digitalhealth.tickets.models.ProductAction;
import au.gov.digitalhealth.tickets.models.Schedule;
import au.gov.digitalhealth.tickets.models.State;
import au.gov.digitalhealth.tickets.models.TaskAssociation;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.models.TicketExternalRequestor;
import au.gov.digitalhealth.tickets.models.TicketType;
import au.gov.digitalhealth.tickets.models.WorkIdentityReservation;
import au.gov.digitalhealth.tickets.models.mappers.AdditionalFieldValueMapper;
import au.gov.digitalhealth.tickets.models.mappers.BulkProductActionMapper;
import au.gov.digitalhealth.tickets.models.mappers.ExternalRequestorMapper;
import au.gov.digitalhealth.tickets.models.mappers.JsonFieldMapper;
import au.gov.digitalhealth.tickets.models.mappers.LabelMapper;
import au.gov.digitalhealth.tickets.models.mappers.ProductMapper;
import au.gov.digitalhealth.tickets.models.mappers.TicketMapper;
import au.gov.digitalhealth.tickets.repository.AdditionalFieldTypeRepository;
import au.gov.digitalhealth.tickets.repository.AdditionalFieldValueRepository;
import au.gov.digitalhealth.tickets.repository.AttachmentRepository;
import au.gov.digitalhealth.tickets.repository.AttachmentTypeRepository;
import au.gov.digitalhealth.tickets.repository.BulkProductActionRepository;
import au.gov.digitalhealth.tickets.repository.CommentRepository;
import au.gov.digitalhealth.tickets.repository.ExternalRequestorRepository;
import au.gov.digitalhealth.tickets.repository.IterationRepository;
import au.gov.digitalhealth.tickets.repository.LabelRepository;
import au.gov.digitalhealth.tickets.repository.PriorityBucketRepository;
import au.gov.digitalhealth.tickets.repository.ProductRepository;
import au.gov.digitalhealth.tickets.repository.ScheduleRepository;
import au.gov.digitalhealth.tickets.repository.StateRepository;
import au.gov.digitalhealth.tickets.repository.TicketAssociationRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import au.gov.digitalhealth.tickets.repository.TicketTypeRepository;
import au.gov.digitalhealth.tickets.repository.WorkIdentityReservationRepository;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.querydsl.core.types.Predicate;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.*;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.LongFunction;
import java.util.function.UnaryOperator;
import java.util.stream.Collectors;
import lombok.Getter;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class TicketServiceImpl implements TicketService {

  public static final String ARTGID = "ARTGID";
  private static final int ITEMS_TO_PROCESS = 60000;
  protected final Log logger = LogFactory.getLog(getClass());
  private final TicketRepository ticketRepository;
  private final AdditionalFieldTypeRepository additionalFieldTypeRepository;
  private final WorkIdentityReservationRepository reservationRepository;
  private final AdditionalFieldValueRepository additionalFieldValueRepository;
  private final StateRepository stateRepository;
  private final AttachmentTypeRepository attachmentTypeRepository;
  private final AttachmentRepository attachmentRepository;
  private final TicketTypeRepository ticketTypeRepository;
  private final ScheduleRepository scheduleRepository;
  private final CommentRepository commentRepository;
  private final LabelRepository labelRepository;

  private final ExternalRequestorRepository externalRequestorRepository;

  private final IterationRepository iterationRepository;
  private final PriorityBucketRepository priorityBucketRepository;
  private final ProductRepository productRepository;
  private final SubmissionGatewayComposer submissionGatewayComposer;

  private final BulkProductActionRepository bulkProductActionRepository;
  private final TicketMapper ticketMapper;
  private final AdditionalFieldValueMapper additionalFieldValueMapper;
  private final ProductMapper productMapper;
  private final JsonFieldMapper jsonFieldMapper;
  private final BulkProductActionMapper bulkProductActionMapper;
  private final ExternalRequestorMapper externalRequestorMapper;
  private final LabelMapper labelMapper;

  private final AttachmentService attachmentService;

  /** The zone whose calendar day counts as "today" for dates this service records. */
  private final ZoneId businessZoneId;

  @Value("${snomio.attachments.directory}")
  String attachmentsDirConfig;

  @Value("${snomio.import.allowed.directory}")
  private String allowedImportDirectory;

  @Getter private double importProgress = 0;

  @Autowired
  public TicketServiceImpl(
      TicketRepository ticketRepository,
      AdditionalFieldTypeRepository additionalFieldTypeRepository,
      WorkIdentityReservationRepository reservationRepository,
      AdditionalFieldValueRepository additionalFieldValueRepository,
      StateRepository stateRepository,
      AttachmentTypeRepository attachmentTypeRepository,
      AttachmentRepository attachmentRepository,
      TicketTypeRepository ticketTypeRepository,
      ScheduleRepository scheduleRepository,
      CommentRepository commentRepository,
      LabelRepository labelRepository,
      IterationRepository iterationRepository,
      PriorityBucketRepository priorityBucketRepository,
      ProductRepository productRepository,
      SubmissionGatewayComposer submissionGatewayComposer,
      ExternalRequestorRepository externalRequestorRepository,
      TicketAssociationRepository ticketAssociationRepository,
      TicketMapper ticketMapper,
      AdditionalFieldValueMapper additionalFieldValueMapper,
      ProductMapper productMapper,
      JsonFieldMapper jsonFieldMapper,
      BulkProductActionRepository bulkProductActionRepository,
      BulkProductActionMapper bulkProductActionMapper,
      LabelMapper labelMapper,
      ExternalRequestorMapper externalRequestorMapper,
      AttachmentService attachmentService,
      ZoneId businessZoneId) {
    this.ticketRepository = ticketRepository;
    this.additionalFieldTypeRepository = additionalFieldTypeRepository;
    this.reservationRepository = reservationRepository;
    this.additionalFieldValueRepository = additionalFieldValueRepository;
    this.stateRepository = stateRepository;
    this.attachmentTypeRepository = attachmentTypeRepository;
    this.attachmentRepository = attachmentRepository;
    this.ticketTypeRepository = ticketTypeRepository;
    this.scheduleRepository = scheduleRepository;
    this.commentRepository = commentRepository;
    this.labelRepository = labelRepository;
    this.iterationRepository = iterationRepository;
    this.priorityBucketRepository = priorityBucketRepository;
    this.productRepository = productRepository;
    this.submissionGatewayComposer = submissionGatewayComposer;
    this.externalRequestorRepository = externalRequestorRepository;
    this.ticketMapper = ticketMapper;
    this.additionalFieldValueMapper = additionalFieldValueMapper;
    this.productMapper = productMapper;
    this.jsonFieldMapper = jsonFieldMapper;
    this.bulkProductActionRepository = bulkProductActionRepository;
    this.bulkProductActionMapper = bulkProductActionMapper;
    this.externalRequestorMapper = externalRequestorMapper;
    this.attachmentService = attachmentService;
    this.labelMapper = labelMapper;
    this.businessZoneId = businessZoneId;
  }

  public static Sort toSpringDataSort(OrderCondition orderCondition) {
    if (orderCondition != null) {
      String property = orderCondition.getFieldName();
      return orderCondition.getOrder().equals(1)
          ? Sort.by(property).ascending()
          : Sort.by(property).descending();
    }
    return Sort.unsorted();
  }

  @SuppressWarnings("java:S1192")
  private static ResourceNotFoundProblem getProductResourceNotFoundProblem(
      Long ticketId, String name) {
    return new ResourceNotFoundProblem("Product '" + name + "' not found for ticket " + ticketId);
  }

  private static ResourceNotFoundProblem getBulkResourceNotFoundProblem(
      Long ticketId, String name) {
    return new ResourceNotFoundProblem(
        "Bulk action '" + name + "' not found for ticket " + ticketId);
  }

  // TODO consider removing transaction and adding in join fetching
  @Transactional
  public TicketDtoExtended findTicket(Long id) {
    return ticketMapper.toExtendedDto(
        ticketRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, id))));
  }

  @Transactional
  public TicketDtoExtended findTicketByTicketNumber(String ticketNumber) {
    return ticketMapper.toExtendedDto(
        ticketRepository
            .findByTicketNumber(ticketNumber)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_NUMBER_NOT_FOUND, ticketNumber))));
  }

  public Page<TicketDto> findAllTickets(Pageable pageable) {
    Page<Ticket> tickets = ticketRepository.findAll(pageable);
    return tickets.map(ticketMapper::toDto);
  }

  @Transactional
  public Page<TicketBacklogDto> findAllTicketsByQueryParam(
      Predicate predicate,
      Pageable pageable,
      OrderCondition orderCondition,
      List<SearchCondition> searchConditions) {

    // First, get the paginated IDs
    Page<Long> ticketIds =
        ticketRepository.findAllIds(
            predicate, pageable, toSpringDataSort(orderCondition), searchConditions);

    // Then, fetch the full tickets with associations
    List<Ticket> tickets = ticketRepository.findByIdIn(ticketIds.getContent());
    Map<Long, Ticket> ticketMap =
        tickets.stream().collect(Collectors.toMap(Ticket::getId, Function.identity()));
    List<Ticket> orderedTickets =
        ticketIds.getContent().stream().map(ticketMap::get).filter(Objects::nonNull).toList();

    List<TicketBacklogDto> ticketDtos =
        orderedTickets.stream().map(ticketMapper::toBacklogDto).toList();

    return new PageImpl<>(ticketDtos, pageable, ticketIds.getTotalElements());
  }

  @Transactional
  public List<TicketDto> findDtoByAdditionalFieldTypeValueOf(
      String additionalFieldTypeName, String valueOf) {

    return ticketMapper.toDtoList(
        findByAdditionalFieldTypeValueOf(additionalFieldTypeName, valueOf));
  }

  public List<Ticket> findByAdditionalFieldTypeValueOf(
      String additionalFieldTypeName, String valueOf) {
    AdditionalFieldType additionalFieldType =
        additionalFieldTypeRepository
            .findByName(additionalFieldTypeName)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        "Could not find field type " + additionalFieldTypeName));

    AdditionalFieldValue additionalFieldValue =
        additionalFieldValueRepository
            .findByValueOfAndTypeId(additionalFieldType, valueOf)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Additional field with value %s not found", valueOf)));

    return ticketRepository.findByAdditionalFieldValueId(additionalFieldValue.getId());
  }

  @Override
  @Transactional
  public List<TicketMinimalDto> findByAdditionalFieldTypeNameAndListValueOf(
      String additionalFieldTypeName, List<String> artgIds) {

    List<Ticket> tickets =
        ticketRepository.findByAdditionalFieldValueIds(additionalFieldTypeName, artgIds);

    logger.info(
        "Found " + tickets.size() + " tickets, for" + artgIds.size() + " field with values ");

    return tickets.stream().map(ticketMapper::toMinimalDto).toList();
  }

  @Transactional
  public void deleteTicket(Long ticketId) {
    Ticket ticket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));

    List<Attachment> attachments = ticket.getAttachments();

    ticketRepository.delete(ticket);

    // Delete attachment files
    attachments.forEach(attachmentService::deleteAttachmentFiles);
  }

  @Transactional
  public Ticket createTicketFromDto(TicketDto ticketDto) {

    Ticket fromTicketDto = ticketMapper.toEntity(ticketDto);
    Ticket newTicket = ticketRepository.save(new Ticket());
    return ticketRepository.save(addEntitysToTicket(newTicket, fromTicketDto, ticketDto, true));
  }

  @Transactional
  public List<TicketBacklogDto> bulkUpdateTickets(List<TicketBacklogDto> ticketDtos) {
    List<Ticket> updateTickets =
        ticketDtos.stream()
            .map(ticketDto -> updateBacklogTicket(ticketDto, ticketDto.getId()))
            .toList();
    return ticketRepository.saveAll(updateTickets).stream()
        .map(ticketMapper::toBacklogDto)
        .toList();
  }

  public Ticket updateBacklogTicket(TicketBacklogDto ticketBacklogDto, Long ticketId) {
    final Ticket recievedTicket = ticketMapper.toEntityFromBacklogDto(ticketBacklogDto);
    final Ticket foundTicket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));
    return addEntitysToBacklogTicket(
        foundTicket, recievedTicket, ticketBacklogDto.getExternalRequestors());
  }

  @Transactional
  public Ticket updateTicketFromDto(TicketDto ticketDto, Long ticketId) {
    return ticketRepository.save(updateTicketFieldsFromDto(ticketDto, ticketId));
  }

  private Ticket updateTicketFieldsFromDto(TicketDto ticketDto, Long ticketId) {
    final Ticket recievedTicket = ticketMapper.toEntity(ticketDto);
    final Ticket foundTicket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));
    return addEntitysToTicket(foundTicket, recievedTicket, ticketDto, false);
  }

  public Set<AdditionalFieldValue> generateAdditionalFields(
      Set<AdditionalFieldValueDto> additionalFieldDtos, Ticket ticketToSave) {
    // Ordered, so the order the caller listed its fields in reaches the join table.
    Set<AdditionalFieldValue> additionalFieldValues = new LinkedHashSet<>();

    for (AdditionalFieldValueDto additionalFieldValueDto : additionalFieldDtos) {

      AdditionalFieldValue additionalFieldValue =
          additionalFieldValueMapper.toEntity(additionalFieldValueDto);

      AdditionalFieldType additionalFieldType =
          additionalFieldTypeRepository
              .findByName(additionalFieldValue.getAdditionalFieldType().getName())
              .orElseThrow(
                  () ->
                      new ResourceNotFoundProblem(
                          String.format(
                              "Additional field type %s not found",
                              additionalFieldValue.getAdditionalFieldType().getName())));

      handleAdditionalField(
          ticketToSave, additionalFieldValues, additionalFieldValue, additionalFieldType);
    }

    return additionalFieldValues;
  }

  private void handleAdditionalField(
      Ticket ticketToSave,
      Set<AdditionalFieldValue> additionalFieldValues,
      AdditionalFieldValue additionalFieldValue,
      AdditionalFieldType additionalFieldType) {
    if (additionalFieldType.getType().equals(Type.LIST)) {
      Optional<AdditionalFieldValue> additionalFieldValueOptional =
          additionalFieldValueRepository.findByValueOfAndTypeId(
              additionalFieldType, additionalFieldValue.getValueOf());
      additionalFieldValueOptional.ifPresent(additionalFieldValues::add);
      // create new
    } else {

      // if date, convert to instant format
      if (additionalFieldType.getType().equals(Type.DATE)) {
        additionalFieldValue.setValueOf(
            InstantUtils.formatTimeToDb(
                additionalFieldValue.getValueOf(),
                InstantUtils.YYYY_MM_DD_T_HH_MM_SS_SSSXXX,
                businessZoneId));
      }

      // for shared-value field types, reuse an existing value row rather than creating a duplicate
      Optional<AdditionalFieldValue> afvOptional = Optional.empty();
      if (additionalFieldType.isSharedValue()) {
        afvOptional =
            additionalFieldValueRepository.findByValueOfAndTypeId(
                additionalFieldType, additionalFieldValue.getValueOf());
      }

      if (afvOptional.isPresent()) {
        additionalFieldValues.add(afvOptional.get());
      } else {
        additionalFieldValue.setAdditionalFieldType(additionalFieldType);
        additionalFieldValue.setTickets(new ArrayList<>(List.of(ticketToSave)));
        additionalFieldValues.add(additionalFieldValue);
      }
    }
  }

  @Transactional
  public int importTickets(TicketImportDto[] importDtos, int startAt, int size) {

    int currentIndex = startAt;
    int savedNumberOfTickets = 0;
    long startTime = System.currentTimeMillis();
    // We are saving in batch because of memory issues for both H2 and PostgreSQL
    int batchSize = getDefaultBatchSize(size);
    /*
     * These are Maps for fields that need to be managed for primary key violation We can't add
     * duplcate values for these fields
     */
    Map<String, Label> labelsToSave = new HashMap<>();
    Map<String, ExternalRequestor> externalRequestorsToSave = new HashMap<>();
    Map<String, State> statesToSave = new HashMap<>();
    Map<String, AttachmentType> attachmentTypesToSave = new HashMap<>();
    Map<String, AdditionalFieldType> additionalFieldTypesToSave = new HashMap<>();
    Map<String, AdditionalFieldValue> additionalFieldTypeValuesToSave = new HashMap<>();
    Map<String, TicketType> ticketTypesToSave = new HashMap<>();
    Map<String, Schedule> schedulesToSave = new HashMap<>();
    while (currentIndex < startAt + size) {
      batchSize = getBatchSize(startAt, size, currentIndex, batchSize);
      long batchStart = System.currentTimeMillis();
      // These are lookup Maps for the existing Entities in the database.
      // We use them for performance improvement and to avoid stalling queries
      // because of database locks
      logger.info("Start caching fields with relationships...");
      Map<String, ExternalRequestor> externalRequestors =
          preloadFields(ExternalRequestor::getName, externalRequestorRepository);
      Map<String, Label> labels = preloadFields(Label::getName, labelRepository);
      Map<String, State> states = preloadFields(State::getLabel, stateRepository);
      Map<String, AttachmentType> attachmentTypes =
          preloadFields(AttachmentType::getMimeType, attachmentTypeRepository);
      Map<String, AdditionalFieldType> additionalFieldTypes =
          preloadFields(AdditionalFieldType::getName, additionalFieldTypeRepository);
      Map<String, TicketType> ticketTypes =
          preloadFields(TicketType::getName, ticketTypeRepository);
      Map<String, Schedule> schedules = preloadFields(Schedule::getName, scheduleRepository);
      // Existing Field Type Value lookup with keys that consists of field type + field type
      // value
      Map<String, AdditionalFieldValue> additionalFieldTypeValues = new HashMap<>();

      logger.info(
          "Finished reading fields with relationships in "
              + (System.currentTimeMillis() - batchStart)
              + "ms");

      /*
       * Here we go...
       *
       * From here we copy everything from the DTO to newTicketToSave and make sure we use exsiging
       * entities from the database for the appropriate fields.
       *
       * We also make sure that we don't add duplicated fields in the transaction and break primary
       * keys so we will use lookup maps from above for that
       *
       * We use batch processing to avoid Memory issues especially with H2 database
       *
       */
      List<Ticket> ticketsToSave = new ArrayList<>();
      logger.info("Start processing " + batchSize + " items from index " + currentIndex);
      for (int dtoIndex = currentIndex; dtoIndex < currentIndex + batchSize; dtoIndex++) {
        TicketImportDto dto = importDtos[dtoIndex];

        // separate out labels and external requestors
        Set<ExternalRequesterDto> externalRequestorList =
            dto.getLabels().stream()
                .filter(label -> !ExportService.NON_EXTERNAL_REQUESTERS.contains(label.getName()))
                .map(this::mapToExternalRequestor)
                .collect(Collectors.toSet());
        Set<LabelDto> filteredLabels =
            dto.getLabels().stream()
                .filter(label -> ExportService.NON_EXTERNAL_REQUESTERS.contains(label.getName()))
                .collect(Collectors.toSet());
        dto.setExternalRequestors(externalRequestorList);
        dto.setLabels(filteredLabels);

        // Load the Ticket to be added.
        // Unfortunately we can't just have this, we have to process it
        // and sort out for existing/duplcated data

        Ticket newTicketToAdd = ticketMapper.toEntity(dto);
        newTicketToAdd.setJiraCreated(dto.getCreated());

        // This will be the Ticket to save into the DB
        Ticket newTicket = new Ticket();
        newTicket.setJiraCreated(newTicketToAdd.getJiraCreated());
        // Persist ticket with Jira Created Date as Created Date
        Ticket newTicketToSave = ticketRepository.save(newTicket);
        newTicketToSave.setDescription(newTicketToAdd.getDescription());
        newTicketToSave.setTitle(newTicketToAdd.getTitle());
        newTicketToSave.setAttachments(
            processAttachments(
                attachmentTypesToSave, attachmentTypes, newTicketToAdd, newTicketToSave));
        newTicketToSave.setAdditionalFieldValues(
            processAdditionalFields(
                additionalFieldTypesToSave,
                additionalFieldTypeValuesToSave,
                additionalFieldTypes,
                additionalFieldTypeValues,
                newTicketToAdd));
        newTicketToSave.setLabels(processLabels(labelsToSave, labels, newTicketToAdd));
        Set<ExternalRequestor> resolvedExternalRequestors =
            processExternalRequestors(
                externalRequestorsToSave, externalRequestors, externalRequestorList);
        resolvedExternalRequestors.forEach(
            er -> {
              TicketExternalRequestor ter =
                  TicketExternalRequestor.builder()
                      .ticket(newTicketToSave)
                      .externalRequestor(er)
                      .build();
              newTicketToSave.getTicketExternalRequestors().add(ter);
            });

        newTicketToSave.setState(
            processEntity(
                statesToSave,
                states,
                newTicketToAdd.getState(),
                newTicketToAdd.getState().getLabel(),
                state ->
                    State.builder()
                        .label(state.getLabel())
                        .description(state.getDescription())
                        .grouping(state.getGrouping())
                        .build(),
                stateRepository::save));

        newTicketToSave.setTicketType(
            processEntity(
                ticketTypesToSave,
                ticketTypes,
                newTicketToAdd.getTicketType(),
                newTicketToAdd.getTicketType().getName(),
                ticketType ->
                    TicketType.builder()
                        .name(ticketType.getName())
                        .description(ticketType.getDescription())
                        .build(),
                ticketTypeRepository::save));

        newTicketToSave.setSchedule(
            processEntity(
                schedulesToSave,
                schedules,
                newTicketToAdd.getSchedule(),
                newTicketToAdd.getSchedule().getName(),
                schedule ->
                    Schedule.builder()
                        .name(schedule.getName())
                        .description(schedule.getDescription())
                        .grouping(schedule.getGrouping())
                        .build(),
                scheduleRepository::save));

        List<Comment> newComments = new ArrayList<>();
        if (newTicketToAdd.getComments() != null) {
          newTicketToAdd
              .getComments()
              .forEach(
                  comment ->
                      newComments.add(
                          Comment.builder()
                              .text(comment.getText())
                              .jiraCreated(comment.getCreated())
                              .ticket(newTicketToSave)
                              .build()));
        }
        if (newTicketToAdd.getAssignee() != null) {
          newComments.add(
              Comment.builder()
                  .text(
                      "<h2>### Import note: Current assignee: "
                          + newTicketToAdd.getAssignee()
                          + "</h2")
                  .ticket(newTicketToSave)
                  .build());
        }
        commentRepository.saveAll(newComments);
        newTicketToSave.setComments(newComments);

        /*
         * Batch processing - add ticket to be saved later
         */
        ticketsToSave.add(newTicketToSave);
        int importedTicketNumber = (dtoIndex - startAt) + 1;
        if (importedTicketNumber > 0 && importedTicketNumber % 5000 == 0) {
          long batchEnd = System.currentTimeMillis();
          logger.info(
              "Processed batch of 5000 Tickets ["
                  + importedTicketNumber
                  + "] in "
                  + (batchEnd - batchStart)
                  + "ms");
          batchStart = System.currentTimeMillis();
        }
        // Do you like this SonarCloud?
        setImportProgress((importedTicketNumber / (startAt + size * 1.00)) * 100.00);
      }
      logger.info(
          "Processed last batch of tickets. Total processing time: "
              + (System.currentTimeMillis() - startTime)
              + "ms");

      additionalFieldTypesToSave.clear();
      additionalFieldTypeValuesToSave.clear();
      statesToSave.clear();
      attachmentTypesToSave.clear();
      labelsToSave.clear();
      externalRequestorsToSave.clear();
      logger.info("Saving Tickets...");
      int savedTickets = batchSaveEntitiesToRepository(ticketsToSave, ticketRepository);
      savedNumberOfTickets += savedTickets;
      // Clean up
      logger.info("Flushing tickets...");
      try {
        ticketRepository.flush();
      } catch (DataIntegrityViolationException e) {
        throw new TicketImportProblem(e.getMessage());
      }
      currentIndex += batchSize;
    }

    long endTime = System.currentTimeMillis();
    logger.info(
        "Processed "
            + savedNumberOfTickets
            + " tickets in "
            + String.format(
                "%d min, %d sec",
                TimeUnit.MILLISECONDS.toMinutes(endTime - startTime),
                TimeUnit.MILLISECONDS.toSeconds(endTime - startTime)
                    - TimeUnit.MINUTES.toSeconds(
                        TimeUnit.MILLISECONDS.toMinutes(endTime - startTime))));
    return savedNumberOfTickets;
  }

  private ExternalRequesterDto mapToExternalRequestor(LabelDto l) {
    return ExternalRequesterDto.builder()
        .name(l.getName())
        .description(l.getDescription())
        .displayColor(l.getDisplayColor())
        .build();
  }

  private int getBatchSize(int startAt, int size, int currentIndex, int batchSize) {
    if (currentIndex + batchSize > startAt + size) {
      batchSize = (startAt + size) - currentIndex;
    }
    return batchSize;
  }

  private int getDefaultBatchSize(int size) {
    int batchSize = ITEMS_TO_PROCESS;
    if (batchSize > size) {
      batchSize = size;
    }
    return batchSize;
  }

  /*
   * Deal with similar entities e.g Schedule, TicketType, State, etc that require looking up
   * existing records in the database and using the existing records if they exist
   */
  private <T extends BaseAuditableEntity> T processEntity(
      Map<String, T> entitesToSave,
      Map<String, T> existingEntities,
      T entityToProcess,
      String key,
      UnaryOperator<T> entityCreator,
      Consumer<T> saveEntity) {
    if (entityToProcess == null || key == null) {
      return null;
    }
    if (existingEntities.containsKey(key)) {
      return existingEntities.get(key);
    }
    if (entitesToSave.containsKey(key)) {
      return entitesToSave.get(key);
    }
    T newEntity = entityCreator.apply(entityToProcess);
    entitesToSave.put(key, newEntity);
    saveEntity.accept(newEntity);
    return newEntity;
  }

  /*
   * Deal with Labels
   */
  private Set<Label> processLabels(
      Map<String, Label> labelsToSave, Map<String, Label> labels, Ticket newTicketToAdd) {
    Set<Label> theLabels = newTicketToAdd.getLabels();
    Set<Label> labelsToAdd = new HashSet<>();
    for (Label label : theLabels) {
      String labelToAdd = label.getName();
      // Check if the fieldType is already saved in the DB
      if (labels.containsKey(labelToAdd)) {
        Label existingLabel = labels.get(labelToAdd);
        labelsToSave.put(existingLabel.getName(), existingLabel);
        labelsToAdd.add(existingLabel);
      } else {
        if (labelsToSave.containsKey(labelToAdd)) {
          // Use already saved label from db
          labelsToAdd.add(labelsToSave.get(labelToAdd));
        } else {
          // Adding completely new label
          Label newLabel =
              Label.builder()
                  .name(label.getName())
                  .description(label.getDescription())
                  .displayColor(label.getDisplayColor())
                  .build();
          labelsToSave.put(labelToAdd, newLabel);
          labelsToAdd.add(newLabel);
        }
      }
    }
    labelRepository.saveAll(labelsToAdd);
    return labelsToAdd;
  }

  /*
   * Deal with Labels
   */
  private Set<ExternalRequestor> processExternalRequestors(
      Map<String, ExternalRequestor> externalRequestorsToSave,
      Map<String, ExternalRequestor> externalRequestors,
      Set<ExternalRequesterDto> externalRequesterDtos) {
    Set<ExternalRequestor> externalRequestorsToAdd = new HashSet<>();
    for (ExternalRequesterDto externalRequestor : externalRequesterDtos) {
      String externalRequestorToAdd = externalRequestor.getName();
      // Check if the fieldType is already saved in the DB
      if (externalRequestors.containsKey(externalRequestorToAdd)) {
        ExternalRequestor existingExternalRequestor =
            externalRequestors.get(externalRequestorToAdd);
        externalRequestorsToSave.put(
            existingExternalRequestor.getName(), existingExternalRequestor);
        externalRequestorsToAdd.add(existingExternalRequestor);
      } else {
        if (externalRequestorsToSave.containsKey(externalRequestorToAdd)) {
          // Use already saved label from db
          externalRequestorsToAdd.add(externalRequestorsToSave.get(externalRequestorToAdd));
        } else {
          // Adding completely new label
          ExternalRequestor newExternalRequestor =
              ExternalRequestor.builder()
                  .name(externalRequestor.getName())
                  .description(externalRequestor.getDescription())
                  .displayColor(externalRequestor.getDisplayColor())
                  .build();
          externalRequestorsToSave.put(externalRequestorToAdd, newExternalRequestor);
          externalRequestorsToAdd.add(newExternalRequestor);
        }
      }
    }
    externalRequestorRepository.saveAll(externalRequestorsToAdd);
    return externalRequestorsToAdd;
  }

  /*
   * Deal with AdditionFieldTypeValues, it a bit complicated... The way it works: - We have
   * preloaded lookup maps additionalFieldTypes and additionalFieldTypeValues that contain all
   * AdditionalFieldType and AdditionalFieldTypeValue existing in the DB We need this because
   * Database lookup is very slow and encountered with locks that stalled the database queries - We
   * also have additionalFieldTypesToSave and additionalFieldTypeValuesToSave that contain all
   * AdditionalFieldType and AdditionalFieldTypeValue existing in the current Transaction. These are
   * to avoid to add duplicated values and types that would cause the primary key violations - If
   * the Field type and the value exists in the DB, do not add it use the existing Value and field
   * type from the database - If the Field Type exists in the database but not the value, use the
   * existing Field Type from DB, add the new value and record the new value for the Transaction for
   * lookup later - If a field type doesn't exist in the database: - If the Field type and the Value
   * exists in the current Transaction use that, do not add a new field type to avoid primary key
   * violation - If a field type exists but not the value in the transaction use the field type void
   * adding it twice and getting primary key violation, add new value and record the new value for
   * the Transaction for lookup - If it's a new Field Type Add the value and the field type and
   * record both for the transaction
   */
  private Set<AdditionalFieldValue> processAdditionalFields(
      Map<String, AdditionalFieldType> additionalFieldTypesToSave,
      Map<String, AdditionalFieldValue> additionalFieldTypeValuesToSave,
      Map<String, AdditionalFieldType> additionalFieldTypes,
      Map<String, AdditionalFieldValue> additionalFieldTypeValues,
      Ticket newTicketToAdd) {
    Set<AdditionalFieldValue> additionalFieldValuesToAdd = new LinkedHashSet<>();
    Set<AdditionalFieldValue> additionalFields = newTicketToAdd.getAdditionalFieldValues();
    for (AdditionalFieldValue additionalFieldValue : additionalFields) {
      AdditionalFieldValue fieldValueToAdd = new AdditionalFieldValue();
      fieldValueToAdd.setTickets(new ArrayList<>());
      AdditionalFieldType fieldType = additionalFieldValue.getAdditionalFieldType();
      String fieldTypeToAdd = fieldType.getName();
      // Check that the Field Type already exists in the save list
      if (!additionalFieldTypes.containsKey(fieldTypeToAdd)) {
        // Check that the field type we want to add is already in the Transaction and that
        // the value
        // we want to add is not in the transaction
        String valueAndType = additionalFieldValue.getValueOf() + fieldTypeToAdd;
        fieldValueToAdd =
            handleFieldTypeInTransaction(
                additionalFieldTypesToSave,
                additionalFieldTypeValuesToSave,
                additionalFieldValue,
                fieldValueToAdd,
                fieldType,
                fieldTypeToAdd,
                valueAndType);
      } else {
        // Check if it's in the DB
        // Check that the value we want to add with the existing field type doesn't already
        // exist
        fieldValueToAdd =
            handleFieldTypeInDB(
                additionalFieldTypeValuesToSave,
                additionalFieldTypes,
                additionalFieldTypeValues,
                additionalFieldValue,
                fieldValueToAdd,
                fieldTypeToAdd);
      }
      additionalFieldValuesToAdd.add(fieldValueToAdd);
    }
    additionalFieldValueRepository.saveAll(additionalFieldValuesToAdd);
    return additionalFieldValuesToAdd;
  }

  private AdditionalFieldValue handleFieldTypeInDB(
      Map<String, AdditionalFieldValue> additionalFieldTypeValuesToSave,
      Map<String, AdditionalFieldType> additionalFieldTypes,
      Map<String, AdditionalFieldValue> additionalFieldTypeValues,
      AdditionalFieldValue additionalFieldValue,
      AdditionalFieldValue fieldValueToAdd,
      String fieldTypeToAdd) {
    if (!additionalFieldTypeValues.containsKey(
        fieldTypeToAdd + additionalFieldValue.getValueOf())) {
      // Add value it doesn't exist
      fieldValueToAdd.setValueOf(additionalFieldValue.getValueOf());
      fieldValueToAdd.setAdditionalFieldType(additionalFieldTypes.get(fieldTypeToAdd));
      additionalFieldTypeValuesToSave.put(
          fieldTypeToAdd + additionalFieldValue.getValueOf(), fieldValueToAdd);
    } else {
      // Add existing Value from DB
      fieldValueToAdd =
          additionalFieldTypeValues.get(fieldTypeToAdd + additionalFieldValue.getValueOf());
      // Need to save it again as it will be a new version with the new ticket added
      // to the
      // relationship
      additionalFieldTypeValuesToSave.put(
          fieldTypeToAdd + additionalFieldValue.getValueOf(), fieldValueToAdd);
    }
    return fieldValueToAdd;
  }

  private AdditionalFieldValue handleFieldTypeInTransaction(
      Map<String, AdditionalFieldType> additionalFieldTypesToSave,
      Map<String, AdditionalFieldValue> additionalFieldTypeValuesToSave,
      AdditionalFieldValue additionalFieldValue,
      AdditionalFieldValue fieldValueToAdd,
      AdditionalFieldType fieldType,
      String fieldTypeToAdd,
      String valueAndType) {
    if (additionalFieldTypesToSave.containsKey(fieldTypeToAdd)) {
      AdditionalFieldType existingFieldTypeInTransaction =
          additionalFieldTypesToSave.get(fieldTypeToAdd);
      if (additionalFieldTypeValuesToSave.containsKey(valueAndType)) {
        // The combination exists Add existing type and value and do not create a
        // new in the db
        // to avoid key collision
        fieldValueToAdd = additionalFieldTypeValuesToSave.get(valueAndType);
      } else {
        // The combination doesn't exist in the transaction add the Value and
        // Existing type and
        // record new value
        // in lookup map
        fieldValueToAdd.setValueOf(additionalFieldValue.getValueOf());
        fieldValueToAdd.setAdditionalFieldType(existingFieldTypeInTransaction);
        additionalFieldTypeValuesToSave.put(valueAndType, fieldValueToAdd);
      }
    } else {
      // New Field Type Add both and record
      // Need an empty list here otherwise Hibernate doesn't populate the reverse
      // relationship
      // back to the Value field
      additionalFieldTypeRepository.save(fieldType);
      fieldValueToAdd.setValueOf(additionalFieldValue.getValueOf());
      fieldValueToAdd.setAdditionalFieldType(fieldType);
      additionalFieldTypeValuesToSave.put(
          additionalFieldValue.getValueOf() + fieldTypeToAdd, fieldValueToAdd);
      additionalFieldTypesToSave.put(fieldTypeToAdd, fieldType);
    }
    return fieldValueToAdd;
  }

  private AttachmentType useAttachmentTypeIfAlreadySaved(
      Map<String, AttachmentType> attachmentTypesToSave,
      Map<String, AttachmentType> attachmentTypes,
      Attachment attachment,
      String mimeTypeToAdd) {
    if (attachmentTypes.containsKey(mimeTypeToAdd)) {
      return attachmentTypes.get(mimeTypeToAdd);
    } else {
      if (attachmentTypesToSave.containsKey(mimeTypeToAdd)) {
        // Do not add a new attachment type in the transaction to avoid primarykey
        // collisions
        return attachmentTypesToSave.get(mimeTypeToAdd);
      } else {
        // New AttachmentType to add, it will be saved later
        AttachmentType newAttachmentType = AttachmentType.of(attachment.getAttachmentType(), true);
        attachmentTypesToSave.put(mimeTypeToAdd, newAttachmentType);
        return attachmentTypeRepository.save(newAttachmentType);
      }
    }
  }

  /*
   * Deal with Attachments and AttachmentTypes
   */
  private List<Attachment> processAttachments(
      Map<String, AttachmentType> attachmentTypesToSave,
      Map<String, AttachmentType> attachmentTypes,
      Ticket newTicketToAdd,
      Ticket newTicketToSave) {
    List<Attachment> attachments = newTicketToAdd.getAttachments();
    List<Attachment> attachmentsToAdd = new ArrayList<>();
    File saveLocation = new File(attachmentsDirConfig);
    if (!saveLocation.exists()) {
      saveLocation.mkdirs();
    }
    String attachmentsDirectory =
        attachmentsDirConfig + (attachmentsDirConfig.endsWith("/") ? "" : "/");
    for (Attachment attachment : attachments) {
      try {
        // Check if the attachmentType is already saved
        String mimeTypeToAdd = attachment.getAttachmentType().getMimeType();
        attachment.setAttachmentType(
            useAttachmentTypeIfAlreadySaved(
                attachmentTypesToSave, attachmentTypes, attachment, mimeTypeToAdd));
        // In the DTO we don't have the attachments in the JSON file so load them from the
        // disk using getLocation.
        // Attachment will then be saved onto disk with a filename representing the
        // SHA256 hash of the attachment.
        // This allows us to save disk space by not saving files with the same content
        // multiple times.
        // I've tested we can rely on Jira's SHA256 hashes that are provided in the import
        // file
        // No need to recalculate and slow down import.
        String fileName = attachment.getFilename();
        String fileLocationToSave =
            AttachmentUtils.getAttachmentAbsolutePath(attachmentsDirectory, attachment.getSha256());
        AttachmentUtils.copyAttachmentToDestination(attachment.getLocation(), fileLocationToSave);
        attachment.setLocation(AttachmentUtils.getAttachmentRelativePath(attachment.getSha256()));
        attachment.setFilename(fileName);
        if (attachment.getThumbnailLocation() != null) {
          String thumbNailLocationToSave =
              AttachmentUtils.getThumbnailAbsolutePath(
                  attachmentsDirectory, attachment.getSha256());
          AttachmentUtils.copyAttachmentToDestination(
              attachment.getThumbnailLocation(), thumbNailLocationToSave);
          attachment.setThumbnailLocation(
              AttachmentUtils.getThumbnailRelativePath(attachment.getSha256()));
        }
      } catch (IOException e) {
        throw new TicketImportProblem(e.getMessage());
      }
      Attachment newAttachment =
          Attachment.builder()
              .description(attachment.getDescription())
              .jiraCreated(attachment.getCreated())
              .filename(attachment.getFilename())
              .location(attachment.getLocation())
              .thumbnailLocation(attachment.getThumbnailLocation())
              .length(attachment.getLength())
              .sha256(attachment.getSha256())
              .attachmentType(attachment.getAttachmentType())
              .ticket(newTicketToSave)
              .build();
      attachmentsToAdd.add(newAttachment);
    }
    attachmentRepository.saveAll(attachmentsToAdd);
    return attachmentsToAdd;
  }

  /*
   * Batching the Save for H2 backend to avoid out of memory errors
   */
  private <T> int batchSaveEntitiesToRepository(
      Collection<T> entities, JpaRepository<T, ?> repository) {

    int savedNumberOfItems = 0;
    long startSave = System.currentTimeMillis();
    repository.saveAll(entities);
    long endSave = System.currentTimeMillis();
    savedNumberOfItems += entities.size();
    logger.info("Saved " + entities.size() + " items, in " + (endSave - startSave) + "ms ");
    return savedNumberOfItems;
  }

  private <T> Map<String, T> preloadFields(
      Function<T, String> compareField, JpaRepository<T, ?> repository) {
    List<T> items = repository.findAll();
    return items.stream().collect(Collectors.toMap(compareField, Function.identity()));
  }

  private void setImportProgress(double progress) {
    this.importProgress = progress;
  }

  public String generateImportFile(File originalFile, File newFile) {
    SafeUtils.checkFile(originalFile, allowedImportDirectory, TicketImportProblem.class);
    SafeUtils.checkFile(newFile, allowedImportDirectory, TicketImportProblem.class);
    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.findAndRegisterModules();
    objectMapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);
    objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
    objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

    TicketImportDto[] originalTicketImportDtos;
    TicketImportDto[] newTicketImportDtos;
    try {
      originalTicketImportDtos = objectMapper.readValue(originalFile, TicketImportDto[].class);
      newTicketImportDtos = objectMapper.readValue(newFile, TicketImportDto[].class);

      List<TicketImportDto> updates = new ArrayList<>();
      List<TicketImportDto> newItems = new ArrayList<>();

      // Separate updates and new items based on the presence of an 'id'
      for (TicketImportDto newDto : newTicketImportDtos) {
        boolean isNewItem = true;
        for (TicketImportDto originalDto : originalTicketImportDtos) {
          if (newDto.getId() != null && newDto.getId().equals(originalDto.getId())) {
            if (!originalDto.equals(newDto)) {
              updates.add(newDto);
            }
            isNewItem = false;
            break;
          }
        }
        if (isNewItem) {
          newItems.add(newDto);
        }
      }

      String updateImportFilePath = originalFile.getAbsolutePath() + ".updates";
      String newItemsImportFilePath = originalFile.getAbsolutePath() + ".newitems";

      objectMapper.writeValue(new File(updateImportFilePath), updates);
      objectMapper.writeValue(new File(newItemsImportFilePath), newItems);

      return String.join(",", updateImportFilePath, newItemsImportFilePath);

    } catch (IOException e) {
      throw new TicketImportProblem(e.getMessage());
    }
  }

  public void putBulkProductActionOnTicket(Long ticketId, BulkProductActionDto dto) {
    // check if the ticket exists
    Ticket ticketToUpdate =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));

    // check if the bulk product action already exists
    Optional<BulkProductAction> bulkProductActionOptional =
        bulkProductActionRepository.findByNameAndTicketId(dto.getName(), ticketId);

    BulkProductAction bulkProductAction;
    if (bulkProductActionOptional.isPresent()) {
      // if the bulk product exists already we can just update it
      bulkProductAction = bulkProductActionOptional.get();
      if (bulkProductAction.getConceptIds() == null) {
        bulkProductAction.setConceptIds(new HashSet<>());
      }
      if (!dto.getConceptIds().isEmpty()) {
        bulkProductAction.getConceptIds().retainAll(dto.getConceptIds());
        bulkProductAction
            .getConceptIds()
            .addAll(dto.getConceptIds().stream().map(Long::parseLong).toList());
      }
      bulkProductAction.setDetails(dto.getDetails());
    } else {
      // if the bulk product entity doesn't exist we need to create it
      bulkProductAction = bulkProductActionMapper.toEntity(dto);
      bulkProductAction.setTicket(ticketToUpdate);
    }

    bulkProductActionRepository.save(bulkProductAction);
  }

  public ProductDto putProductOnTicket(Long ticketId, ProductDto productDto) {
    Ticket ticketToUpdate =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));

    Optional<Product> productOptional =
        productRepository.findByNameAndTicketId(productDto.getName(), ticketId);

    Product product;
    if (productOptional.isPresent()) {
      product = productOptional.get();
      if (productDto.getConceptId() != null) {
        product.setConceptId(Long.valueOf(productDto.getConceptId()));
      }
      if (productDto.getAction() != null) {
        product.setAction(productDto.getAction());
      }

      product.setPackageDetails(productDto.getPackageDetails());
      product.setOriginalPackageDetails(productDto.getOriginalPackageDetails());
      if (productDto.getOriginalConceptId() != null) {
        // If the original concept ID is provided, we set it
        // Otherwise, we leave it as null
        product.setOriginalConceptId(Long.parseLong(productDto.getOriginalConceptId()));
      }
    } else {
      product = productMapper.toEntity(productDto);
      product.setTicket(ticketToUpdate);
    }

    if (product.getOriginalPackageDetails() != null
        && product.getOriginalPackageDetails().isUnpopulated()) {
      product.setOriginalPackageDetails(null);
    }

    Product updatedProduct = productRepository.save(product);
    return productMapper.toDto(updatedProduct);
  }

  public void putProductsOnTicket(Long ticketId, List<ProductDto> productDtos) {
    Ticket ticketToUpdate =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));

    List<Product> productsToSave = new ArrayList<>();

    for (ProductDto productDto : productDtos) {
      Optional<Product> productOptional =
          productRepository.findByNameAndTicketId(productDto.getName(), ticketId);
      Product product;

      if (productOptional.isPresent()) {
        product = productOptional.get();
        if (productDto.getConceptId() != null) {
          product.setConceptId(Long.valueOf(productDto.getConceptId()));
        }
        product.setPackageDetails(productDto.getPackageDetails());
        product.setOriginalPackageDetails(productDto.getOriginalPackageDetails());
        if (productDto.getOriginalConceptId() != null) {
          // If the original concept ID is provided, we set it
          // Otherwise, we leave it as null
          product.setOriginalConceptId(Long.parseLong(productDto.getOriginalConceptId()));
        }
      } else {
        product = productMapper.toEntity(productDto);
        product.setTicket(ticketToUpdate);
      }

      if (product.getOriginalPackageDetails() != null
          && product.getOriginalPackageDetails().isUnpopulated()) {
        product.setOriginalPackageDetails(null);
      }

      productsToSave.add(product);
    }

    productRepository.saveAll(productsToSave);
  }

  public Set<ProductDto> getProductsForTicket(Long ticketId) {
    return productRepository.findByTicketId(ticketId).stream()
        .map(productMapper::toDto)
        .collect(Collectors.toSet());
  }

  public Set<BulkProductActionDto> getBulkProductActionForTicket(Long ticketId) {
    List<BulkProductAction> bpa = bulkProductActionRepository.findByTicketId(ticketId);
    return bulkProductActionRepository.findByTicketId(ticketId).stream()
        .map(bulkProductActionMapper::toDto)
        .collect(Collectors.toSet());
  }

  public ProductDto getProductByName(Long ticketId, String productName) {
    if (ticketRepository.findById(ticketId).isEmpty()) {
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));
    }
    Product product = getProductIfExists(ticketId, productName);

    return productMapper.toDto(product);
  }

  public BulkProductActionDto getBulkProductActionByName(Long ticketId, String productName) {
    if (ticketRepository.findById(ticketId).isEmpty()) {
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));
    }
    BulkProductAction bulkProductAction =
        bulkProductActionRepository
            .findByNameAndTicketId(productName, ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        "Product '" + productName + "' not found for ticket " + ticketId));

    return bulkProductActionMapper.toDto(bulkProductAction);
  }

  public String getNewBulkProductActionName(
      @NotNull Long ticketId, BulkProductActionDto bulkProductActionDto) {
    if (bulkProductActionDto.getBrands() != null && bulkProductActionDto.getPackSizes() == null) {
      return bulkProductActionRepository.findNewBulkProductBrandName(ticketId);
    } else if (bulkProductActionDto.getPackSizes() != null
        && bulkProductActionDto.getBrands() == null) {
      return bulkProductActionRepository.findNewBulkProductPackSizeName(ticketId);
    } else {
      return bulkProductActionDto.getName();
    }
  }

  public void deleteProductByName(@NotNull Long ticketId, @NotNull @NotEmpty String name) {
    assertTicketExists(ticketId);

    Product product = getProductIfExists(ticketId, name);

    productRepository.delete(product);
  }

  private Product getProductIfExists(Long ticketId, String name) {
    return productRepository
        .findByNameAndTicketId(name, ticketId)
        .orElseThrow(() -> getProductResourceNotFoundProblem(ticketId, name));
  }

  @SuppressWarnings("java:S2201")
  private void assertTicketExists(Long ticketId) {
    ticketRepository
        .findById(ticketId)
        .orElseThrow(
            () ->
                new ResourceNotFoundProblem(
                    String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));
  }

  public void deleteProductById(Long ticketId, Long id) {
    assertTicketExists(ticketId);

    Product product =
        productRepository
            .findById(id)
            .orElseThrow(() -> getProductResourceNotFoundProblem(ticketId, String.valueOf(id)));

    productRepository.delete(product);
  }

  public ProductDto getProductById(Long ticketId, Long id) {
    if (ticketRepository.findById(ticketId).isEmpty()) {
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));
    }
    Product product =
        productRepository
            .findById(id)
            .orElseThrow(() -> getProductResourceNotFoundProblem(ticketId, String.valueOf(id)));

    return productMapper.toDto(product);
  }

  public TicketAuthoringHistoryDto getTicketAuthoringHistory(Long conceptId) {
    List<Product> products = productRepository.findByConceptId(conceptId);

    List<String> creates = new ArrayList<>();
    List<String> updates = new ArrayList<>();

    products.stream()
        .filter(p -> p.getAction() == ProductAction.CREATE)
        .map(p -> p.getTicket().getTicketNumber())
        .forEach(creates::add);

    products.stream()
        .filter(p -> p.getAction() == ProductAction.UPDATE)
        .map(p -> p.getTicket().getTicketNumber())
        .forEach(updates::add);

    bulkProductActionRepository.findByConceptId(conceptId).stream()
        .map(b -> b.getTicket().getTicketNumber())
        .forEach(creates::add);

    bulkProductActionRepository.findByProductUpdateProductId(String.valueOf(conceptId)).stream()
        .map(b -> b.getTicket().getTicketNumber())
        .forEach(updates::add);

    return new TicketAuthoringHistoryDto(creates, updates);
  }

  public void deleteBulkProductAction(@NotNull Long ticketId, @NotNull @NotEmpty String name) {
    Ticket ticketToUpdate =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));

    BulkProductAction bulkProductAction =
        bulkProductActionRepository
            .findByNameAndTicketId(name, ticketId)
            .orElseThrow(() -> getBulkResourceNotFoundProblem(ticketId, name));

    ticketToUpdate.getBulkProductActions().remove(bulkProductAction);
    ticketRepository.save(ticketToUpdate);
    bulkProductActionRepository.delete(bulkProductAction);
  }

  private Ticket addEntitysToBacklogTicket(
      Ticket ticketToCopyTo,
      Ticket ticketToCopyFrom,
      Set<TicketExternalRequestorDto> externalRequestorDtos) {
    ticketToCopyTo.setTitle(ticketToCopyFrom.getTitle());

    ticketToCopyTo.setAssignee(ticketToCopyFrom.getAssignee());

    addLabelsToTicket(ticketToCopyTo, ticketToCopyFrom);
    addExternalRequestorsToTicket(ticketToCopyTo, externalRequestorDtos);
    addStateToTicket(ticketToCopyTo, ticketToCopyFrom);

    addIterationToTicket(ticketToCopyTo, ticketToCopyFrom);
    /*
     * Deal with PriorityBucket
     */
    addPriorityToTicket(ticketToCopyTo, ticketToCopyFrom);

    addSchedule(ticketToCopyTo, ticketToCopyFrom);

    addTaskAssociation(ticketToCopyTo, ticketToCopyFrom);

    return ticketToCopyTo;
  }

  private Ticket addEntitysToTicket(
      Ticket ticketToCopyTo, Ticket ticketToCopyFrom, TicketDto dto, boolean isNew) {

    ticketToCopyTo.setTitle(ticketToCopyFrom.getTitle());
    ticketToCopyTo.setDescription(ticketToCopyFrom.getDescription());
    ticketToCopyTo.setAssignee(ticketToCopyFrom.getAssignee());

    addLabelsToTicket(ticketToCopyTo, ticketToCopyFrom);
    addExternalRequestorsToTicket(ticketToCopyTo, dto.getExternalRequestors());
    addStateToTicket(ticketToCopyTo, ticketToCopyFrom);

    /*
     * Deal with TicketType
     */
    TicketType ticketTypeToAdd = ticketToCopyFrom.getTicketType();
    if (ticketTypeToAdd != null) {
      Optional<TicketType> existingTicketType =
          ticketTypeRepository.findByName(ticketTypeToAdd.getName());
      if (existingTicketType.isPresent()) {
        ticketTypeToAdd = existingTicketType.get();
      }
    }
    ticketToCopyTo.setTicketType(ticketTypeToAdd);
    /*
     * Deal with Iteration
     */
    addIterationToTicket(ticketToCopyTo, ticketToCopyFrom);
    /*
     * Deal with PriorityBucket
     */
    addPriorityToTicket(ticketToCopyTo, ticketToCopyFrom);

    // Comments
    addComments(ticketToCopyTo, ticketToCopyFrom, isNew);

    addAdditionalFieldToTicket(ticketToCopyTo, dto);

    addSchedule(ticketToCopyTo, ticketToCopyFrom);

    addJsonFields(ticketToCopyTo, dto, isNew);

    addTaskAssociation(ticketToCopyTo, ticketToCopyFrom);

    return ticketToCopyTo;
  }

  private void addTaskAssociation(Ticket ticketToCopyTo, Ticket ticketToCopyFrom) {
    if (ticketToCopyFrom.getTaskAssociation() == null) {
      ticketToCopyTo.setTaskAssociation(null);
    }

    if (ticketToCopyFrom.getTaskAssociation() != null
        && ticketToCopyFrom.getTaskAssociation().getId() == null) {
      if (ticketToCopyTo.getTaskAssociation() != null
          && ticketToCopyFrom
              .getTaskAssociation()
              .getTaskId()
              .equals(ticketToCopyTo.getTaskAssociation().getTaskId())) {
        return;
      }
      // update existing
      if (ticketToCopyTo.getTaskAssociation() != null) {
        ticketToCopyTo
            .getTaskAssociation()
            .setTaskId(ticketToCopyFrom.getTaskAssociation().getTaskId());
        return;
      }
      // create new
      TaskAssociation taskAssociation =
          TaskAssociation.builder()
              .taskId(ticketToCopyFrom.getTaskAssociation().getTaskId())
              .build();
      taskAssociation.setTicket(ticketToCopyTo);
      ticketToCopyTo.setTaskAssociation(taskAssociation);
    }
  }

  private void addJsonFields(Ticket ticketToSave, TicketDto dto, boolean isNew) {
    if (ticketToSave.getJsonFields() == null && dto.getJsonFields() == null && isNew) {
      ticketToSave.setJsonFields(new HashSet<>());
      return;
    }

    Set<JsonFieldDto> jsonFieldDtos = dto.getJsonFields();
    if (jsonFieldDtos != null) {
      Set<JsonField> jsonFields = getJsonFields(ticketToSave, jsonFieldDtos);
      ticketToSave.setJsonFields(jsonFields);
    }
  }

  private Set<JsonField> getJsonFields(Ticket ticketToSave, Set<JsonFieldDto> jsonFieldDtos) {
    Set<JsonField> jsonFields =
        ticketToSave.getJsonFields() != null ? ticketToSave.getJsonFields() : new HashSet<>();
    for (JsonFieldDto jsonFieldDto : jsonFieldDtos) {
      if (jsonFieldDto.getId() != null) {
        for (JsonField jsonField : jsonFields) {
          if (jsonFieldDto.getId().equals(jsonField.getId())) {
            jsonField.setName(jsonFieldDto.getName());
            jsonField.setValue(jsonFieldDto.getValue());
            break;
          }
        }
      } else {
        JsonField jsonField = jsonFieldMapper.toEntity(jsonFieldDto);
        jsonField.setTicket(ticketToSave);
        jsonFields.add(jsonField);
      }
    }
    return jsonFields;
  }

  private void addLabelsToTicket(Ticket ticketToSave, Ticket dto) {

    if (dto.getLabels() == null) {
      ticketToSave.getLabels().clear();
    } else {
      // we want it to have whatever is in the dto, nothing more nothing less
      ticketToSave.getLabels().clear();
      dto.getLabels()
          .forEach(
              label -> {
                Label labelToAdd = Label.of(label);
                Optional<Label> existingLabel = labelRepository.findByName(labelToAdd.getName());
                if (existingLabel.isPresent()) {
                  labelToAdd = existingLabel.get();
                  ticketToSave.getLabels().add(labelToAdd);
                }
              });
    }
  }

  private void addExternalRequestorsToTicket(
      Ticket ticketToSave, Set<TicketExternalRequestorDto> requestorDtos) {
    reconcileExternalRequestors(ticketToSave, requestorDtos, externalRequestorRepository::findById);
  }

  /**
   * Makes a ticket's external requestor associations match requestorDtos, updating the rows that
   * are still wanted rather than clearing the lot and recreating them.
   *
   * <p>Clear-then-recreate does not work here. TicketExternalRequestor's id is IDENTITY generated,
   * so Hibernate has to run the insert for a re-added association the moment it is persisted and
   * cannot defer it behind the orphan deletes the clear queued up. Any flush in between - an
   * autoflush triggered by the next repository lookup is enough - then fails on
   * uq_ticket_external_requestors (ticket_id, external_requestor_id). Reconciling also keeps each
   * surviving row's id, audit columns and Envers history instead of churning them on every update.
   *
   * @param newRequestorResolver resolves the ExternalRequestor for an id the ticket doesn't already
   *     have; an empty Optional skips that requestor
   */
  private void reconcileExternalRequestors(
      Ticket ticketToSave,
      Set<TicketExternalRequestorDto> requestorDtos,
      LongFunction<Optional<ExternalRequestor>> newRequestorResolver) {

    Map<Long, TicketExternalRequestorDto> wanted = new HashMap<>();
    if (requestorDtos != null) {
      requestorDtos.forEach(dto -> wanted.putIfAbsent(dto.externalRequestorId(), dto));
    }

    Set<TicketExternalRequestor> associations = ticketToSave.getTicketExternalRequestors();
    associations.removeIf(
        association -> !wanted.containsKey(association.getExternalRequestor().getId()));
    // Each association left is wanted, so the remove below always finds its dto. Taking it out of
    // the map as we go leaves only the requestors the ticket doesn't have yet.
    associations.forEach(
        association ->
            association.setDateRequested(
                wanted.remove(association.getExternalRequestor().getId()).dateRequested()));

    wanted.forEach(
        (externalRequestorId, dto) ->
            newRequestorResolver
                .apply(externalRequestorId)
                .ifPresent(
                    externalRequestor ->
                        associations.add(
                            TicketExternalRequestor.builder()
                                .ticket(ticketToSave)
                                .externalRequestor(externalRequestor)
                                .dateRequested(dto.dateRequested())
                                .build())));
  }

  private void addStateToTicket(Ticket ticketToSave, Ticket existingTicket) {
    State stateToAdd = existingTicket.getState();
    if (stateToAdd != null) {
      Optional<State> existingState = stateRepository.findByLabel(stateToAdd.getLabel());
      if (existingState.isPresent()) {
        stateToAdd = existingState.get();
      }
    }
    ticketToSave.setState(stateToAdd);
  }

  private void addIterationToTicket(Ticket ticketToSave, Ticket existingTicket) {
    Iteration iterationToAdd = existingTicket.getIteration();
    Iteration ticketsExistingIteration = ticketToSave.getIteration();

    if (iterationToAdd == null) {
      ticketToSave.setIteration(null);
      return;
    }
    if (iterationToAdd.getName() != null
        && ticketsExistingIteration != null
        && iterationToAdd.getName().equals(ticketToSave.getIteration().getName())) {
      return;
    }

    if (iterationToAdd.getName() != null) {
      Optional<Iteration> existingIteration =
          iterationRepository.findByName(iterationToAdd.getName());
      existingIteration.ifPresent(ticketToSave::setIteration);
    }
  }

  private void addPriorityToTicket(Ticket ticketToSave, Ticket existingTicket) {
    PriorityBucket priorityBucketToAdd = existingTicket.getPriorityBucket();
    if (priorityBucketToAdd != null) {
      Optional<PriorityBucket> existingpriorityBucket =
          priorityBucketRepository.findByName(priorityBucketToAdd.getName());
      if (existingpriorityBucket.isPresent()) {
        priorityBucketToAdd = existingpriorityBucket.get();
      }
    }
    ticketToSave.setPriorityBucket(priorityBucketToAdd);
  }

  private void addAdditionalFieldToTicket(Ticket ticketToSave, TicketDto existingDto) {
    Set<AdditionalFieldValueDto> additionalFieldDtos = existingDto.getAdditionalFieldValues();
    Set<AdditionalFieldValue> existingAdditionalFields = ticketToSave.getAdditionalFieldValues();
    Set<AdditionalFieldValue> recievedAdditionalFieldValues =
        additionalFieldValueMapper.toEntities(additionalFieldDtos);

    if (existingAdditionalFields != null
        && existingAdditionalFields.equals(recievedAdditionalFieldValues)) {
      return;
    }

    if (additionalFieldDtos != null) {
      Set<AdditionalFieldValue> additionalFieldValues =
          generateAdditionalFields(additionalFieldDtos, ticketToSave);
      ticketToSave.getAdditionalFieldValues().clear();
      ticketToSave.getAdditionalFieldValues().addAll(additionalFieldValues);
    }
  }

  private void addComments(Ticket ticketToSave, Ticket existingTicket, boolean isNew) {
    if (existingTicket.getComments() != null) {
      ticketToSave.setComments(existingTicket.getComments());
      return;
    }
    if (isNew) {
      ticketToSave.getComments().clear();
    }
  }

  private void addSchedule(Ticket ticketToSave, Ticket existingTicket) {
    Schedule scheduleToAdd = existingTicket.getSchedule();
    if (scheduleToAdd == null) {
      ticketToSave.setSchedule(null);
      return;
    }

    Optional<Schedule> schedule = scheduleRepository.findByName(scheduleToAdd.getName());
    schedule.ifPresent(ticketToSave::setSchedule);
  }

  public void validateTicketState(Ticket ticket) {
    if (ticket != null
        && ticket.getState() != null
        && ticket.getState().getLabel().equalsIgnoreCase("Closed")) {
      throw new TicketStateClosedProblem("Ticket state is closed");
    }
  }

  @Transactional
  public TicketImportDto findByTitle(String title) {
    Ticket ticket = ticketRepository.findByTitle(title).orElseThrow();
    Hibernate.initialize(ticket.getAttachments());
    Hibernate.initialize(ticket.getComments());
    return ticketMapper.toImportDto(ticket);
  }

  @Transactional
  public Ticket createOrGetTicket(TicketMetadata ticketMetadata) {
    List<ResolvedExternalRequestor> resolvedRequestors = resolveExternalRequestors(ticketMetadata);
    List<Label> resolvedLabels = resolveLabels(ticketMetadata);

    List<String> requestorNames =
        ticketMetadata.getExternalRequestors() != null
            ? ticketMetadata.getExternalRequestors().stream()
                .map(ExternalRequestorRequest::name)
                .toList()
            : List.<String>of();

    List<Ticket> existing =
        ticketRepository.findTicketsByTitle(ticketMetadata.getName()).stream()
            .filter(
                t ->
                    requestorNames.isEmpty()
                        || requestorNames.stream()
                            .allMatch(
                                name ->
                                    t.getTicketExternalRequestors().stream()
                                        .anyMatch(
                                            ter ->
                                                ter.getExternalRequestor()
                                                    .getName()
                                                    .equalsIgnoreCase(name))))
            .toList();

    if (existing.isEmpty()) {
      return createNewTicket(ticketMetadata, resolvedRequestors, resolvedLabels);
    }

    for (Ticket ticket : existing) {
      if (TicketUtils.isTicketDuplicate(ticket)) continue;
      if (TicketUtils.isTicketClosed(ticket)) {
        logger.info("Reopening closed ticket: " + ticket.getTicketNumber());
        ticket.setState(stateRepository.findByLabel("Reopened").orElse(ticket.getState()));
      }
      applyMetadataUpdates(ticket, resolvedRequestors, resolvedLabels, ticketMetadata);
      Ticket saved = ticketRepository.save(ticket);
      initializeProducts(saved);
      return saved;
    }

    // All existing are closed or duplicate — create a new ticket
    return createNewTicket(ticketMetadata, resolvedRequestors, resolvedLabels);
  }

  private Ticket createNewTicket(
      TicketMetadata ticketMetadata,
      List<ResolvedExternalRequestor> resolvedRequestors,
      List<Label> resolvedLabels) {
    return createNewTicket(ticketMetadata, resolvedRequestors, resolvedLabels, null);
  }

  /**
   * Builds and persists a new ticket from caller-supplied metadata.
   *
   * @param artgIdForDedupe when non-null, stamps this value onto the ticket as its {@code ARTGID}
   *     additional field so subsequent {@link #createOrGetTicketsByArtgId} lookups can dedupe on
   *     it. Required whenever this is used for the ARTGID path — without it the new ticket would be
   *     invisible to the dedupe query that created it.
   */
  private Ticket createNewTicket(
      TicketMetadata ticketMetadata,
      List<ResolvedExternalRequestor> resolvedRequestors,
      List<Label> resolvedLabels,
      String artgIdForDedupe) {
    // A caller that composed the ticket resolved its state too — a reopened entry is not "To Do".
    // Falls back to "To Do" for a caller that supplied no state, which is every caller that submits
    // a bare identifier.
    State state = resolveStateOrDefault(ticketMetadata.getStateLabel(), "To Do");
    Ticket newTicket =
        Ticket.builder()
            .title(ticketMetadata.getName())
            // A new ticket describes the submission that asked for it, which is where these
            // details appeared before callers composed anything. The composed description is the
            // register's own and is what an automated run creates a ticket with.
            .description(newTicketDescription(ticketMetadata))
            .state(state)
            .build();
    if (resolvedLabels != null) {
      newTicket.setLabels(new HashSet<>(resolvedLabels));
    }
    TicketDto ticketDto = ticketMapper.toDto(newTicket);
    applyComposedContent(ticketDto, ticketMetadata);
    Set<TicketExternalRequestorDto> erDtos =
        resolvedRequestors.stream()
            .map(
                resolved -> {
                  ExternalRequestor er = resolved.externalRequestor();
                  return new TicketExternalRequestorDto(
                      er.getId(),
                      er.getName(),
                      er.getDescription(),
                      er.getDisplayColor(),
                      resolved.dateRequestedOrToday(businessZoneId));
                })
            .collect(Collectors.toSet());
    ticketDto.setExternalRequestors(erDtos);
    Set<AdditionalFieldValueDto> additionalFields =
        composedAdditionalFields(ticketMetadata.getAdditionalFields());
    if (artgIdForDedupe != null && !artgIdForDedupe.isBlank()) {
      // Merged, not replaced: the dedupe stamp must survive whatever else the caller derived, or
      // the new ticket is invisible to the lookup that created it. Prepended rather than appended,
      // because ARTGID leads the composed order and appending would move it to the end.
      additionalFields.removeIf(value -> ARTGID.equals(value.getAdditionalFieldType().getName()));
      Set<AdditionalFieldValueDto> ordered =
          new LinkedHashSet<>(artgIdAdditionalField(artgIdForDedupe));
      ordered.addAll(additionalFields);
      additionalFields = ordered;
    }
    if (!additionalFields.isEmpty()) {
      ticketDto.setAdditionalFieldValues(additionalFields);
    }
    return createTicketFromDto(ticketDto);
  }

  /**
   * Resolves a state by label, falling back to {@code defaultLabel} when the caller named none.
   *
   * <p>An unrecognised label falls back too rather than failing: the caller has already done the
   * work of composing a ticket, and refusing the whole ticket because one label does not match this
   * deployment's states would lose that work.
   */
  private State resolveStateOrDefault(String stateLabel, String defaultLabel) {
    if (stateLabel != null && !stateLabel.isBlank()) {
      Optional<State> named = stateRepository.findByLabel(stateLabel);
      if (named.isPresent()) {
        return named.get();
      }
      logger.warn(
          "Caller supplied unknown state label '"
              + stateLabel
              + "' — falling back to "
              + defaultLabel);
    }
    if (defaultLabel == null) {
      return null;
    }
    return stateRepository.findByLabel(defaultLabel).orElse(null);
  }

  /**
   * Applies the register-derived content a caller composed: schedule, priority bucket and the
   * register snapshot.
   *
   * <p>These arrive with the create so the ticket exists complete. Previously they could only be
   * patched in afterwards, which meant a second write and a window in which the ticket was missing
   * them. Each is applied only when supplied, so a caller submitting a bare identifier is
   * unaffected.
   */
  private void applyComposedContent(TicketDto ticketDto, TicketMetadata ticketMetadata) {
    // Name-only DTOs: addEntitysToTicket resolves the real Schedule and PriorityBucket from the
    // repository by name, the same way artgIdAdditionalField leaves the ARTGID type to be resolved.
    if (ticketMetadata.getSchedule() != null && !ticketMetadata.getSchedule().isBlank()) {
      ScheduleDto schedule = new ScheduleDto();
      schedule.setName(ticketMetadata.getSchedule());
      ticketDto.setSchedule(schedule);
    }
    if (ticketMetadata.getPriorityBucket() != null
        && !ticketMetadata.getPriorityBucket().isBlank()) {
      PriorityBucketDto bucket = new PriorityBucketDto();
      bucket.setName(ticketMetadata.getPriorityBucket());
      ticketDto.setPriorityBucket(bucket);
    }
    if (ticketMetadata.getRegisterSnapshot() != null) {
      JsonFieldDto snapshot = new JsonFieldDto();
      snapshot.setName(TicketMinimalDto.TGA_ENTRY_FIELD_NAME);
      snapshot.setValue(ticketMetadata.getRegisterSnapshot());
      ticketDto.setJsonFields(new HashSet<>(Set.of(snapshot)));
    }
  }

  /**
   * Builds the single {@code ARTGID} additional-field value for a new ticket. Only the type name is
   * set — {@link #generateAdditionalFields} resolves the real {@link AdditionalFieldType} from the
   * repository by that name.
   */
  private Set<AdditionalFieldValueDto> artgIdAdditionalField(String artgId) {
    AdditionalFieldTypeDto typeDto = new AdditionalFieldTypeDto();
    typeDto.setName(ARTGID);
    AdditionalFieldValueDto valueDto = new AdditionalFieldValueDto();
    valueDto.setAdditionalFieldType(typeDto);
    valueDto.setValueOf(artgId);
    return Set.of(valueDto);
  }

  @Transactional
  public List<Ticket> createOrGetTicketsByArtgId(TicketMetadata ticketMetadata) {
    if (ticketMetadata.getDedupeKey() == null || ticketMetadata.getDedupeKey().isBlank()) {
      throw new InvalidSearchProblem("dedupeKey is required for ARTGID-based ticket lookup");
    }
    try {
      List<ResolvedExternalRequestor> resolvedRequestors =
          resolveExternalRequestors(ticketMetadata);
      List<Label> resolvedLabels = resolveLabels(ticketMetadata);

      List<Ticket> tickets = findTicketsByDedupeKey(ticketMetadata.getDedupeKey());

      List<Ticket> result = new ArrayList<>();
      for (Ticket ticket : tickets) {
        if (TicketUtils.isTicketDuplicate(ticket)) continue;
        if (TicketUtils.isTicketClosed(ticket)) {
          logger.info("Reopening closed ticket: " + ticket.getTicketNumber());
          ticket.setState(stateRepository.findByLabel("Reopened").orElse(ticket.getState()));
        }
        applyMetadataUpdates(ticket, resolvedRequestors, resolvedLabels, ticketMetadata);
        Ticket saved = ticketRepository.save(ticket);
        initializeProducts(saved);
        result.add(saved);
      }

      if (result.isEmpty()) {
        // Nothing found — but "found nothing" is not safe to act on directly. Two callers
        // submitting the same ARTG ID concurrently can both reach here, and both create a ticket.
        // Claim the work atomically first: the loser re-reads and reuses the winner's ticket
        // rather than creating a duplicate.
        Optional<Ticket> claimed = claimOrAdoptArtgWork(ticketMetadata.getDedupeKey());
        if (claimed.isPresent()) {
          Ticket adopted = claimed.get();
          initializeProducts(adopted);
          result.add(adopted);
          return result;
        }

        // No open tickets — create a new one.
        //
        // When the caller supplied a ticket name it has already composed the ticket's content
        // (the Submission Gateway resolves the product name, description and labels before
        // calling), so build from that metadata directly. Calling out to Sergio here would
        // re-fetch the register entry, discard the caller's composed title in favour of Sergio's
        // template, and make this endpoint depend on the nightly batch processor being healthy.
        //
        // The name-absent path (currently Snomio's own "Bulk Add External Requesters", which
        // submits bare ARTG IDs) still delegates to Sergio, which composes content from the
        // register entry.
        Ticket newTicket =
            hasComposedContent(ticketMetadata)
                ? createNewTicket(
                    ticketMetadata,
                    resolvedRequestors,
                    resolvedLabels,
                    ticketMetadata.getDedupeKey())
                : composeViaSubmissionGateway(
                    Long.valueOf(ticketMetadata.getDedupeKey()),
                    resolvedRequestors,
                    resolvedLabels,
                    Optional.ofNullable(ticketMetadata.getResolvedDescription()));
        initializeProducts(newTicket);
        // Point the reservation at the ticket that won, so a concurrent caller that lost the race
        // can be handed this ticket instead of finding an empty claim.
        reservationRepository.recordTicket(
            WorkIdentityReservation.SCOPE_TICKETS,
            WorkIdentityReservation.TYPE_ARTG_TICKET,
            ticketMetadata.getDedupeKey(),
            newTicket.getId());
        result.add(newTicket);
      }
      return result;
    } catch (Exception e) {
      logger.error(
          "Failed to create or get tickets for dedupeKey: " + ticketMetadata.getDedupeKey(), e);
      throw e;
    }
  }

  /**
   * Claims the work of creating a ticket for {@code artgId}, or adopts the ticket another caller
   * already created for it.
   *
   * @return empty when this caller won the claim and should create the ticket; the existing ticket
   *     when another caller got there first
   */
  private Optional<Ticket> claimOrAdoptArtgWork(String artgId) {
    int claimed =
        reservationRepository.tryClaim(
            WorkIdentityReservation.SCOPE_TICKETS,
            WorkIdentityReservation.TYPE_ARTG_TICKET,
            artgId);
    if (claimed == 1) {
      return Optional.empty();
    }

    // Another caller holds the claim. It may not have finished creating yet, in which case there
    // is no ticket to adopt — fall through and create, accepting that the pre-existing
    // dedupe-by-ARTGID lookup remains the backstop for that narrow window.
    Optional<Long> winningTicketId =
        reservationRepository
            .findByScopeAndWorkTypeAndWorkKey(
                WorkIdentityReservation.SCOPE_TICKETS,
                WorkIdentityReservation.TYPE_ARTG_TICKET,
                artgId)
            .map(WorkIdentityReservation::getTicketId);
    if (winningTicketId.isEmpty()) {
      logger.info(
          "Work for ARTG ID "
              + artgId
              + " is claimed but its ticket is not recorded yet — proceeding");
      return Optional.empty();
    }
    logger.info(
        "Reusing ticket "
            + winningTicketId.get()
            + " for ARTG ID "
            + artgId
            + " — another caller already created it");
    return ticketRepository.findById(winningTicketId.get());
  }

  /**
   * True when the caller has composed the ticket's content itself and Snomio can persist it
   * directly, rather than asking Sergio to compose it from the register entry.
   */
  /**
   * The description a new ticket is created with: what the submission said about itself when a
   * person made it, otherwise the caller's composed description.
   */
  private static String newTicketDescription(TicketMetadata ticketMetadata) {
    String details = ticketMetadata.getSubmissionDetails();
    if (details != null && !details.isBlank()) {
      return details;
    }
    return ticketMetadata.getResolvedDescription();
  }

  /**
   * Files what a submission said about itself as a comment on a ticket that already exists.
   *
   * <p>An identical comment is not written twice. Each interactive submission differs — a different
   * person, a different business reason — so each is recorded, while a caller that resubmits
   * unchanged records it once rather than on every run.
   *
   * <p>Failing to file it does not fail the update: the ticket's content is written either way, and
   * losing that write because a comment could not be saved would be the worse outcome.
   */
  private void recordSubmissionDetails(Ticket ticket, TicketMetadata ticketMetadata) {
    String details = ticketMetadata.getSubmissionDetails();
    if (details == null || details.isBlank()) {
      return;
    }
    try {
      boolean alreadyRecorded =
          commentRepository.findByTicket_Id(ticket.getId()).stream()
              .anyMatch(comment -> details.equals(comment.getText()));
      if (!alreadyRecorded) {
        commentRepository.save(Comment.builder().ticket(ticket).text(details).build());
      }
    } catch (Exception e) {
      logger.error(
          "Could not record the submission details on ticket "
              + ticket.getId()
              + "; the ticket is still updated, but without the comment",
          e);
    }
  }

  private static boolean hasComposedContent(TicketMetadata ticketMetadata) {
    return ticketMetadata.getName() != null && !ticketMetadata.getName().isBlank();
  }

  /** Looks up tickets by ARTGID dedupe key, treating "none found" as an empty result. */
  private List<Ticket> findTicketsByDedupeKey(String dedupeKey) {
    try {
      return findByAdditionalFieldTypeValueOf(ARTGID, dedupeKey);
    } catch (ResourceNotFoundProblem ignored) {
      logger.debug("No ticket found with dedupeKey: " + dedupeKey);
      return new ArrayList<>();
    }
  }

  private List<ResolvedExternalRequestor> resolveExternalRequestors(TicketMetadata ticketMetadata) {
    if (ticketMetadata.getExternalRequestors() == null
        || ticketMetadata.getExternalRequestors().isEmpty()) {
      return new ArrayList<>();
    }
    return ticketMetadata.getExternalRequestors().stream()
        .map(
            request ->
                new ResolvedExternalRequestor(
                    externalRequestorRepository
                        .findByName(request.name())
                        .orElseThrow(
                            () ->
                                new ResourceNotFoundProblem(
                                    String.format(
                                        ErrorMessages.EXTERNAL_REQUESTOR_NAME_NOT_FOUND,
                                        request.name()))),
                    request.dateRequested()))
        .toList();
  }

  /**
   * An {@link ExternalRequestor} resolved from a request, paired with the date the caller said the
   * request was made. A null date means the caller did not supply one.
   */
  private record ResolvedExternalRequestor(
      ExternalRequestor externalRequestor, LocalDate dateRequested) {

    /**
     * @param zoneId the zone whose calendar day counts as today when the caller supplied no date
     */
    LocalDate dateRequestedOrToday(ZoneId zoneId) {
      return dateRequested != null ? dateRequested : LocalDate.now(zoneId);
    }
  }

  private List<Label> resolveLabels(TicketMetadata ticketMetadata) {
    if (ticketMetadata.getLabels() == null) {
      return null;
    }
    return ticketMetadata.getLabels().stream()
        .map(
            labelName ->
                labelRepository
                    .findByName(labelName)
                    .orElseThrow(
                        () ->
                            new ResourceNotFoundProblem(
                                String.format("Label '%s' not found", labelName))))
        .toList();
  }

  private void applyMetadataUpdates(
      Ticket ticket,
      List<ResolvedExternalRequestor> resolvedRequestors,
      List<Label> resolvedLabels,
      TicketMetadata ticketMetadata) {
    resolvedRequestors.forEach(
        resolved -> {
          ExternalRequestor requestor = resolved.externalRequestor();
          if (ticket.getTicketExternalRequestors().stream()
              .noneMatch(
                  ter ->
                      ter.getExternalRequestor().getName().equalsIgnoreCase(requestor.getName()))) {
            TicketExternalRequestor ter =
                TicketExternalRequestor.builder()
                    .ticket(ticket)
                    .externalRequestor(requestor)
                    .dateRequested(resolved.dateRequestedOrToday(businessZoneId))
                    .build();
            ticket.getTicketExternalRequestors().add(ter);
          }
        });
    if (resolvedLabels != null) {
      resolvedLabels.forEach(
          label -> {
            if (ticket.getLabels().stream()
                .noneMatch(l -> l.getName().equalsIgnoreCase(label.getName()))) {
              ticket.getLabels().add(label);
            }
          });
    }

    if (hasComposedContent(ticketMetadata)) {
      applyComposedUpdates(ticket, ticketMetadata);
      // The ticket already has a description, so a further submission's details are filed as a
      // comment rather than replacing it — the same place they appeared before callers composed.
      recordSubmissionDetails(ticket, ticketMetadata);
      return;
    }

    // Bare-identifier callers: the description is filed as a comment rather than replacing the
    // ticket's own. Unchanged, because such a caller has composed nothing and its description is an
    // addendum, not the ticket's content.
    String existingDescription = ticket.getDescription();
    String newDescription = ticketMetadata.getResolvedDescription();
    if (newDescription != null
        && (existingDescription == null || !existingDescription.contains(newDescription))) {

      Comment comment = Comment.builder().ticket(ticket).text(newDescription).build();
      commentRepository.save(comment);
    }
  }

  /**
   * Applies an update from a caller that composed the ticket's register-derived content.
   *
   * <p>Update is made symmetric with create: the same content the caller would have set on a new
   * ticket is set on an existing one. Previously an update could only ever add — so a label derived
   * from register content stayed on the ticket after the content stopped justifying it, and the
   * composed description was filed as a comment rather than becoming the description.
   *
   * <p>Title and description are replaced only when the caller says the register value behind them
   * changed. That protects a human edit from being restamped by a run triggered by some unrelated
   * register field, and keeps the ticket's audit trail free of identical rewrites.
   */
  private void applyComposedUpdates(Ticket ticket, TicketMetadata ticketMetadata) {
    if (ticketMetadata.getLabelsToRemove() != null) {
      ticketMetadata
          .getLabelsToRemove()
          .forEach(
              name -> ticket.getLabels().removeIf(label -> label.getName().equalsIgnoreCase(name)));
    }

    if (ticketMetadata.isTitleChanged() && ticketMetadata.getName() != null) {
      ticket.setTitle(ticketMetadata.getName());
    }
    if (ticketMetadata.isDescriptionChanged() && ticketMetadata.getResolvedDescription() != null) {
      ticket.setDescription(ticketMetadata.getResolvedDescription());
    }

    if (ticketMetadata.getStateLabel() != null && !ticketMetadata.getStateLabel().isBlank()) {
      State state = resolveStateOrDefault(ticketMetadata.getStateLabel(), null);
      if (state != null) {
        ticket.setState(state);
      }
    }
    if (ticketMetadata.getSchedule() != null && !ticketMetadata.getSchedule().isBlank()) {
      scheduleRepository.findByName(ticketMetadata.getSchedule()).ifPresent(ticket::setSchedule);
    }
    if (ticketMetadata.getPriorityBucket() != null
        && !ticketMetadata.getPriorityBucket().isBlank()) {
      priorityBucketRepository
          .findByName(ticketMetadata.getPriorityBucket())
          .ifPresent(ticket::setPriorityBucket);
    }

    applyRegisterSnapshot(ticket, ticketMetadata.getRegisterSnapshot());
    applyAdditionalFields(ticket, ticketMetadata.getAdditionalFields());
  }

  /**
   * Builds additional field values from names the caller supplied, leaving the real {@link
   * AdditionalFieldType} to be resolved from the repository by name.
   */
  private Set<AdditionalFieldValueDto> composedAdditionalFields(Map<String, String> supplied) {
    // Ordered: the caller composed these in a deliberate order and it is the order they display in.
    Set<AdditionalFieldValueDto> values = new LinkedHashSet<>();
    if (supplied == null) {
      return values;
    }
    supplied.forEach(
        (name, value) -> {
          if (value == null || value.isBlank()) {
            return;
          }
          AdditionalFieldTypeDto typeDto = new AdditionalFieldTypeDto();
          typeDto.setName(name);
          AdditionalFieldValueDto valueDto = new AdditionalFieldValueDto();
          valueDto.setAdditionalFieldType(typeDto);
          valueDto.setValueOf(value);
          values.add(valueDto);
        });
    return values;
  }

  /**
   * Applies register-derived additional field values to an existing ticket, replacing the value of
   * each named field and leaving fields the caller did not mention alone.
   *
   * <p>Leaving them alone matters: a ticket carries fields people set by hand alongside the ones
   * derived from the register, and an update that reconciled the whole set would erase them.
   */
  /**
   * A field value in the form the database holds it: a date-typed field is stored as an instant,
   * every other type verbatim.
   *
   * <p>Creation has always converted date values, but this path stored what the caller sent. A
   * caller composes dates for people to read — {@code 15/11/2024} — so a ticket updated through
   * here ended up holding a different format from one that was created, on the same field type, and
   * the interface could not read it. {@link InstantUtils#convert} accepts what is already an
   * instant, so applying this to a value that needs no conversion leaves it unchanged.
   */
  private String valueForStorage(AdditionalFieldType type, String value) {
    if (!Type.DATE.equals(type.getType())) {
      return value;
    }
    return InstantUtils.formatTimeToDb(
        value, InstantUtils.YYYY_MM_DD_T_HH_MM_SS_SSSXXX, businessZoneId);
  }

  private void applyAdditionalFields(Ticket ticket, Map<String, String> supplied) {
    if (supplied == null || supplied.isEmpty()) {
      return;
    }
    if (ticket.getAdditionalFieldValues() == null) {
      ticket.setAdditionalFieldValues(new LinkedHashSet<>());
    }
    supplied.forEach(
        (name, value) -> {
          if (value == null || value.isBlank()) {
            return;
          }
          additionalFieldTypeRepository
              .findByName(name)
              .ifPresent(
                  type -> {
                    String storedValue = valueForStorage(type, value);
                    Optional<AdditionalFieldValue> existing =
                        ticket.getAdditionalFieldValues().stream()
                            .filter(v -> v.getAdditionalFieldType().getName().equals(name))
                            .findFirst();
                    if (existing.isPresent()) {
                      existing.get().setValueOf(storedValue);
                      return;
                    }
                    AdditionalFieldValue created =
                        AdditionalFieldValue.builder()
                            .additionalFieldType(type)
                            .valueOf(storedValue)
                            .build();
                    created.getTickets().add(ticket);
                    ticket.getAdditionalFieldValues().add(created);
                  });
        });
  }

  /**
   * Records the register entry as the caller observed it, replacing any snapshot already held.
   *
   * <p>This is the field the next run compares against, so an update that changes the ticket's
   * content without rewriting it leaves the entry looking permanently changed: every subsequent run
   * would detect the same difference and update the same ticket again.
   */
  private void applyRegisterSnapshot(Ticket ticket, JsonNode registerSnapshot) {
    if (registerSnapshot == null) {
      return;
    }
    if (ticket.getJsonFields() == null) {
      ticket.setJsonFields(new HashSet<>());
    }
    Optional<JsonField> existing =
        ticket.getJsonFields().stream()
            .filter(field -> TicketMinimalDto.TGA_ENTRY_FIELD_NAME.equals(field.getName()))
            .findFirst();
    if (existing.isPresent()) {
      existing.get().setValue(registerSnapshot);
      return;
    }
    JsonField field = new JsonField();
    field.setName(TicketMinimalDto.TGA_ENTRY_FIELD_NAME);
    field.setValue(registerSnapshot);
    field.setTicket(ticket);
    ticket.getJsonFields().add(field);
  }

  private void initializeProducts(Ticket ticket) {
    if (ticket != null) {
      if (ticket.getProducts() != null) {
        ticket.getProducts().size(); // forces initialization safely inside TX
      }
      if (ticket.getAdditionalFieldValues() != null) {
        ticket.getAdditionalFieldValues().size(); // forces initialization safely inside TX
      }
      if (ticket.getLabels() != null) {
        ticket.getLabels().size(); // forces initialization safely inside TX
      }
    }
  }

  @Transactional
  public BulkAddExternalRequestorsResponse bulkAddExternalRequestors(
      BulkAddExternalRequestorsRequest request) {
    List<Ticket> updatedTickets = new ArrayList<>();
    List<Ticket> createdTickets = new ArrayList<>();
    List<String> skippedAdditionalFieldValues = new ArrayList<>();

    List<Ticket> tickets =
        ticketRepository.findByAdditionalFieldValueIds(
            request.getAdditionalFieldTypeName(), request.getFieldValues());
    List<ExternalRequestor> externalRequestors =
        externalRequestorRepository.findByNameIn(request.getExternalRequestors());

    if (request.getAdditionalFieldTypeName().equalsIgnoreCase(ARTGID)) {
      Set<String> newArtgIds =
          findNewAdditionalFieldValues(
              tickets, request.getFieldValues(), request.getAdditionalFieldTypeName());
      try {
        BulkProcessArtgIdsResult result = parallelizeProcessArtgId(newArtgIds, externalRequestors);
        createdTickets.addAll(result.getCreatedTickets());
        skippedAdditionalFieldValues.addAll(result.getFailedItems().keySet());
      } catch (InterruptedException e) {
        logger.error("Failed to process bulk add external requesters", e.getCause());
        Thread.currentThread().interrupt();
      } catch (ExecutionException e) {
        logger.error("Failed to process bulk add external requesters", e.getCause());
        throw new LingoProblem(
            "ticket-service", "ExecutionException occurred", HttpStatus.INTERNAL_SERVER_ERROR, e);
      }
    } else {
      Set<String> newAdditionalFieldValues =
          findNewAdditionalFieldValues(
              tickets, request.getFieldValues(), request.getAdditionalFieldTypeName());
      skippedAdditionalFieldValues.addAll(newAdditionalFieldValues);
    }

    for (Ticket ticket : tickets) {
      if (TicketUtils.isTicketDuplicate(ticket)) continue;
      externalRequestors.forEach(
          er -> {
            boolean alreadyLinked =
                ticket.getTicketExternalRequestors().stream()
                    .anyMatch(ter -> ter.getExternalRequestor().getId().equals(er.getId()));
            if (!alreadyLinked) {
              TicketExternalRequestor ter =
                  TicketExternalRequestor.builder().ticket(ticket).externalRequestor(er).build();
              ticket.getTicketExternalRequestors().add(ter);
            }
          });
      updatedTickets.add(ticketRepository.save(ticket));
    }

    return new BulkAddExternalRequestorsResponse(
        updatedTickets.stream().map(ticketMapper::toBacklogDto).toList(),
        createdTickets.stream().map(ticketMapper::toBacklogDto).toList(),
        skippedAdditionalFieldValues);
  }

  public BulkProcessArtgIdsResult parallelizeProcessArtgId(
      Set<String> newArtgIds, List<ExternalRequestor> externalRequestorList)
      throws InterruptedException, ExecutionException {

    Map<String, CompletableFuture<Ticket>> futureMap =
        newArtgIds.stream()
            .collect(
                Collectors.toMap(
                    artgId -> artgId, artgId -> processArtgIdAsync(artgId, externalRequestorList)));

    List<Ticket> createdTickets = new ArrayList<>();
    Map<String, Throwable> failedItems = new ConcurrentHashMap<>();

    for (Map.Entry<String, CompletableFuture<Ticket>> entry : futureMap.entrySet()) {
      try {
        Ticket ticket = entry.getValue().get();
        if (ticket != null) {
          createdTickets.add(ticket);
        }
      } catch (ExecutionException e) {
        failedItems.put(entry.getKey(), e.getCause());
      }
    }

    return new BulkProcessArtgIdsResult(createdTickets, failedItems);
  }

  @Async
  public CompletableFuture<Ticket> processArtgIdAsync(
      String artgId, List<ExternalRequestor> externalRequestorList) {
    // No caller-supplied dates on the bulk path — each association is stamped with the current
    // date.
    List<ResolvedExternalRequestor> resolved =
        externalRequestorList == null
            ? null
            : externalRequestorList.stream()
                .map(er -> new ResolvedExternalRequestor(er, null))
                .toList();
    return CompletableFuture.completedFuture(
        composeViaSubmissionGateway(Long.parseLong(artgId), resolved, null, Optional.empty()));
  }

  /**
   * Obtains composed content from the submission gateway and creates the ticket here.
   *
   * <p>Only where the content comes from changes. The ticket is still created by this application,
   * so the caller's requestors, labels and description addendum are merged exactly as they were —
   * the gateway composes register-derived content and knows nothing about them.
   */
  private Ticket composeViaSubmissionGateway(
      Long artgId,
      List<ResolvedExternalRequestor> externalRequestorList,
      List<Label> labels,
      Optional<String> ammendDescription) {

    TicketMetadata composed = submissionGatewayComposer.getComposedContent(artgId);

    // The addendum is appended rather than replacing the composed description, matching what the
    // feed-processor path did with it.
    if (ammendDescription.isPresent()
        && composed.getDescription() != null
        && !composed.getDescription().contains(ammendDescription.get())) {
      composed.setDescription(composed.getDescription() + "<br>" + ammendDescription.get());
    }

    // The composer's labels describe the register entry; the caller's describe why it was
    // submitted. A ticket needs both, so they are merged rather than one replacing the other.
    List<Label> mergedLabels = new ArrayList<>();
    if (labels != null) {
      mergedLabels.addAll(labels);
    }
    if (composed.getLabels() != null) {
      composed
          .getLabels()
          .forEach(
              name ->
                  labelRepository
                      .findByName(name)
                      .filter(
                          label ->
                              mergedLabels.stream()
                                  .noneMatch(l -> l.getName().equalsIgnoreCase(label.getName())))
                      .ifPresent(mergedLabels::add));
    }

    return createNewTicket(composed, externalRequestorList, mergedLabels, artgId.toString());
  }

  /** Ensures the DTO carries a non-null requestor set with any null entries dropped. */
  private void normaliseExternalRequestors(TicketDto ticketDto) {
    if (ticketDto.getExternalRequestors() == null) {
      ticketDto.setExternalRequestors(new HashSet<>());
    } else {
      ticketDto.getExternalRequestors().removeIf(Objects::isNull);
    }
  }

  /** Appends the addendum to the description unless it is already present. */
  private void appendDescription(TicketDto ticketDto, Optional<String> ammendDescription) {
    if (ammendDescription.isPresent()
        && !ticketDto.getDescription().contains(ammendDescription.get())) {
      ticketDto.setDescription(ticketDto.getDescription() + "<br>" + ammendDescription.get());
    }
  }

  /** Adds each resolved requestor to the DTO, skipping ones already associated. */
  private void mergeExternalRequestors(
      TicketDto ticketDto, List<ResolvedExternalRequestor> externalRequestorList) {
    if (externalRequestorList == null) {
      return;
    }
    for (ResolvedExternalRequestor resolved : externalRequestorList) {
      ExternalRequestor externalRequestor = resolved == null ? null : resolved.externalRequestor();
      if (externalRequestor == null || containsRequestor(ticketDto, externalRequestor.getId())) {
        continue;
      }
      ticketDto
          .getExternalRequestors()
          .add(
              new TicketExternalRequestorDto(
                  externalRequestor.getId(),
                  externalRequestor.getName(),
                  externalRequestor.getDescription(),
                  externalRequestor.getDisplayColor(),
                  resolved.dateRequestedOrToday(businessZoneId)));
    }
  }

  private boolean containsRequestor(TicketDto ticketDto, Long externalRequestorId) {
    return ticketDto.getExternalRequestors().stream()
        .map(TicketExternalRequestorDto::externalRequestorId)
        .anyMatch(id -> id.equals(externalRequestorId));
  }

  /** Adds each label to the DTO, skipping ones already applied. */
  private void mergeLabels(TicketDto ticketDto, List<Label> labels) {
    if (labels == null) {
      return;
    }
    if (ticketDto.getLabels() == null) {
      ticketDto.setLabels(new HashSet<>());
    } else {
      ticketDto.getLabels().removeIf(Objects::isNull);
    }
    for (Label label : labels) {
      if (label == null) {
        continue;
      }
      boolean alreadyApplied =
          ticketDto.getLabels().stream()
              .map(LabelDto::getId)
              .anyMatch(id -> id.equals(label.getId()));
      if (!alreadyApplied) {
        ticketDto.getLabels().add(labelMapper.toDto(label));
      }
    }
  }

  private Set<String> findNewAdditionalFieldValues(
      List<Ticket> tickets, List<String> fieldValues, String additionalFieldTypeName) {
    Set<String> existingFieldValuesInTickets =
        tickets.stream()
            .flatMap(t -> t.getAdditionalFieldValues().stream())
            .filter(f -> f.getAdditionalFieldType().getName().equals(additionalFieldTypeName))
            .map(f -> f.getValueOf())
            .collect(Collectors.toSet());
    Set<String> newFieldValues = new HashSet<>(fieldValues);
    newFieldValues.removeAll(existingFieldValuesInTickets);
    return newFieldValues;
  }

  @Transactional
  public TicketSubmissionResponse fetchTicketStatus(String ticketNumber) {
    Ticket ticket =
        ticketRepository
            .findByTicketNumber(ticketNumber)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_NUMBER_NOT_FOUND, ticketNumber)));

    initializeProducts(ticket);
    return new TicketSubmissionResponse(ticket);
  }

  public List<TicketMinimalDto> getTickets(List<String> ids) {
    return ticketRepository.findByIdList(ids.stream().map(Long::valueOf).toList()).stream()
        .map(ticketMapper::toMinimalDto)
        .toList();
  }

  @SuppressWarnings("java:S1192")
  @Transactional
  public TicketDto patchTicket(TicketDtoOptionals ticketDto, Long ticketId) {
    Ticket existingTicket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () -> new ResourceNotFoundProblem(ErrorMessages.TICKET_ID_NOT_FOUND + ticketId));

    // Update simple fields if they are present in the dto
    if (ticketDto.getTitle().isPresent()) {
      existingTicket.setTitle(ticketDto.getTitle().get());
    }
    if (ticketDto.getDescription().isPresent()) {
      existingTicket.setDescription(ticketDto.getDescription().get());
    }
    if (ticketDto.getAssignee().isPresent()) {
      existingTicket.setAssignee(ticketDto.getAssignee().get());
    }

    // Handle Iteration
    if (ticketDto.getIteration().isPresent()) {
      IterationDto iterationDto = ticketDto.getIteration().get();
      if (iterationDto != null) {
        existingTicket.setIteration(
            iterationRepository
                .findById(iterationDto.getId())
                .orElseThrow(() -> new ResourceNotFoundProblem("Iteration not found")));
      } else {
        existingTicket.setIteration(null);
      }
    }

    // Handle State
    if (ticketDto.getState().isPresent()) {
      StateDto stateDto = ticketDto.getState().get();
      if (stateDto != null) {
        existingTicket.setState(
            stateRepository
                .findById(stateDto.getId())
                .orElseThrow(() -> new ResourceNotFoundProblem("State not found")));
      } else {
        existingTicket.setState(null);
      }
    }

    // Handle PriorityBucket
    if (ticketDto.getPriorityBucket().isPresent()) {
      PriorityBucketDto priorityBucketDto = ticketDto.getPriorityBucket().get();
      if (priorityBucketDto != null) {
        existingTicket.setPriorityBucket(
            priorityBucketRepository
                .findById(priorityBucketDto.getId())
                .orElseThrow(() -> new ResourceNotFoundProblem("PriorityBucket not found")));
      } else {
        existingTicket.setPriorityBucket(null);
      }
    }

    // Handle Labels
    if (ticketDto.getLabels().isPresent()) {
      Set<LabelDto> labelDtos = ticketDto.getLabels().get();
      if (labelDtos == null || labelDtos.isEmpty()) {
        // If empty list or null is provided, clear all labels
        existingTicket.getLabels().clear();
      } else {
        // Replace all labels with the new ones
        Set<Label> newLabels =
            labelDtos.stream()
                .map(
                    labelDto ->
                        labelRepository
                            .findById(labelDto.getId())
                            .orElseThrow(
                                () ->
                                    new ResourceNotFoundProblem(
                                        "Label not found with id: " + labelDto.getId())))
                .collect(Collectors.toSet());

        existingTicket.getLabels().clear();
        existingTicket.getLabels().addAll(newLabels);
      }
    }

    // Handle External Requestors
    if (ticketDto.getExternalRequestors().isPresent()) {
      reconcileExternalRequestors(
          existingTicket,
          ticketDto.getExternalRequestors().get(),
          externalRequestorId ->
              Optional.of(
                  externalRequestorRepository
                      .findById(externalRequestorId)
                      .orElseThrow(
                          () ->
                              new ResourceNotFoundProblem(
                                  "ExternalRequestor not found with id: " + externalRequestorId))));
    }

    // Handle JSON Fields
    if (ticketDto.getJsonFields().isPresent()) {
      Set<JsonFieldDto> jsonFieldDtos = ticketDto.getJsonFields().get();
      if (jsonFieldDtos != null && !jsonFieldDtos.isEmpty()) {
        Map<String, JsonField> existingJsonFieldMap =
            existingTicket.getJsonFields().stream()
                .collect(Collectors.toMap(JsonField::getName, Function.identity()));

        Set<JsonField> updatedJsonFields =
            jsonFieldDtos.stream()
                .map(
                    jsonFieldDto -> {
                      JsonField jsonField = existingJsonFieldMap.get(jsonFieldDto.getName());
                      if (jsonField == null) {
                        // Create new JsonField if it doesn't exist
                        jsonField = new JsonField();
                        jsonField.setName(jsonFieldDto.getName());
                        jsonField.setTicket(existingTicket);
                      }
                      // Update the value (for both new and existing fields)
                      jsonField.setValue(jsonFieldDto.getValue());
                      return jsonField;
                    })
                .collect(Collectors.toSet());

        existingTicket.getJsonFields().clear();
        existingTicket.getJsonFields().addAll(updatedJsonFields);
      } else {
        existingTicket.getJsonFields().clear();
      }
    }

    // Handle Additional Field Values (this one wasn't wrapped in JsonNullable)
    if (ticketDto.getAdditionalFieldValues() != null
        && !ticketDto.getAdditionalFieldValues().isEmpty()) {
      Map<Long, AdditionalFieldValue> existingAFVMap =
          existingTicket.getAdditionalFieldValues().stream()
              .collect(
                  Collectors.toMap(
                      afv -> afv.getAdditionalFieldType().getId(), Function.identity()));

      Set<AdditionalFieldValue> newAFVs = new HashSet<>();

      for (AdditionalFieldValueDto afvDto : ticketDto.getAdditionalFieldValues()) {
        AdditionalFieldType type =
            additionalFieldTypeRepository
                .findById(afvDto.getAdditionalFieldType().getId())
                .orElseThrow(
                    () ->
                        new ResourceNotFoundProblem(
                            "AdditionalFieldType not found with id: "
                                + afvDto.getAdditionalFieldType().getId()));

        AdditionalFieldValue existingAFV = existingAFVMap.get(type.getId());

        if (existingAFV == null || !existingAFV.getValueOf().equals(afvDto.getValueOf())) {
          // Create new AdditionalFieldValue
          AdditionalFieldValue newAFV = new AdditionalFieldValue();
          newAFV.setAdditionalFieldType(type);
          if (type.getType().equals(Type.DATE)) {
            newAFV.setValueOf(
                InstantUtils.formatTimeToDb(
                    afvDto.getValueOf(),
                    InstantUtils.YYYY_MM_DD_T_HH_MM_SS_SSSXXX,
                    businessZoneId));
          } else {
            newAFV.setValueOf(afvDto.getValueOf());
          }

          newAFV = additionalFieldValueRepository.save(newAFV);
          newAFVs.add(newAFV);
        } else {
          // If the value hasn't changed, keep the existing one
          newAFVs.add(existingAFV);
        }
      }

      // Remove old values and add updated/new values
      existingTicket.getAdditionalFieldValues().clear();
      existingTicket.getAdditionalFieldValues().addAll(newAFVs);
    }

    return ticketMapper.toDto(ticketRepository.save(existingTicket));
  }
}
