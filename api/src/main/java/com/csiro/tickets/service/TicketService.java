package com.csiro.tickets.service;

import static com.csiro.tickets.models.mappers.TicketMapper.mapToExternalRequestor;
import static com.csiro.tickets.service.ExportService.NON_EXTERNAL_REQUESTERS;

import com.csiro.snomio.exception.*;
import com.csiro.snomio.service.SergioService;
import com.csiro.tickets.AdditionalFieldValueDto;
import com.csiro.tickets.JsonFieldDto;
import com.csiro.tickets.TicketMinimalDto;
import com.csiro.tickets.controllers.dto.BulkProductActionDto;
import com.csiro.tickets.controllers.dto.ProductDto;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.dto.TicketImportDto;
import com.csiro.tickets.helper.AttachmentUtils;
import com.csiro.tickets.helper.BaseUrlProvider;
import com.csiro.tickets.helper.InstantUtils;
import com.csiro.tickets.helper.OrderCondition;
import com.csiro.tickets.helper.PbsRequest;
import com.csiro.tickets.helper.PbsRequestResponse;
import com.csiro.tickets.helper.SafeUtils;
import com.csiro.tickets.helper.TicketUtils;
import com.csiro.tickets.models.*;
import com.csiro.tickets.models.AdditionalFieldType;
import com.csiro.tickets.models.AdditionalFieldType.Type;
import com.csiro.tickets.models.AdditionalFieldValue;
import com.csiro.tickets.models.Attachment;
import com.csiro.tickets.models.AttachmentType;
import com.csiro.tickets.models.BaseAuditableEntity;
import com.csiro.tickets.models.Comment;
import com.csiro.tickets.models.Iteration;
import com.csiro.tickets.models.JsonField;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.PriorityBucket;
import com.csiro.tickets.models.Product;
import com.csiro.tickets.models.Schedule;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketAssociation;
import com.csiro.tickets.models.TicketType;
import com.csiro.tickets.models.mappers.*;
import com.csiro.tickets.models.mappers.AdditionalFieldValueMapper;
import com.csiro.tickets.models.mappers.JsonFieldMapper;
import com.csiro.tickets.models.mappers.LabelMapper;
import com.csiro.tickets.models.mappers.ProductMapper;
import com.csiro.tickets.models.mappers.TicketMapper;
import com.csiro.tickets.repository.*;
import com.csiro.tickets.repository.AdditionalFieldTypeRepository;
import com.csiro.tickets.repository.AdditionalFieldValueRepository;
import com.csiro.tickets.repository.AttachmentRepository;
import com.csiro.tickets.repository.AttachmentTypeRepository;
import com.csiro.tickets.repository.CommentRepository;
import com.csiro.tickets.repository.IterationRepository;
import com.csiro.tickets.repository.JsonFieldRepository;
import com.csiro.tickets.repository.LabelRepository;
import com.csiro.tickets.repository.PriorityBucketRepository;
import com.csiro.tickets.repository.ProductRepository;
import com.csiro.tickets.repository.ScheduleRepository;
import com.csiro.tickets.repository.StateRepository;
import com.csiro.tickets.repository.TicketRepository;
import com.csiro.tickets.repository.TicketTypeRepository;
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
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.UnaryOperator;
import java.util.stream.Collectors;
import lombok.Getter;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

@Component
public class TicketService {

  private static final int ITEMS_TO_PROCESS = 60000;
  protected final Log logger = LogFactory.getLog(getClass());
  final TicketRepository ticketRepository;
  final AdditionalFieldTypeRepository additionalFieldTypeRepository;
  final AdditionalFieldValueRepository additionalFieldValueRepository;
  final StateRepository stateRepository;
  final AttachmentTypeRepository attachmentTypeRepository;
  final AttachmentRepository attachmentRepository;
  final TicketTypeRepository ticketTypeRepository;
  final ScheduleRepository scheduleRepository;
  final CommentRepository commentRepository;
  final LabelRepository labelRepository;

  final ExternalRequestorRepository externalRequestorRepository;

  final JsonFieldRepository jsonFieldRepository;
  final BaseUrlProvider baseUrlProvider;
  final IterationRepository iterationRepository;
  final PriorityBucketRepository priorityBucketRepository;
  final ProductRepository productRepository;
  private final BulkProductActionRepository bulkProductActionRepository;

  final TaskAssociationRepository taskAssociationRepository;

  final SergioService sergioService;

  @Value("${snomio.attachments.directory}")
  String attachmentsDirConfig;

