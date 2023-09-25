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
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import com.csiro.tickets.repository.AdditionalFieldTypeRepository;
import com.csiro.tickets.repository.AdditionalFieldValueRepository;
import com.csiro.tickets.repository.AttachmentRepository;
import com.csiro.tickets.repository.AttachmentTypeRepository;
import com.csiro.tickets.repository.CommentRepository;
import com.csiro.tickets.repository.LabelRepository;
import com.csiro.tickets.repository.StateRepository;
import com.csiro.tickets.repository.TicketRepository;
import com.csiro.tickets.repository.TicketTypeRepository;
import jakarta.transaction.Transactional;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;
import javax.sql.rowset.serial.SerialBlob;
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

  protected final Log logger = LogFactory.getLog(getClass());

  private int itemsToSaveInBatch = 50000;
  private int itemsToProcess = 50000;

  private double importProgress = 0;

  @Value("${snomio.attachments.directory}")
  String attachmentsDirectory;

  @Value("${snomio.attachments.download.path}")
  String attachmentsDownloadPath;

  public Page<TicketDto> findAllTickets(Pageable pageable) {
      Page<Ticket> tickets = ticketRepository.findAll(pageable);
      Page<TicketDto> ticketDtos = tickets.map(ticket -> TicketDto.of(ticket));
  
      return ticketDtos;
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
                importDirectory,
                attachmentTypesToSave,
                attachmentTypes,
                newTicketToAdd,
                newTicketToSave));
        newTicketToSave.setAdditionalFieldValues(
            processAdditionalFields(
                additionalFieldTypesToSave,
                additionalFieldTypeValuesToSave,
                additionalFieldTypes,
                additionalFieldTypeValues,
                newTicketToAdd,
                newTicketToSave));
        newTicketToSave.setLabels(
            processLabels(labelsToSave, labels, newTicketToAdd, newTicketToSave));
        newTicketToSave.setState(
            processState(statesToSave, states, newTicketToAdd, newTicketToSave));
        newTicketToSave.setTicketType(
            processTicketType(ticketTypesToSave, ticketTypes, newTicketToAdd, newTicketToSave));
        List<Comment> newComments = new ArrayList<Comment>();
        for (Comment comm: newTicketToAdd.getComments()) {
          Comment newComment = Comment.of(comm);
          newComment.setTicket(newTicketToSave);
          commentRepository.save(newComment);
          newComments.add(newComment);
        }
        newComments.add(
                Comment.builder()
                    .text(
                        "<strong>### Import note: Current assignee: </strong>"
                            + newTicketToAdd.getAssignee())
                    .build());
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
        setImportProgress((importedTicketNumber / (startAt + size)) * 100);
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
      Ticket newTicketToAdd,
      Ticket newTicketToSave) {
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
    return ticketTypeToAdd;
  }

  /*
   *  Deal with States
   */
  private State processState(
      Map<String, State> statesToSave,
      Map<String, State> states,
      Ticket newTicketToAdd,
      Ticket newTicketToSave) {
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
        ;
        statesToSave.put(stateToAdd.getLabel(), stateToAdd);
      }
    }
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
          labelRepository.save(newLabel);
        }
      }
    }
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
      Ticket newTicketToAdd,
      Ticket newTicketToSave) {
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
    return additionalFieldValuesToAdd;
  }

  /*
   *  Deal with Attachments and AttachmentTypes
   */
  private List<Attachment> processAttachments(
      File importDirectory,
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
        if (attachmentTypes.containsKey(mimeTypeToAdd)) {
          attachment.setAttachmentType(attachmentTypes.get(mimeTypeToAdd));
        } else {
          if (attachmentTypesToSave.containsKey(mimeTypeToAdd)) {
            // Do not add a new attachment type in the transaction to avoid primarykey
            // collisions
            attachment.setAttachmentType(attachmentTypesToSave.get(mimeTypeToAdd));
          } else {
            // New AttachmentType to add, it will be saved later
            AttachmentType newAttachmentType = AttachmentType.of(attachment.getAttachmentType());
            attachment.setAttachmentType(attachmentTypeRepository.save(newAttachmentType));
            attachmentTypesToSave.put(mimeTypeToAdd, newAttachmentType);
          }
        }
        // In the DTO we don't have the attachments in the JSON file so load it from the
        // disk using fileName.
        // Then we update fileName property to strip the path from the name
        String fileName = attachment.getFilename();
        String actualFileName = Paths.get(fileName).getFileName().toString();
        SerialBlob attachFile =
            new SerialBlob(
                Files.readAllBytes(Paths.get(importDirectory.getAbsolutePath() + "/" + fileName)));
        String fileLocation =
            attachmentsDirectory
                + (attachmentsDirectory.endsWith("/") ? "" : "/")
                + Long.toString(newTicketToSave.getId())
                + "/"
                + actualFileName;
        File attachmentFile = new File(fileLocation);
        attachmentFile.mkdirs();
        InputStream inputStream = attachFile.getBinaryStream();
        Files.copy(inputStream, attachmentFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        inputStream.close();
        attachment.setLocation(fileLocation);
        attachment.setFilename(Paths.get(fileName).getFileName().toString());
      } catch (IOException | SQLException e) {
        throw new TicketImportProblem(e.getMessage());
      }
      Attachment newAttachment =
          Attachment.builder()
              .description(attachment.getDescription())
              .filename(attachment.getFilename())
              .location(attachment.getLocation())
              .length(attachment.getLength())
              .sha256(attachment.getSha256())
              .attachmentType(attachment.getAttachmentType())
              .ticket(newTicketToSave)
              .build();
      attachmentRepository.save(newAttachment);
      attachmentsToAdd.add(newAttachment);
    }
    return attachmentsToAdd;
  }

  /*
   *  Batching the Save for H2 backend to avoid out of memory errors
   */
  private <T> int batchSaveEntitiesToRepository(
      Collection<T> entities, JpaRepository<T, ?> repository) {

    int savedNumberOfItems = 0;

    Iterator<T> tickerator = entities.iterator();
    while (tickerator.hasNext()) {
      List<T> batchOfItemsToSave = new ArrayList<>();
      for (int i = 0; i < itemsToSaveInBatch && tickerator.hasNext(); i++) {
        batchOfItemsToSave.add(tickerator.next());
        tickerator.remove();
      }
      logger.info("Saving batch of " + itemsToSaveInBatch + " items...");
      long startSave = System.currentTimeMillis();
      List<T> savedItems = repository.saveAllAndFlush(batchOfItemsToSave);
      batchOfItemsToSave.clear();
      long endSave = System.currentTimeMillis();
      savedNumberOfItems += savedItems.size();
      logger.info(
          "Saved "
              + savedItems.size()
              + " items, in "
              + (endSave - startSave)
              + "ms "
              + entities.size()
              + " left to save");
    }
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
}
