package com.csiro.tickets.service;

import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.exception.TicketImportProblem;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.dto.TicketImportDto;
import com.csiro.tickets.helper.BaseUrlProvider;
import com.csiro.tickets.models.AdditionalFieldType;
import com.csiro.tickets.models.AdditionalFieldValue;
import com.csiro.tickets.models.Attachment;
import com.csiro.tickets.models.AttachmentType;
import com.csiro.tickets.models.Comment;
import com.csiro.tickets.models.Iteration;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.PriorityBucket;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import com.csiro.tickets.repository.AdditionalFieldTypeRepository;
import com.csiro.tickets.repository.AdditionalFieldValueRepository;
import com.csiro.tickets.repository.AttachmentRepository;
import com.csiro.tickets.repository.AttachmentTypeRepository;
import com.csiro.tickets.repository.CommentRepository;
import com.csiro.tickets.repository.IterationRepository;
import com.csiro.tickets.repository.LabelRepository;
import com.csiro.tickets.repository.PriorityBucketRepository;
import com.csiro.tickets.repository.StateRepository;
import com.csiro.tickets.repository.TicketRepository;
import com.csiro.tickets.repository.TicketTypeRepository;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.querydsl.core.types.Predicate;
import jakarta.transaction.Transactional;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.sql.SQLException;
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
import java.util.function.Function;
import java.util.stream.Collectors;
import javax.sql.rowset.serial.SerialBlob;
import javax.sql.rowset.serial.SerialException;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

@Component
public class TicketService {

  final TicketRepository ticketRepository;