  @Value("${snomio.import.allowed.directory}")
  private String allowedImportDirectory;

  @Getter private double importProgress = 0;

  @Autowired
  public TicketService(
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
      BaseUrlProvider baseUrlProvider,
      IterationRepository iterationRepository,
      PriorityBucketRepository priorityBucketRepository,
      ProductRepository productRepository,
      SergioService sergioService,
      JsonFieldRepository jsonFieldRepository,
      ExternalRequestorRepository externalRequestorRepository,
      BulkProductActionRepository bulkProductActionRepository,
      TaskAssociationRepository taskAssociationRepository) {

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
    this.baseUrlProvider = baseUrlProvider;
    this.iterationRepository = iterationRepository;
    this.priorityBucketRepository = priorityBucketRepository;
    this.productRepository = productRepository;
    this.jsonFieldRepository = jsonFieldRepository;
    this.sergioService = sergioService;
    this.externalRequestorRepository = externalRequestorRepository;
    this.taskAssociationRepository = taskAssociationRepository;
    this.bulkProductActionRepository = bulkProductActionRepository;
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

  public TicketDto findTicket(Long id) {
    return TicketMapper.mapToDTO(
        ticketRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, id))));
  }

  public Page<TicketDto> findAllTickets(Pageable pageable) {
    Page<Ticket> tickets = ticketRepository.findAll(pageable);
    return tickets.map(TicketMapper::mapToDTO);
  }

  public Page<TicketDto> findAllTicketsByQueryParam(
      Predicate predicate, Pageable pageable, OrderCondition orderCondition) {

    Page<Ticket> tickets;

    if (orderCondition != null) {
      tickets =
          ticketRepository.findAll(
              predicate,
              PageRequest.of(
                  pageable.getPageNumber(),
                  pageable.getPageSize(),
                  toSpringDataSort(orderCondition)));
    } else {
      tickets = ticketRepository.findAll(predicate, pageable);
    }

    return tickets.map(TicketMapper::mapToDTO);
  }

  public List<Ticket> findByAdditionalFieldTypeValueOf(
      String additionalFieldTypeName, String valueOf) {
    AdditionalFieldType additionalFieldType =
        additionalFieldTypeRepository
            .findByName(additionalFieldTypeName)
            .orElseThrow(() -> new ResourceNotFoundProblem("Could not find ARTGID type"));

    Optional<AdditionalFieldValue> additionalFieldValueOptional =
        additionalFieldValueRepository.findByValueOfAndTypeId(additionalFieldType, valueOf);

    if (additionalFieldValueOptional.isEmpty()) {
      return new ArrayList<>();
    }

    return ticketRepository.findByAdditionalFieldValueId(
        additionalFieldValueOptional.get().getId());
  }

  public List<TicketDto> findByAdditionalFieldTypeNameAndListValueOf(
      String additionalFieldTypeName, List<String> artgIds) {

    AdditionalFieldType additionalFieldType =
        additionalFieldTypeRepository
            .findByName(additionalFieldTypeName)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Could not find %s type", additionalFieldTypeName)));

    List<AdditionalFieldValue> afvs =
        additionalFieldValueRepository.findByValueOfInAndTypeId(additionalFieldType, artgIds);
    List<Long> afvIds = afvs.stream().map(AdditionalFieldValue::getId).toList();

    List<Ticket> tickets = ticketRepository.findByAdditionalFieldValueIds(afvIds);

    return tickets.stream().map(TicketMapper::mapToDTO).toList();
  }

  public void deleteTicket(Long ticketId) {
    Ticket ticket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));

    // Manually remove the TicketAssociation instances from the associated Ticket instances
    for (TicketAssociation association : ticket.getTicketSourceAssociations()) {
      association.getAssociationTarget().getTicketTargetAssociations().remove(association);
      association.setAssociationSource(null);
    }

    // Now you can safely delete the Ticket instance
    ticketRepository.delete(ticket);
  }

  public Ticket createTicketFromDto(TicketDto ticketDto) {

    Ticket fromTicketDto = TicketMapper.mapToEntity(ticketDto);
    Ticket newTicket = ticketRepository.save(new Ticket());
    newTicket.setBulkProductActions(new HashSet<>());
    return ticketRepository.save(addEntitysToTicket(newTicket, fromTicketDto, ticketDto, true));
  }

  public List<Ticket> bulkUpdateTickets(List<TicketDto> ticketDtos) {
    List<Ticket> updateTickets =
        ticketDtos.stream()
            .map(ticketDto -> updateTicketFieldsFromDto(ticketDto, ticketDto.getId()))
            .toList();

    return ticketRepository.saveAll(updateTickets);
  }

  public Ticket updateTicketFromDto(TicketDto ticketDto, Long ticketId) {
    return ticketRepository.save(updateTicketFieldsFromDto(ticketDto, ticketId));
  }

  public Ticket updateTicketFieldsFromDto(TicketDto ticketDto, Long ticketId) {
    final Ticket recievedTicket = TicketMapper.mapToEntity(ticketDto);
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
          AdditionalFieldValueMapper.mapToEntity(additionalFieldValueDto);

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
        Instant time = InstantUtils.convert(additionalFieldValue.getValueOf());
        if (time == null) {
          throw new DateFormatProblem(
              String.format("Incorrectly formatted date '%s'", additionalFieldValue.getValueOf()));
        }
        ZoneOffset zoneOffset = ZoneOffset.ofHours(10);
        ZonedDateTime zonedDateTime = time.atZone(zoneOffset);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
        String formattedTime = zonedDateTime.format(formatter);
        additionalFieldValue.setValueOf(formattedTime);
      }

      // ensure we don't end up with duplicate ARTGID's
      // is there a better way to handle this? open to any suggestions.
      // this is pretty 'us' specific code
      Optional<AdditionalFieldValue> afvOptional = Optional.empty();
      if (additionalFieldType.getName().equals("ARTGID")) {
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
        additionalFieldValue.setTickets(List.of(ticketToSave));
        additionalFieldValues.add(additionalFieldValue);
      }
    }
  }

  @Transactional
  public int importTickets(
      com.csiro.tickets.controllers.dto.TicketImportDto[] importDtos, int startAt, int size) {

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
       * From here we copy everything from the DTO to newTicketToSave and make sure we use
       * exsiging entities from the database for the appropriate fields.
       *
       * We also make sure that we don't add duplicated fields in the transaction and break
       * primary keys so we will use lookup maps from above for that
       *
       * We use batch processing to avoid Memory issues especially with H2 database
       *
       */
      List<Ticket> ticketsToSave = new ArrayList<>();
      logger.info("Start processing " + batchSize + " items from index " + currentIndex);
      for (int dtoIndex = currentIndex; dtoIndex < currentIndex + batchSize; dtoIndex++) {
        TicketImportDto dto = importDtos[dtoIndex];

        // separate  out labels and external requestors
        List<ExternalRequestor> externalRequestorList =
            dto.getLabels().stream()
                .filter(label -> !NON_EXTERNAL_REQUESTERS.contains(label.getName()))
                .map(l -> mapToExternalRequestor(l))
                .toList();
        List<Label> filteredLabels =
            dto.getLabels().stream()
                .filter(label -> NON_EXTERNAL_REQUESTERS.contains(label.getName()))
                .toList();
        dto.setExternalRequestors(externalRequestorList);
        dto.setLabels(filteredLabels);

        // Load the Ticket to be added.
        // Unfortunately we can't just have this, we have to process it
        // and sort out for existing/duplcated data

        Ticket newTicketToAdd = TicketMapper.mapToEntityFromImportDto(dto);

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
        newTicketToSave.setLabels(
            processLabels(labelsToSave, labels, newTicketToAdd, newTicketToSave));
        newTicketToSave.setExternalRequestors(
            processExternalRequestors(
                externalRequestorsToSave, externalRequestors, newTicketToAdd, newTicketToSave));

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
  private List<Label> processLabels(
      Map<String, Label> labelsToSave,
      Map<String, Label> labels,
      Ticket newTicketToAdd,
      Ticket newTicketToSave) {
    List<Label> theLabels = newTicketToAdd.getLabels();
    List<Label> labelsToAdd = new ArrayList<>();
    for (int i = 0; i < theLabels.size(); i++) {
      Label label = theLabels.get(i);
      String labelToAdd = label.getName();
      // Check if the fieldType is already saved in the DB
      if (labels.containsKey(labelToAdd)) {
        Label existingLabel = labels.get(labelToAdd);
        List<Ticket> existingTickets = new ArrayList<>(existingLabel.getTicket());
        existingTickets.add(newTicketToSave);
        existingLabel.setTicket(existingTickets);
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
                  .ticket(new ArrayList<>())
                  .build();
          newLabel.getTicket().add(newTicketToSave);
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
  private List<ExternalRequestor> processExternalRequestors(
      Map<String, ExternalRequestor> externalRequestorsToSave,
      Map<String, ExternalRequestor> externalRequestors,
      Ticket newTicketToAdd,
      Ticket newTicketToSave) {
    List<ExternalRequestor> theExternalRequestors = newTicketToAdd.getExternalRequestors();
    List<ExternalRequestor> externalRequestorsToAdd = new ArrayList<>();
    for (int i = 0; i < theExternalRequestors.size(); i++) {
      ExternalRequestor externalRequestor = theExternalRequestors.get(i);
      String externalRequestorToAdd = externalRequestor.getName();
      // Check if the fieldType is already saved in the DB
      if (externalRequestors.containsKey(externalRequestorToAdd)) {
        ExternalRequestor existingExternalRequestor =
            externalRequestors.get(externalRequestorToAdd);
        List<Ticket> existingTickets = new ArrayList<>(existingExternalRequestor.getTicket());
        existingTickets.add(newTicketToSave);
        existingExternalRequestor.setTicket(existingTickets);
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
                  .ticket(new ArrayList<>())
                  .build();
          newExternalRequestor.getTicket().add(newTicketToSave);
          externalRequestorsToSave.put(externalRequestorToAdd, newExternalRequestor);
          externalRequestorsToAdd.add(newExternalRequestor);
        }
      }
    }
    externalRequestorRepository.saveAll(externalRequestorsToAdd);
    return externalRequestorsToAdd;
  }

  /*
   *  Deal with AdditionFieldTypeValues, it a bit complicated...
   *  The way it works:
   *    - We have preloaded lookup maps additionalFieldTypes and additionalFieldTypeValues
   *      that contain all AdditionalFieldType and AdditionalFieldTypeValue existing in the DB
   *      We need this because Database lookup is very slow and encountered with locks that
   *      stalled the database queries
   *    - We also have additionalFieldTypesToSave and additionalFieldTypeValuesToSave that
   *      contain all AdditionalFieldType and AdditionalFieldTypeValue existing in the current
   *      Transaction. These are to avoid to add duplicated values and types that would cause
   *      the primary key violations
   *    - If the Field type and the value exists in the DB, do not add it use the
   *      existing Value and field type from the database
   *    - If the Field Type exists in the database but not the value, use the existing
   *      Field Type from DB, add the new value and record the new value for the Transaction
   *      for lookup later
   *    - If a field type doesn't exist in the database:
   *        - If the Field type and the Value exists in the current Transaction
   *          use that, do not add a new field type to avoid primary key violation
   *        - If a field type exists but not the value in the transaction use the field type
   *          void adding it twice and getting primary key violation, add new value
   *          and record the new value for the Transaction for lookup
   *    - If it's a new Field Type Add the value and the field type and record both
   *      for the transaction
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
      } catch (IOException | NoSuchAlgorithmException e) {
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
    Ticket ticketToUpdate =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));

    Optional<BulkProductAction> bulkProductActionOptional =
        bulkProductActionRepository.findByNameAndTicketId(dto.getName(), ticketId);

    BulkProductAction bulkProductAction;
    if (bulkProductActionOptional.isPresent()) {
      bulkProductAction = bulkProductActionOptional.get();
      if (bulkProductAction.getConceptIds() == null || !dto.getConceptIds().isEmpty()) {
        bulkProductAction.setConceptIds(
            dto.getConceptIds().stream().map(Long::valueOf).collect(Collectors.toSet()));
      }
      bulkProductAction.setDetails(dto.getDetails());
    } else {
      bulkProductAction = BulkProductActionMapper.mapToEntity(dto, ticketToUpdate);
    }

    if (ticketToUpdate.getBulkProductActions() == null) {
      ticketToUpdate.setBulkProductActions(new HashSet<>());
    }

    ticketToUpdate.getBulkProductActions().add(bulkProductAction);

    bulkProductActionRepository.save(bulkProductAction);
    ticketRepository.save(ticketToUpdate);
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
      product = ProductMapper.mapToEntity(productDto, ticketToUpdate);
    }

    if (ticketToUpdate.getProducts() == null) {
      ticketToUpdate.setProducts(new HashSet<>());
    }

    ticketToUpdate.getProducts().add(product);

    productRepository.save(product);
    ticketRepository.save(ticketToUpdate);
  }

  public Set<ProductDto> getProductsForTicket(Long ticketId) {
    return productRepository.findByTicketId(ticketId).stream()
        .map(ProductMapper::mapToDto)
        .collect(Collectors.toSet());
  }

  public Set<BulkProductActionDto> getBulkProductActionForTicket(Long ticketId) {
    return bulkProductActionRepository.findByTicketId(ticketId).stream()
        .map(BulkProductActionMapper::mapToDto)
        .collect(Collectors.toSet());
  }

  public ProductDto getProductByName(Long ticketId, String productName) {
    if (ticketRepository.findById(ticketId).isEmpty()) {
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));
    }
    Product product =
        productRepository
            .findByNameAndTicketId(productName, ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        "Product '" + productName + "' not found for ticket " + ticketId));

    return ProductMapper.mapToDto(product);
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

    return BulkProductActionMapper.mapToDto(bulkProductAction);
  }

  public void deleteProduct(@NotNull Long ticketId, @NotNull @NotEmpty String name) {
    Ticket ticketToUpdate =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));

    Product product =
        productRepository
            .findByNameAndTicketId(name, ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        "Product '" + name + "' not found for ticket " + ticketId));

    ticketToUpdate.getProducts().remove(product);
    ticketRepository.save(ticketToUpdate);
    productRepository.delete(product);
  }

  public void deleteProduct(Long ticketId, Long id) {
    Ticket ticketToUpdate =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));

    Product product =
        productRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        "Product '" + id + "' not found for ticket " + ticketId));

    ticketToUpdate.getProducts().remove(product);
    ticketRepository.save(ticketToUpdate);
    productRepository.delete(product);
  }

  public ProductDto getProductById(Long ticketId, Long id) {
    if (ticketRepository.findById(ticketId).isEmpty()) {
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));
    }
    Product product =
        productRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        "Product '" + id + "' not found for ticket " + ticketId));

    return ProductMapper.mapToDto(product);
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
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        "Bulk product action '" + name + "' not found for ticket " + ticketId));

    ticketToUpdate.getBulkProductActions().remove(bulkProductAction);
    ticketRepository.save(ticketToUpdate);
    bulkProductActionRepository.delete(bulkProductAction);
  }

  @Transactional
  public Ticket addEntitysToTicket(
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

    addProductToTicket(ticketToCopyTo, dto, isNew);

    addAdditionalFieldToTicket(ticketToCopyTo, dto);

    addSchedule(ticketToCopyTo, ticketToCopyFrom);

    addJsonFields(ticketToCopyTo, dto, isNew);

    addTicketAssociations(ticketToCopyTo, dto, isNew);

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

  private void addTicketAssociations(Ticket ticketToSave, TicketDto dto, boolean isNew) {
    boolean nullSource =
        ticketToSave.getTicketSourceAssociations() == null
            && dto.getTicketSourceAssociations() == null
            && isNew;
    boolean nullTarget =
        ticketToSave.getTicketTargetAssociations() == null
            && dto.getTicketTargetAssociations() == null
            && isNew;
    if (nullSource) {
      ticketToSave.setTicketSourceAssociations(new ArrayList<>());
    }
    if (nullTarget) {
      ticketToSave.setTicketTargetAssociations(new ArrayList<>());
    }
  }

  private void addJsonFields(Ticket ticketToSave, TicketDto dto, boolean isNew) {
    if (ticketToSave.getJsonFields() == null && dto.getJsonFields() == null && isNew) {
      ticketToSave.setJsonFields(new ArrayList<>());
      return;
    }

    List<JsonFieldDto> jsonFieldDtos = dto.getJsonFields();
    if (jsonFieldDtos != null) {
      List<JsonField> jsonFields = getJsonFields(ticketToSave, jsonFieldDtos);
      ticketToSave.setJsonFields(jsonFields);
    }
  }

  private List<JsonField> getJsonFields(Ticket ticketToSave, List<JsonFieldDto> jsonFieldDtos) {
    List<JsonField> jsonFields =
        ticketToSave.getJsonFields() != null ? ticketToSave.getJsonFields() : new ArrayList<>();
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
        JsonField jsonField = JsonFieldMapper.mapToEntity(jsonFieldDto);
        jsonField.setTicket(ticketToSave);
        jsonFields.add(jsonField);
      }
    }
    return jsonFields;
  }

  private void addLabelsToTicket(Ticket ticketToSave, Ticket dto) {

    if (dto.getLabels() == null) {
      ticketToSave.setLabels(new ArrayList<>());
      return;
    }

    // we want it to have whatever is in the dto, nothing more nothing less

    ticketToSave.setLabels(new ArrayList<>());

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

  private void addExternalRequestorsToTicket(Ticket ticketToSave, Ticket dto) {
    if (dto.getExternalRequestors() == null) {
      ticketToSave.setExternalRequestors(new ArrayList<>());
    }
    // we want it to have whatever is in the dto, nothing more nothing less
    if (dto.getExternalRequestors() != null) {
      ticketToSave.setExternalRequestors(new ArrayList<>());
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

  private void addProductToTicket(Ticket ticketToSave, TicketDto existingDto, boolean isNew) {
    if (ticketToSave.getProducts() == null && existingDto.getProducts() == null && isNew) {
      ticketToSave.setProducts(new HashSet<>());
    }
  }

  private void addAdditionalFieldToTicket(Ticket ticketToSave, TicketDto existingDto) {
    Set<AdditionalFieldValueDto> additionalFieldDtos = existingDto.getAdditionalFieldValues();
    Set<AdditionalFieldValue> existingAdditionalFields = ticketToSave.getAdditionalFieldValues();
    Set<AdditionalFieldValue> recievedAdditionalFieldValues =
        AdditionalFieldValueMapper.mapToEntity(additionalFieldDtos);

    if (existingAdditionalFields != null
        && existingAdditionalFields.equals(recievedAdditionalFieldValues)) {
      return;
    }

    if (additionalFieldDtos != null) {
      Set<AdditionalFieldValue> additionalFieldValues =
          generateAdditionalFields(additionalFieldDtos, ticketToSave);
      ticketToSave.setAdditionalFieldValues(additionalFieldValues);
    }
  }

  private void addComments(Ticket ticketToSave, Ticket existingTicket, boolean isNew) {
    if (existingTicket.getComments() != null) {
      ticketToSave.setComments(existingTicket.getComments());
      return;
    }
    if (isNew) {
      ticketToSave.setComments(new ArrayList<>());
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

  public Ticket createPbsRequest(PbsRequest pbsRequest) {
    // first attempt to find a ticket by the artgid

    List<Ticket> tickets =
        findByAdditionalFieldTypeValueOf("ARTGID", pbsRequest.getArtgid().toString());

    Label pbsLabel =
        labelRepository
            .findByName("PBS")
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.LABEL_NAME_NOT_FOUND, "PBS")));

    // if empty, and supplied an artgid, call sergio and get it to create a ticket from an artgid
    if (tickets.isEmpty() && pbsRequest.getArtgid() != null) {
      TicketMinimalDto ticketMinimalDto =
          sergioService.getTicketByArtgEntryId(pbsRequest.getArtgid());
      if (ticketMinimalDto.getLabels() == null) {
        ticketMinimalDto.setLabels(new ArrayList<>());
      }
      ticketMinimalDto.getLabels().add(LabelMapper.mapToDTO(pbsLabel));
      return createTicketFromDto(TicketMapper.mapToDtoFromMinimal(ticketMinimalDto));
    }

    // if not found, create new
    if (tickets.isEmpty()) {

      Ticket newlyCreatedPbsTicket =
          Ticket.builder()
              .title(pbsRequest.getName())
              .description(pbsRequest.createDescriptionMarkup())
              .build();

      newlyCreatedPbsTicket.setLabels(new ArrayList<>());
      newlyCreatedPbsTicket.getLabels().add(pbsLabel);

      return createTicketFromDto(TicketMapper.mapToDTO(newlyCreatedPbsTicket));
    }

    // if found, update

    for (Ticket ticket : tickets) {
      if (TicketUtils.isTicketDuplicate(ticket)) continue;
      if (!ticket.getLabels().contains(pbsLabel)) {
        ticket.getLabels().add(pbsLabel);
      }

      if (!ticket.getDescription().contains(pbsRequest.createDescriptionMarkup())) {
        ticket.setDescription(ticket.getDescription() + pbsRequest.createDescriptionMarkup());
      }
      return ticketRepository.save(ticket);
    }

    return null;
  }

  public PbsRequestResponse getPbsStatus(Long ticketId) {
    Ticket ticket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Ticket with Id %s not found", ticketId)));

    Label pbsLabel =
        labelRepository
            .findByName("PBS")
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.LABEL_NAME_NOT_FOUND, "PBS")));

    if (!ticket.getLabels().contains(pbsLabel)) {
      throw new ResourceNotFoundProblem(
          String.format("No Ticket with Id %s is marked as a requested item.", ticketId));
    }

    return new PbsRequestResponse(ticket);
  }
}
