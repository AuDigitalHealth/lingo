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
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.lingo.exception.TicketImportProblem;
import au.gov.digitalhealth.lingo.exception.TicketStateClosedProblem;
import au.gov.digitalhealth.lingo.service.SergioService;
import au.gov.digitalhealth.tickets.AdditionalFieldValueDto;
import au.gov.digitalhealth.tickets.ExternalRequesterDto;
import au.gov.digitalhealth.tickets.JsonFieldDto;
import au.gov.digitalhealth.tickets.LabelDto;
import au.gov.digitalhealth.tickets.TicketBacklogDto;
import au.gov.digitalhealth.tickets.TicketDto;
import au.gov.digitalhealth.tickets.TicketDtoExtended;
import au.gov.digitalhealth.tickets.TicketImportDto;
import au.gov.digitalhealth.tickets.TicketMinimalDto;
import au.gov.digitalhealth.tickets.controllers.BulkProductActionDto;
import au.gov.digitalhealth.tickets.controllers.ProductDto;
import au.gov.digitalhealth.tickets.helper.AttachmentUtils;
import au.gov.digitalhealth.tickets.helper.BulkAddExternalRequestorsRequest;
import au.gov.digitalhealth.tickets.helper.BulkAddExternalRequestorsResponse;
import au.gov.digitalhealth.tickets.helper.BulkProcessArtgIdsResult;
import au.gov.digitalhealth.tickets.helper.InstantUtils;
import au.gov.digitalhealth.tickets.helper.OrderCondition;
import au.gov.digitalhealth.tickets.helper.PbsRequest;
import au.gov.digitalhealth.tickets.helper.PbsRequestResponse;
import au.gov.digitalhealth.tickets.helper.SafeUtils;
import au.gov.digitalhealth.tickets.helper.SearchCondition;
import au.gov.digitalhealth.tickets.helper.TicketUtils;
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
import au.gov.digitalhealth.tickets.models.Schedule;
import au.gov.digitalhealth.tickets.models.State;
import au.gov.digitalhealth.tickets.models.TaskAssociation;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.models.TicketType;
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
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.querydsl.core.types.Predicate;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.*;
import java.util.function.Consumer;
import java.util.function.Function;
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
  private final SergioService sergioService;
  private final BulkProductActionRepository bulkProductActionRepository;
  private final TicketMapper ticketMapper;
  private final AdditionalFieldValueMapper additionalFieldValueMapper;
  private final ProductMapper productMapper;
  private final JsonFieldMapper jsonFieldMapper;
  private final BulkProductActionMapper bulkProductActionMapper;
  private final ExternalRequestorMapper externalRequestorMapper;

  private final AttachmentService attachmentService;

  @Value("${snomio.attachments.directory}")
  String attachmentsDirConfig;

  @Value("${snomio.import.allowed.directory}")
  private String allowedImportDirectory;

  @Getter private double importProgress = 0;

  @Autowired
  public TicketServiceImpl(
      TicketRepository ticketRepository,
      AdditionalFieldTypeRepository additionalFieldTypeRepository,
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
      SergioService sergioService,
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
      AttachmentService attachmentService) {
    this.ticketRepository = ticketRepository;
    this.additionalFieldTypeRepository = additionalFieldTypeRepository;
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
    this.sergioService = sergioService;
    this.externalRequestorRepository = externalRequestorRepository;
    this.ticketMapper = ticketMapper;
    this.additionalFieldValueMapper = additionalFieldValueMapper;
    this.productMapper = productMapper;
    this.jsonFieldMapper = jsonFieldMapper;
    this.bulkProductActionRepository = bulkProductActionRepository;
    this.bulkProductActionMapper = bulkProductActionMapper;
    this.externalRequestorMapper = externalRequestorMapper;
    this.attachmentService = attachmentService;
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
    return addEntitysToBacklogTicket(foundTicket, recievedTicket);
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
    Set<AdditionalFieldValue> additionalFieldValues = new HashSet<>();

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
                additionalFieldValue.getValueOf(), InstantUtils.YYYY_MM_DD_T_HH_MM_SS_SSSXXX));
      }

      // ensure we don't end up with duplicate ARTGID's
      // is there a better way to handle this? open to any suggestions.
      // this is pretty 'us' specific code
      Optional<AdditionalFieldValue> afvOptional = Optional.empty();
      if (additionalFieldType.getName().equals(ARTGID)) {
        afvOptional =
            additionalFieldValueRepository.findByValueOfAndTypeIdAndTicketId(
                additionalFieldType.getId(),
                additionalFieldValue.getValueOf(),
                ticketToSave.getId());
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
        newTicketToSave.setExternalRequestors(
            processExternalRequestors(
                externalRequestorsToSave, externalRequestors, newTicketToAdd));

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
      Ticket newTicketToAdd) {
    Set<ExternalRequestor> theExternalRequestors = newTicketToAdd.getExternalRequestors();
    Set<ExternalRequestor> externalRequestorsToAdd = new HashSet<>();
    for (ExternalRequestor externalRequestor : theExternalRequestors) {
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
    Set<AdditionalFieldValue> additionalFieldValuesToAdd = new HashSet<>();
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

  public void putProductOnTicket(Long ticketId, ProductDto productDto) {
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
      product.setPackageDetails(productDto.getPackageDetails());
    } else {
      product = productMapper.toEntity(productDto);
      product.setTicket(ticketToUpdate);
    }

    productRepository.save(product);
  }

  public Set<ProductDto> getProductsForTicket(Long ticketId) {
    return productRepository.findByTicketId(ticketId).stream()
        .map(productMapper::toDto)
        .collect(Collectors.toSet());
  }

  public Set<BulkProductActionDto> getBulkProductActionForTicket(Long ticketId) {
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

  public void deleteProduct(@NotNull Long ticketId, @NotNull @NotEmpty String name) {
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

  public void deleteProduct(Long ticketId, Long id) {
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

  private Ticket addEntitysToBacklogTicket(Ticket ticketToCopyTo, Ticket ticketToCopyFrom) {
    ticketToCopyTo.setTitle(ticketToCopyFrom.getTitle());

    ticketToCopyTo.setAssignee(ticketToCopyFrom.getAssignee());

    addLabelsToTicket(ticketToCopyTo, ticketToCopyFrom);
    addExternalRequestorsToTicket(ticketToCopyTo, ticketToCopyFrom);
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
    addExternalRequestorsToTicket(ticketToCopyTo, ticketToCopyFrom);
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

  private void addExternalRequestorsToTicket(Ticket ticketToSave, Ticket dto) {
    if (dto.getExternalRequestors() == null) {
      ticketToSave.getExternalRequestors().clear();
    }
    // we want it to have whatever is in the dto, nothing more nothing less
    if (dto.getExternalRequestors() != null) {
      ticketToSave.getExternalRequestors().clear();
      dto.getExternalRequestors()
          .forEach(
              externalRequestor -> {
                ExternalRequestor externalRequestorToAdd = ExternalRequestor.of(externalRequestor);
                Optional<ExternalRequestor> existingExternalRequestor =
                    externalRequestorRepository.findByName(externalRequestorToAdd.getName());
                if (existingExternalRequestor.isPresent()) {
                  externalRequestorToAdd = existingExternalRequestor.get();
                  ticketToSave.getExternalRequestors().add(externalRequestorToAdd);
                }
              });
    }
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
  public Ticket createPbsRequest(PbsRequest pbsRequest) {
    // first attempt to find a ticket by the artgid

    List<Ticket> tickets = new ArrayList<>();
    try {
      tickets = findByAdditionalFieldTypeValueOf(ARTGID, pbsRequest.getArtgid().toString());
    } catch (ResourceNotFoundProblem ignored) {
      logger.debug("No ticket found with ARTGID: " + pbsRequest.getArtgid());
    }

    ExternalRequestor externalRequestor =
        externalRequestorRepository
            .findByName("PBS")
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.EXTERNAL_REQUESTOR_NAME_NOT_FOUND, "PBS")));

    // if empty, and supplied an artgid, call sergio and get it to create a ticket from an artgid
    if (tickets.isEmpty() && pbsRequest.getArtgid() != null) {
      return processArtgId(pbsRequest.getArtgid(), List.of(externalRequestor));
    }

    // if not found, create new
    if (tickets.isEmpty()) {

      Ticket newlyCreatedPbsTicket =
          Ticket.builder()
              .title(pbsRequest.getName())
              .description(pbsRequest.createDescriptionMarkup())
              .build();

      newlyCreatedPbsTicket.setExternalRequestors(new HashSet<>());
      newlyCreatedPbsTicket.getExternalRequestors().add(externalRequestor);

      return createTicketFromDto(ticketMapper.toDto(newlyCreatedPbsTicket));
    }

    // if found, update

    for (Ticket ticket : tickets) {
      if (TicketUtils.isTicketDuplicate(ticket)) continue;
      ticket.getExternalRequestors().add(externalRequestor);

      if (!ticket.getDescription().contains(pbsRequest.createDescriptionMarkup())) {
        ticket.setDescription(ticket.getDescription() + pbsRequest.createDescriptionMarkup());
      }
      return ticketRepository.save(ticket);
    }

    return null;
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
          externalRequestor -> ticket.getExternalRequestors().add(externalRequestor));
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
    return CompletableFuture.completedFuture(
          processArtgId(Long.parseLong(artgId), externalRequestorList));
  }

  private Ticket processArtgId(Long artgId, List<ExternalRequestor> externalRequestorList) {
    TicketDto ticketDto = sergioService.getTicketByArtgEntryId(artgId);
    if (ticketDto == null) {
      throw new IllegalArgumentException("TicketDto is null for artgId: " + artgId);
    }
    if (ticketDto.getExternalRequestors() == null) {
      ticketDto.setExternalRequestors(new HashSet<>());
    }
    if (externalRequestorList != null) {
      externalRequestorList.forEach(
          externalRequestor -> {
            if (externalRequestor != null
                && ticketDto.getExternalRequestors().stream()
                    .map(ExternalRequesterDto::getId)
                    .noneMatch(id -> id.equals(externalRequestor.getId()))) {
              ticketDto
                  .getExternalRequestors()
                  .add(externalRequestorMapper.toDto(externalRequestor));
            }
          });
    }
    return createTicketFromDto(ticketDto);
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
  public PbsRequestResponse getPbsStatus(Long ticketId) {
    Ticket ticket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));

    ExternalRequestor pbsExternalRequestor =
        externalRequestorRepository
            .findByName("PBS")
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.EXTERNAL_REQUESTOR_NAME_NOT_FOUND, "PBS")));

    findTicket(ticketId).getExternalRequestors().stream()
        .filter(requestor -> requestor.getName().equals(pbsExternalRequestor.getName()))
        .findAny()
        .orElseThrow(
            () ->
                new ResourceNotFoundProblem(
                    String.format(
                        "No Ticket with Id %s is marked as a requested item.", ticketId)));

    return new PbsRequestResponse(ticket);
  }

  public List<TicketMinimalDto> getTickets(List<String> ids) {
    return ticketRepository.findByIdList(ids.stream().map(Long::valueOf).toList()).stream()
        .map(ticketMapper::toMinimalDto)
        .toList();
  }

  @SuppressWarnings("java:S1192")
  @Transactional
  public TicketDto patchTicket(TicketDto ticketDto, Long ticketId) {
    Ticket existingTicket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        ErrorMessages.TICKET_ID_NOT_FOUND + ticketDto.getId()));

    // update fields if they are present in the dto

    existingTicket.setTitle(ticketDto.getTitle());

    existingTicket.setDescription(ticketDto.getDescription());

    existingTicket.setAssignee(ticketDto.getAssignee());

    if (ticketDto.getIteration() != null) {
      existingTicket.setIteration(
          iterationRepository
              .findById(ticketDto.getIteration().getId())
              .orElseThrow(() -> new ResourceNotFoundProblem("Iteration not found")));
    }

    if (ticketDto.getState() != null) {
      existingTicket.setState(
          stateRepository
              .findById(ticketDto.getState().getId())
              .orElseThrow(() -> new ResourceNotFoundProblem("Iteration not found")));
    }

    if (ticketDto.getPriorityBucket() != null) {
      existingTicket.setPriorityBucket(
          priorityBucketRepository
              .findById(ticketDto.getPriorityBucket().getId())
              .orElseThrow(() -> new ResourceNotFoundProblem("Iteration not found")));
    }

    // labels
    if (ticketDto.getLabels() != null && !ticketDto.getLabels().isEmpty()) {
      Set<Label> newLabels =
          ticketDto.getLabels().stream()
              .map(
                  labelDto ->
                      labelRepository
                          .findById(labelDto.getId())
                          .orElseThrow(
                              () ->
                                  new ResourceNotFoundProblem(
                                      "Label not found with id: " + labelDto.getId())))
              .collect(Collectors.toSet());
      existingTicket.getLabels().addAll(newLabels);
    }

    // External Requestors
    if (ticketDto.getExternalRequestors() != null && !ticketDto.getExternalRequestors().isEmpty()) {
      Set<ExternalRequestor> newRequestors =
          ticketDto.getExternalRequestors().stream()
              .map(
                  requestorDto ->
                      externalRequestorRepository
                          .findById(requestorDto.getId())
                          .orElseThrow(
                              () ->
                                  new ResourceNotFoundProblem(
                                      "ExternalRequestor not found with id: "
                                          + requestorDto.getId())))
              .collect(Collectors.toSet());
      existingTicket.getExternalRequestors().addAll(newRequestors);
    }

    // JSON Fields
    if (ticketDto.getJsonFields() != null && !ticketDto.getJsonFields().isEmpty()) {
      Map<String, JsonField> existingJsonFieldMap =
          existingTicket.getJsonFields().stream()
              .collect(Collectors.toMap(JsonField::getName, Function.identity()));

      Set<JsonField> updatedJsonFields =
          ticketDto.getJsonFields().stream()
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
    }

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
                    afvDto.getValueOf(), InstantUtils.YYYY_MM_DD_T_HH_MM_SS_SSSXXX));
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