  @Autowired
  public TicketService(TicketRepository ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  @Autowired AdditionalFieldTypeRepository additionalFieldTypeRepository;

  @Autowired AdditionalFieldValueRepository additionalFieldTypeValueRepository;

  @Autowired StateRepository stateRepository;

  @Autowired AttachmentTypeRepository attachmentTypeRepository;

  @Autowired AttachmentRepository attachmentRepository;

  @Autowired TicketTypeRepository ticketTypeRepository;

  @Autowired CommentRepository commentRepository;

  @Autowired LabelRepository labelRepository;

  @Autowired BaseUrlProvider baseUrlProvider;

  @Autowired IterationRepository iterationRepository;

  @Autowired PriorityBucketRepository priorityBucketRepository;

  protected final Log logger = LogFactory.getLog(getClass());

  private int itemsToProcess = 50000;

  private double importProgress = 0;

  @Value("${snomio.attachments.directory}")
  String attachmentsDirectory;

  public Page<TicketDto> findAllTickets(Pageable pageable) {
    Page<Ticket> tickets = ticketRepository.findAll(pageable);
    return tickets.map(TicketDto::of);
  }

  public Page<TicketDto> findAllTicketsByQueryParam(Predicate predicate, Pageable pageable) {
    Page<Ticket> tickets = ticketRepository.findAll(predicate, pageable);

    return tickets.map(TicketDto::of);
  }

  public Ticket updateTicket(Long ticketId, TicketDto ticketDto) {
    Optional<Ticket> optional = ticketRepository.findById(ticketId);

    if (optional.isPresent()) {
      Ticket ticket = optional.get();
      ticket.setTitle(ticketDto.getTitle());
      ticket.setDescription(ticketDto.getDescription());
      ticket.setModified(Instant.now());
      return ticketRepository.save(ticket);
    } else {
      throw new ResourceNotFoundProblem(String.format("Ticket not found with id %s", ticketId));
    }
  }

  // TODO: The dto has ID and created date and createdBy - These need to be implemented but in my
  // opinion that's an Update!
  public Ticket createTicketFromDto(TicketDto ticketDto) {

    Ticket newTicketToAdd = Ticket.of(ticketDto);
    Ticket newTicketToSave = new Ticket();
    // Generate ID
    ticketRepository.save(newTicketToSave);
    newTicketToSave.setTitle(newTicketToAdd.getTitle());
    newTicketToSave.setDescription(newTicketToAdd.getDescription());
    newTicketToSave.setAssignee(newTicketToAdd.getAssignee());
    /*
     *  Deal with labels
     */
    newTicketToSave.setLabels(new ArrayList<Label>());
    if (newTicketToAdd.getLabels() != null) {
      newTicketToAdd
          .getLabels()
          .forEach(
              label -> {
                Label labelToAdd = Label.of(label);
                Optional<Label> existingLabel = labelRepository.findByName(labelToAdd.getName());
                if (existingLabel.isPresent()) {
                  labelToAdd = existingLabel.get();
                }
                newTicketToSave.getLabels().add(labelToAdd);
              });
    }
    /*
     *  Deal with State
     */
    State stateToAdd = newTicketToAdd.getState();
    if (stateToAdd != null) {
      Optional<State> existingState = stateRepository.findByLabel(stateToAdd.getLabel());
      if (existingState.isPresent()) {
        stateToAdd = existingState.get();
      }
    }
    newTicketToSave.setState(stateToAdd);
    /*
     *  Deal with TicketType
     */
    TicketType ticketTypeToAdd = newTicketToAdd.getTicketType();
    if (ticketTypeToAdd != null) {
      Optional<TicketType> existingTicketType =
          ticketTypeRepository.findByName(ticketTypeToAdd.getName());
      if (existingTicketType.isPresent()) {
        ticketTypeToAdd = existingTicketType.get();
      }
    }
    newTicketToSave.setTicketType(ticketTypeToAdd);
    /*
     *  Deal with Iteration
     */
    Iteration iterationToAdd = newTicketToAdd.getIteration();
    if (iterationToAdd != null) {
      Optional<Iteration> existingIteration =
          iterationRepository.findByName(iterationToAdd.getName());
      if (existingIteration.isPresent()) {
        iterationToAdd = existingIteration.get();
      }
    }
    newTicketToSave.setIteration(iterationToAdd);
    /*
     *  Deal with PriorityBucket
     */
    PriorityBucket priorityBucketToAdd = newTicketToAdd.getPriorityBucket();
    if (priorityBucketToAdd != null) {
      Optional<PriorityBucket> existingpriorityBucket =
          priorityBucketRepository.findByName(priorityBucketToAdd.getName());
      if (existingpriorityBucket.isPresent()) {
        priorityBucketToAdd = existingpriorityBucket.get();
      }
    }
    newTicketToSave.setPriorityBucket(priorityBucketToAdd);

    // Comments
    newTicketToSave.setComments(newTicketToAdd.getComments());

    ticketRepository.save(newTicketToSave);
    return newTicketToSave;
  }

  @Transactional
  public int importTickets(
      TicketImportDto[] importDtos, int startAt, int size, File importDirectory) {

    int currentIndex = startAt;
    int savedNumberOfTickets = 0;
    long startTime = System.currentTimeMillis();
    // We are saving in batch because of memory issues for both H2 and PostgreSQL
    int batchSize = itemsToProcess;
    if (batchSize > size) {
      batchSize = size;
    }
    /*
     *  These are Maps for fields that need to be managed for primary key violation
     *  We can't add duplcate values for these fields
     */
    Map<String, Label> labelsToSave = new HashMap<String, Label>();
    Map<String, State> statesToSave = new HashMap<String, State>();
    Map<String, AttachmentType> attachmentTypesToSave = new HashMap<String, AttachmentType>();
    Map<String, AdditionalFieldType> additionalFieldTypesToSave =
        new HashMap<String, AdditionalFieldType>();
    Map<String, AdditionalFieldValue> additionalFieldTypeValuesToSave =
        new HashMap<String, AdditionalFieldValue>();
    Map<String, TicketType> ticketTypesToSave = new HashMap<String, TicketType>();
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
      // Existing Field Type Value lookup with keys that consists of field type + field type value
      Map<String, AdditionalFieldValue> additionalFieldTypeValues =
          new HashMap<String, AdditionalFieldValue>();

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
      List<Ticket> ticketsToSave = new ArrayList<Ticket>();
      logger.info("Start processing " + batchSize + " items from index " + currentIndex);
      for (int dtoIndex = currentIndex; dtoIndex < currentIndex + batchSize; dtoIndex++) {
        TicketImportDto dto = importDtos[dtoIndex];

        // Load the Ticket to be added.
        // Unfortunately we can't just have this, we have to process it
        // and sort out for existing/duplcated data
        Ticket newTicketToAdd = Ticket.of(dto);

        // This will be the Ticket to save into the DB
        Ticket newTicketToSave = ticketRepository.save(new Ticket());
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
        newTicketToSave.setState(processState(statesToSave, states, newTicketToAdd));
        newTicketToSave.setTicketType(
            processTicketType(ticketTypesToSave, ticketTypes, newTicketToAdd));
        List<Comment> newComments = new ArrayList<Comment>();
        if (newTicketToAdd.getComments() != null) {
          newTicketToAdd
              .getComments()
              .forEach(
                  comment -> {
                    newComments.add(
                        Comment.builder()
                            .text(comment.getText())
                            .jiraCreated(comment.getCreated())
                            .ticket(newTicketToSave)
                            .build());
                  });
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
                  + Long.toString(batchEnd - batchStart)
                  + "ms");
          batchStart = System.currentTimeMillis();
        }
        // Do you like this SonarCloud?
        setImportProgress((importedTicketNumber / (startAt + size * 1.00)) * 100.00);
      }
      logger.info(
          "Processed last batch of tickets. Total processing time: "
              + Long.toString(System.currentTimeMillis() - startTime)
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
   *  Deal with TicketTypes
   */
  private TicketType processTicketType(
      Map<String, TicketType> ticketTypesToSave,
      Map<String, TicketType> ticketTypes,
      Ticket newTicketToAdd) {
    TicketType ticketTypeToProcess = newTicketToAdd.getTicketType();
    TicketType ticketTypeToAdd = new TicketType();
    if (ticketTypes.containsKey(ticketTypeToProcess.getName())) {
      ticketTypeToAdd = ticketTypes.get(ticketTypeToProcess.getName());
    } else {
      if (ticketTypesToSave.containsKey(ticketTypeToProcess.getName())) {
        ticketTypeToAdd = ticketTypesToSave.get(ticketTypeToProcess.getName());
      } else {
        TicketType newType =
            TicketType.builder()
                .name(ticketTypeToProcess.getName())
                .description(ticketTypeToProcess.getDescription())
                .build();
        ticketTypesToSave.put(newType.getName(), newType);
        ticketTypeToAdd = newType;
      }
    }
    ticketTypeRepository.save(ticketTypeToAdd);
    return ticketTypeToAdd;
  }

  /*
   *  Deal with States
   */
  private State processState(
      Map<String, State> statesToSave, Map<String, State> states, Ticket newTicketToAdd) {
    State stateToAdd = new State();
    State stateToProcess = newTicketToAdd.getState();
    if (states.containsKey(stateToProcess.getLabel())) {
      stateToAdd = states.get(stateToProcess.getLabel());
    } else {
      if (statesToSave.containsKey(stateToProcess.getLabel())) {
        stateToAdd = statesToSave.get(stateToProcess.getLabel());
      } else {
        stateToAdd =
            State.builder()
                .label(stateToProcess.getLabel())
                .description(stateToProcess.getDescription())
                .grouping(stateToProcess.getGrouping())
                .build();
        statesToSave.put(stateToAdd.getLabel(), stateToAdd);
      }
    }
    stateRepository.save(stateToAdd);
    return stateToAdd;
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
    List<Label> labelsToAdd = new ArrayList<Label>();
    for (int i = 0; i < theLabels.size(); i++) {
      Label label = theLabels.get(i);
      String labelToAdd = label.getName();
      // Check if the fieldType is already saved in the DB
      if (labels.containsKey(labelToAdd)) {
        Label existingLabel = labels.get(labelToAdd);
        List<Ticket> existingTickets = new ArrayList<Ticket>(existingLabel.getTicket());
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
                  .ticket(new ArrayList<Ticket>())
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
    Set<AdditionalFieldValue> additionalFieldValuesToAdd = new HashSet<AdditionalFieldValue>();
    Set<AdditionalFieldValue> additionalFields = newTicketToAdd.getAdditionalFieldValues();
    for (AdditionalFieldValue additionalFieldValue : additionalFields) {
      AdditionalFieldValue fieldValueToAdd = new AdditionalFieldValue();
      fieldValueToAdd.setTickets(new ArrayList<Ticket>());
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
    additionalFieldTypeValueRepository.saveAll(additionalFieldValuesToAdd);
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
        AttachmentType newAttachmentType = AttachmentType.of(attachment.getAttachmentType());
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
    List<Attachment> attachmentsToAdd = new ArrayList<Attachment>();
    File saveLocation = new File(attachmentsDirectory);
    if (!saveLocation.exists()) {
      saveLocation.mkdirs();
    }
    for (Attachment attachment : attachments) {
      try {
        // Check if the attachmentType is already saved
        String mimeTypeToAdd = attachment.getAttachmentType().getMimeType();
        attachment.setAttachmentType(
            useAttachmentTypeIfAlreadySaved(
                attachmentTypesToSave, attachmentTypes, attachment, mimeTypeToAdd));
        // In the DTO we don't have the attachments in the JSON file so load it from the
        // disk using fileName.
        // Then we update fileName property to strip the path from the name
        String fileName = attachment.getFilename();
        File attachmentFileToImport = new File(attachment.getLocation());
        SerialBlob attachFile = new SerialBlob(Files.readAllBytes(attachmentFileToImport.toPath()));
        SerialBlob thumbFile = null;
        if (attachment.getThumbnailLocation() != null) {
          thumbFile = new SerialBlob(Files.readAllBytes(attachmentFileToImport.toPath()));
        }
        String fileLocationToSave =
            attachmentsDirectory + (attachmentsDirectory.endsWith("/") ? "" : "/");
        String fileLocation =
            Long.toString(newTicketToSave.getId()) + "/" + attachmentFileToImport.getName();
        String thumbNailLocation =
            Long.toString(newTicketToSave.getId())
                + "/_thumb_"
                + attachmentFileToImport.getName()
                + ".png";
        String thumbNailLocationToSave = fileLocationToSave + thumbNailLocation;
        fileLocationToSave += fileLocation;
        File attachmentFile = new File(fileLocationToSave);
        attachmentFile.mkdirs();
        InputStream inputStream = attachFile.getBinaryStream();
        Files.copy(inputStream, attachmentFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        inputStream.close();
        copyThumbnailFile(thumbFile, thumbNailLocationToSave);
        attachment.setLocation(fileLocation);
        attachment.setFilename(fileName);
        if (attachment.getThumbnailLocation() != null) {
          attachment.setThumbnailLocation(thumbNailLocation);
        }
      } catch (IOException | SQLException e) {
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

  private void copyThumbnailFile(SerialBlob thumbFile, String thumbNailLocationToSave)
      throws SerialException, IOException {
    if (thumbFile != null) {
      File thumbNailFile = new File(thumbNailLocationToSave);
      InputStream thumbInputStream = thumbFile.getBinaryStream();
      Files.copy(thumbInputStream, thumbNailFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
      thumbInputStream.close();
    }
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
    List<T> attachmentTypes = repository.findAll();
    return attachmentTypes.stream().collect(Collectors.toMap(compareField, Function.identity()));
  }

  public double getImportProgress() {
    return importProgress;
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
}
