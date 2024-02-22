package com.csiro.tickets.service;

import com.csiro.snomio.exception.DateFormatProblem;
import com.csiro.snomio.exception.ErrorMessages;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.exception.TicketImportProblem;
import com.csiro.tickets.AdditionalFieldValueDto;
import com.csiro.tickets.controllers.dto.ProductDto;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.dto.TicketImportDto;
import com.csiro.tickets.helper.AttachmentUtils;
import com.csiro.tickets.helper.BaseUrlProvider;
import com.csiro.tickets.helper.InstantUtils;
import com.csiro.tickets.helper.OrderCondition;
import com.csiro.tickets.models.AdditionalFieldType;
import com.csiro.tickets.models.AdditionalFieldType.Type;
import com.csiro.tickets.models.AdditionalFieldValue;
import com.csiro.tickets.models.Attachment;
import com.csiro.tickets.models.AttachmentType;
import com.csiro.tickets.models.BaseAuditableEntity;
import com.csiro.tickets.models.Comment;
import com.csiro.tickets.models.Iteration;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.PriorityBucket;
import com.csiro.tickets.models.Product;
import com.csiro.tickets.models.Schedule;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import com.csiro.tickets.models.mappers.AdditionalFieldValueMapper;
import com.csiro.tickets.models.mappers.ProductMapper;
import com.csiro.tickets.models.mappers.TicketMapper;
import com.csiro.tickets.repository.AdditionalFieldTypeRepository;
import com.csiro.tickets.repository.AdditionalFieldValueRepository;
import com.csiro.tickets.repository.AttachmentRepository;
import com.csiro.tickets.repository.AttachmentTypeRepository;
import com.csiro.tickets.repository.CommentRepository;
import com.csiro.tickets.repository.IterationRepository;
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
  final BaseUrlProvider baseUrlProvider;
  final IterationRepository iterationRepository;
  final PriorityBucketRepository priorityBucketRepository;
  final ProductRepository productRepository;

  @Value("${snomio.attachments.directory}")
  String attachmentsDirConfig;

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
      ProductRepository productRepository) {
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
  }

  public TicketDto findTicket(Long id) {
    return TicketMapper.mapToDTO(
        ticketRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundProblem("Ticket not found with id " + id)));
  }

  public Page<TicketDto> findAllTickets(Pageable pageable) {
    Page<Ticket> tickets = ticketRepository.findAll(pageable);
    return tickets.map(TicketMapper::mapToDTO);
  }

  public Page<TicketDto> findAllTicketsByQueryParam(
      Predicate predicate, Pageable pageable, OrderCondition orderCondition) {

    //    Page<Ticket> tickets = ticketRepository.findAll(predicate, pageable, orderSpecifier);
    //
    //    return tickets.map(TicketDto::of);
    Page<Ticket> tickets;

    if (orderCondition != null) {
      tickets =
          (Page<Ticket>)
              ticketRepository.findAll(
                  predicate,
                  PageRequest.of(
                      pageable.getPageNumber(),
                      pageable.getPageSize(),
                      toSpringDataSort(orderCondition)));
    } else {
      tickets = (Page<Ticket>) ticketRepository.findAll(predicate, pageable);
    }

    return tickets.map(TicketMapper::mapToDTO);
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

  public TicketDto findByAdditionalFieldTypeValueOf(
      String additionalFieldTypeName, String valueOf) {
    AdditionalFieldType additionalFieldType =
        additionalFieldTypeRepository
            .findByName(additionalFieldTypeName)
            .orElseThrow(() -> new ResourceNotFoundProblem("Could not find ARTGID type"));
    AdditionalFieldValue additionalFieldValue =
        additionalFieldValueRepository
            .findByValueOfAndTypeId(additionalFieldType, valueOf)
            .orElseThrow(
                () -> new ResourceNotFoundProblem(String.format("ARTGID %s not found", valueOf)));

    Ticket ticket =
        ticketRepository
            .findByAdditionalFieldValueId(additionalFieldValue.getId())
            .orElseThrow(() -> new ResourceNotFoundProblem("Ticket not found."));

    return TicketMapper.mapToDTO(ticket);
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
            .orElseThrow(() -> new ResourceNotFoundProblem("Ticket not found with id " + ticketId));

    ticketRepository.delete(ticket);
  }

  // TODO: The dto has ID and created date and createdBy - These need to be implemented but in my
  // opinion that's an Update!
  public Ticket createTicketFromDto(TicketDto ticketDto) {

    Ticket fromTicketDto = TicketMapper.mapToEntity(ticketDto);
    Ticket newTicket = new Ticket();

    Ticket newTicketToSave = addEntitysToTicket(newTicket, fromTicketDto, ticketDto);
    return ticketRepository.save(newTicketToSave);
  }

  public Ticket addEntitysToTicket(
      Ticket ticketToSave, Ticket existingTicket, TicketDto existingDto) {
    // Generate ID
    ticketToSave.setTitle(existingTicket.getTitle());
    ticketToSave.setDescription(existingTicket.getDescription());
    ticketToSave.setAssignee(existingTicket.getAssignee());

    /*
     *  Deal with labels
     */

    ticketToSave.setLabels(new ArrayList<>());
    if (existingTicket.getLabels() != null) {
      existingTicket
          .getLabels()
          .forEach(
              label -> {
                Label labelToAdd = Label.of(label);
                Optional<Label> existingLabel = labelRepository.findByName(labelToAdd.getName());
                if (existingLabel.isPresent()) {
                  labelToAdd = existingLabel.get();
                }
                ticketToSave.getLabels().add(labelToAdd);
              });
    }
    /*
     *  Deal with State
     */
    State stateToAdd = existingTicket.getState();
    if (stateToAdd != null) {
      Optional<State> existingState = stateRepository.findByLabel(stateToAdd.getLabel());
      if (existingState.isPresent()) {
        stateToAdd = existingState.get();
      }
    }
    ticketToSave.setState(stateToAdd);
    /*
     *  Deal with TicketType
     */
    TicketType ticketTypeToAdd = existingTicket.getTicketType();
    if (ticketTypeToAdd != null) {
      Optional<TicketType> existingTicketType =
          ticketTypeRepository.findByName(ticketTypeToAdd.getName());
      if (existingTicketType.isPresent()) {
        ticketTypeToAdd = existingTicketType.get();
      }
    }
    ticketToSave.setTicketType(ticketTypeToAdd);
    /*
     *  Deal with Iteration
     */
    Iteration iterationToAdd = existingTicket.getIteration();
    if (iterationToAdd != null) {
      Optional<Iteration> existingIteration =
          iterationRepository.findByName(iterationToAdd.getName());
      if (existingIteration.isPresent()) {
        iterationToAdd = existingIteration.get();
      }
    }
    ticketToSave.setIteration(iterationToAdd);
    /*
     *  Deal with PriorityBucket
     */
    PriorityBucket priorityBucketToAdd = existingTicket.getPriorityBucket();
    if (priorityBucketToAdd != null) {
      Optional<PriorityBucket> existingpriorityBucket =
          priorityBucketRepository.findByName(priorityBucketToAdd.getName());
      if (existingpriorityBucket.isPresent()) {
        priorityBucketToAdd = existingpriorityBucket.get();
      }
    }
    ticketToSave.setPriorityBucket(priorityBucketToAdd);

    //     Comments
    if (existingTicket.getComments() != null) {
      ticketToSave.setComments(existingTicket.getComments());
    }

    Set<ProductDto> productDtos = existingDto.getProducts();
    if (productDtos != null) {
      Set<Product> products = new HashSet<>();
      for (ProductDto productDto : productDtos) {
        Product product = ProductMapper.mapToEntity(productDto, ticketToSave);
        products.add(product);
      }
      ticketToSave.setProducts(products);
    }

    Set<AdditionalFieldValueDto> additionalFieldDtos = existingDto.getAdditionalFieldValues();
    if (additionalFieldDtos != null) {
      Set<AdditionalFieldValue> additionalFieldValues =
          generateAdditionalFields(additionalFieldDtos, ticketToSave);
      ticketToSave.setAdditionalFieldValues(additionalFieldValues);
    }

    return ticketToSave;
  }

  public Ticket updateTicketFromDto(TicketDto ticketDto, Long ticketId) {
    final Ticket recievedTicket = TicketMapper.mapToEntity(ticketDto);
    final Ticket foundTicket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));

    return ticketRepository.save(addEntitysToTicket(foundTicket, recievedTicket, ticketDto));
  }

  public Set<AdditionalFieldValue> generateAdditionalFields(
      Set<AdditionalFieldValueDto> additionalFieldDtos, Ticket savedTicket) {
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
      // find the existing one
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
                String.format(
                    "Incorrectly formatted date '%s'", additionalFieldValue.getValueOf()));
          }
          additionalFieldValue.setValueOf(time.toString());
        }

        //         ensure we don't end up with duplicate ARTGID's
        //         is there a better way to handle this? open to any suggestions.
        //         this is pretty 'us' specific code
        Optional<AdditionalFieldValue> afvOptional = Optional.empty();
        if (additionalFieldType.getName().equals("ARTGID")) {
          afvOptional =
              additionalFieldValueRepository.findByValueOfAndTypeId(
                  additionalFieldType, additionalFieldValue.getValueOf());
        }

        if (afvOptional.isPresent()) {
          additionalFieldValues.add(afvOptional.get());
        } else {
          additionalFieldValue.setAdditionalFieldType(additionalFieldType);
          additionalFieldValue.setTickets(List.of(savedTicket));
          additionalFieldValues.add(additionalFieldValue);
        }
      }
    }

    return additionalFieldValues;
  }

  @Transactional
  public int importTickets(
      TicketImportDto[] importDtos, int startAt, int size, File importDirectory) {

    int currentIndex = startAt;
    int savedNumberOfTickets = 0;
    long startTime = System.currentTimeMillis();
    // We are saving in batch because of memory issues for both H2 and PostgreSQL
    int batchSize = ITEMS_TO_PROCESS;
    if (batchSize > size) {
      batchSize = size;
    }
    /*
     *  These are Maps for fields that need to be managed for primary key violation
     *  We can't add duplcate values for these fields
     */
    Map<String, Label> labelsToSave = new HashMap<>();
    Map<String, State> statesToSave = new HashMap<>();
    Map<String, AttachmentType> attachmentTypesToSave = new HashMap<>();
    Map<String, AdditionalFieldType> additionalFieldTypesToSave = new HashMap<>();
    Map<String, AdditionalFieldValue> additionalFieldTypeValuesToSave = new HashMap<>();
    Map<String, TicketType> ticketTypesToSave = new HashMap<>();
    Map<String, Schedule> schedulesToSave = new HashMap<>();
    while (currentIndex < startAt + size) {
      if (currentIndex + batchSize > startAt + size) {
        batchSize = (startAt + size) - currentIndex;
      }
      long batchStart = System.currentTimeMillis();
      // These are lookup Maps for the existing Entities in the database.
      // We use them for performance improvement and to avoid stalling queries
      // because of database locks
      logger.info("Start caching fields with relationships...");
      Map<String, Label> labels = preloadFields(Label::getName, labelRepository);
      Map<String, State> states = preloadFields(State::getLabel, stateRepository);
      Map<String, AttachmentType> attachmentTypes =
          preloadFields(AttachmentType::getMimeType, attachmentTypeRepository);
      Map<String, AdditionalFieldType> additionalFieldTypes =
          preloadFields(AdditionalFieldType::getName, additionalFieldTypeRepository);
      Map<String, TicketType> ticketTypes =
          preloadFields(TicketType::getName, ticketTypeRepository);
      Map<String, Schedule> schedules = preloadFields(Schedule::getName, scheduleRepository);
      // Existing Field Type Value lookup with keys that consists of field type + field type value
      Map<String, AdditionalFieldValue> additionalFieldTypeValues = new HashMap<>();

      logger.info(
          "Finished reading fields with relationships in "
              + (System.currentTimeMillis() - batchStart)
              + "ms");

      /*
       *  Here we go...
       *
       *  From here we copy everything from the DTO to newTicketToSave and
       *  make sure we use exsiging entities from the database for the
       *  appropriate fields.
       *
       *  We also make sure that we don't add duplicated fields in the
       *  transaction and break primary keys so we will use lookup maps
       *  from above for that
       *
       *  We use batch processing to avoid Memory issues especially
       *  with H2 database
       *
       */
      List<Ticket> ticketsToSave = new ArrayList<>();
      logger.info("Start processing " + batchSize + " items from index " + currentIndex);
      for (int dtoIndex = currentIndex; dtoIndex < currentIndex + batchSize; dtoIndex++) {
        TicketImportDto dto = importDtos[dtoIndex];

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
         *  Batch processing - add ticket to be saved later
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

  /*
   *  Deal with similar entities e.g Schedule, TicketType, State, etc
   *  that require looking up existing records in the database
   *  and using the existing records if they exist
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
   *  Deal with Labels
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
        // Check that the field type we want to add is already in the Transaction and that the value
        // we want to add is not in the transaction
        String valueAndType = additionalFieldValue.getValueOf() + fieldTypeToAdd;
        if (additionalFieldTypesToSave.containsKey(fieldTypeToAdd)) {
          AdditionalFieldType existingFieldTypeInTransaction =
              additionalFieldTypesToSave.get(fieldTypeToAdd);
          if (additionalFieldTypeValuesToSave.containsKey(valueAndType)) {
            // The combination exists Add existing type and value and do not create a new in the db
            // to avoid key collision
            fieldValueToAdd = additionalFieldTypeValuesToSave.get(valueAndType);
          } else {
            // The combination doesn't exist in the transaction add the Value and Existing type and
            // record new value
            // in lookup map
            fieldValueToAdd.setValueOf(additionalFieldValue.getValueOf());
            fieldValueToAdd.setAdditionalFieldType(existingFieldTypeInTransaction);
            additionalFieldTypeValuesToSave.put(valueAndType, fieldValueToAdd);
          }
        } else {
          // New Field Type Add both and record
          // Need an empty list here otherwise Hibernate doesn't populate the reverse relationship
          // back to the Value field
          additionalFieldTypeRepository.save(fieldType);
          fieldValueToAdd.setValueOf(additionalFieldValue.getValueOf());
          fieldValueToAdd.setAdditionalFieldType(fieldType);
          additionalFieldTypeValuesToSave.put(
              additionalFieldValue.getValueOf() + fieldTypeToAdd, fieldValueToAdd);
          additionalFieldTypesToSave.put(fieldTypeToAdd, fieldType);
        }
      } else {
        // Check if it's in the DB
        // Check that the value we want to add with the existing field type doesn't already exist
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
          // Need to save it again as it will be a new version with the new ticket added to the
          // relationship
          additionalFieldTypeValuesToSave.put(
              fieldTypeToAdd + additionalFieldValue.getValueOf(), fieldValueToAdd);
        }
      }
      additionalFieldValuesToAdd.add(fieldValueToAdd);
    }
    additionalFieldValueRepository.saveAll(additionalFieldValuesToAdd);
    return additionalFieldValuesToAdd;
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
   *  Deal with Attachments and AttachmentTypes
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
        // I've tested we can rely on Jira's SHA256 hashes that are provided in the import file
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
        e.printStackTrace();
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
   *  Batching the Save for H2 backend to avoid out of memory errors
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
    if (!originalFile.exists()) {
      throw new TicketImportProblem(
          "Original import file doesn't exist: " + originalFile.getAbsolutePath());
    } else if (!newFile.exists()) {
      throw new TicketImportProblem("New import file doesn't exist: " + newFile.getAbsolutePath());
    }
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

  public void putProductOnTicket(Long ticketId, ProductDto productDto) {
    Ticket ticketToUpdate =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundProblem("Ticket not found with id " + ticketId));

    Optional<Product> productOptional =
        productRepository.findByNameAndTicketId(productDto.getName(), ticketId);

    Product product;
    if (productOptional.isPresent()) {
      product = productOptional.get();
      if (product.getConceptId() == null || productDto.getConceptId() != null) {
        product.setConceptId(
            productDto.getConceptId() != null ? Long.valueOf(productDto.getConceptId()) : null);
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

  public ProductDto getProductByName(Long ticketId, String productName) {
    ticketRepository
        .findById(ticketId)
        .orElseThrow(() -> new ResourceNotFoundProblem("Ticket not found with id " + ticketId));

    Product product =
        productRepository
            .findByNameAndTicketId(productName, ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        "Product '" + productName + "' not found for ticket " + ticketId));

    return ProductMapper.mapToDto(product);
  }

  public void deleteProduct(@NotNull Long ticketId, @NotNull @NotEmpty String name) {
    Ticket ticketToUpdate =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundProblem("Ticket not found with id " + ticketId));

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
}
