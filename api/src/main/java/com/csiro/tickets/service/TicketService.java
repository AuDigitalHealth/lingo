package com.csiro.tickets.service;

import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.exception.TicketImportProblem;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.dto.TicketImportDto;
import com.csiro.tickets.models.AdditionalFieldType;
import com.csiro.tickets.models.AdditionalFieldTypeValue;
import com.csiro.tickets.models.Attachment;
import com.csiro.tickets.models.AttachmentType;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import com.csiro.tickets.repository.AdditionalFieldTypeRepository;
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
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
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
import org.springframework.core.env.Environment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

@Component
public class TicketService {

  @Autowired TicketRepository ticketRepository;

  @Autowired AdditionalFieldTypeRepository additionalFieldTypeRepository;

  @Autowired AdditionalFieldTypeRepository additionalFieldRepository;

  @Autowired StateRepository stateRepository;

  @Autowired AttachmentTypeRepository attachmentTypeRepository;

  @Autowired AttachmentRepository attachmentRepository;

  @Autowired TicketTypeRepository ticketTypeRepository;

  @Autowired CommentRepository commentRepository;

  @Autowired LabelRepository labelRepository;

  @Autowired private Environment environment;

  protected final Log logger = LogFactory.getLog(getClass());

  private final int itemsToSaveInBatch = 10000;

  private double importProgress = 0;

  public List<TicketDto> findAllTickets() {
    List<TicketDto> tickets = new ArrayList<>();

    ticketRepository.findAll().forEach(ticket -> tickets.add(TicketDto.of(ticket)));

    return tickets;
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
  public Long importTickets(
      TicketImportDto[] importDtos, int startAt, int size, File importDirectory) {

    // This is used to optimise import performance and we save in batch
    int currentIndex = startAt;
    int savedNumberOfTickets = 0;
    long startTime = System.currentTimeMillis();
    int batchSize = itemsToSaveInBatch;
    if (batchSize > size) {
      batchSize = size;
    }
    Map<String, Label> labelsToSave = new HashMap<String, Label>();
    Map<String, State> statesToSave = new HashMap<String, State>();
    Map<String, AttachmentType> attachmentTypesToSave = new HashMap<String, AttachmentType>();
    Map<String, AdditionalFieldType> additionalFieldTypesToSave =
        new HashMap<String, AdditionalFieldType>();
    Map<String, TicketType> ticketTypesToSave = new HashMap<String, TicketType>();
    while (currentIndex < startAt + size) {
      if (currentIndex + batchSize > startAt + size) {
        batchSize = (startAt + size) - currentIndex;
      }
      long batchStart = System.currentTimeMillis();
      logger.info("Start caching fields with relationships...");
      Map<String, Label> labels = preloadLabels();
      Map<String, State> states = preloadStates();
      Map<String, AttachmentType> attachmentTypes = preloadAttachmentTypes();
      Map<String, AdditionalFieldType> additionalFieldTypes = preloadAdditionalFieldTypes();
      Map<String, TicketType> ticketTypes = preloadTicketTypes();
      logger.info(
          "Finished reading fields with relationships fields in "
              + (System.currentTimeMillis() - batchStart)
              + "ms");
      List<Ticket> ticketsToSave = new ArrayList<Ticket>();
      int startFrom = currentIndex;
      logger.info("Start processing " + batchSize + " items from index " + currentIndex);
      for (int dtoIndex = startFrom; dtoIndex < startFrom + batchSize; dtoIndex++) {
        TicketImportDto dto = importDtos[dtoIndex];

        Ticket newTicketToAdd = Ticket.of(dto);
        Ticket newTicketToSave = new Ticket();
        newTicketToSave.setLabels(new ArrayList<Label>());
        newTicketToSave.setAttachments(new ArrayList<Attachment>());

        /*
         *  From here we copy everything from the DTO to newTicketToSave and
         *  make sure we use exsiging entities from the database for the
         *  appropriate fields.
         *
         *  We also make sure that we don't add duplicate fields in the
         *  transaction and break primary keys
         *
         */

        newTicketToSave.setDescription(newTicketToAdd.getDescription());
        newTicketToSave.setTitle(newTicketToAdd.getTitle());
        newTicketToSave.setComments(newTicketToAdd.getComments());
        newTicketToSave.getComments().forEach(comment -> comment.setTicket(newTicketToSave));

        /*
         *  Deal with Attachments and AttachmentTypes
         */
        List<Attachment> attachments = newTicketToAdd.getAttachments();
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
                attachmentTypesToSave.put(mimeTypeToAdd, attachment.getAttachmentType());
              }
            }
            // In the DTO we don't have the attachments in the JSON file so load it from the
            // disk using fileName.
            // Then we update fileName property to strip the path from the name
            String fileName = attachment.getFilename();
            byte[] fileData =
                Files.readAllBytes(Paths.get(importDirectory.getAbsolutePath() + "/" + fileName));
            SerialBlob attachFile = new SerialBlob(fileData);
            attachment.setData(attachFile);
            attachment.setFilename(Paths.get(fileName).getFileName().toString());
            attachment.setTicket(newTicketToSave);
          } catch (IOException | SQLException e) {
            throw new TicketImportProblem(e.getStackTrace().toString());
          }
          // TODO: Would be nicer to add Attachment(Attachment attachment) constructor
          // so we could use Attachment newAttachment = new Attachment(attachment) here.
          // Unfortunately it breaks deserialisation
          Attachment newAttachment = new Attachment();
          newAttachment.setDescription(attachment.getDescription());
          newAttachment.setFilename(attachment.getFilename());
          newAttachment.setData(attachment.getData());
          newAttachment.setLength(attachment.getLength());
          newAttachment.setSha256(attachment.getSha256());
          newAttachment.setAttachmentType(attachment.getAttachmentType());
          newAttachment.setTicket(newTicketToSave);
          newTicketToSave.setAttachments(new ArrayList<Attachment>());
          newTicketToSave.getAttachments().add(newAttachment);
        }

        /*
         *  Deal with AdditionFieldTypeValues
         */
        Set<AdditionalFieldTypeValue> additionalFields =
            newTicketToAdd.getAdditionalFieldTypeValues();
        for (AdditionalFieldTypeValue additionalField : additionalFields) {
          AdditionalFieldType fieldType = additionalField.getAdditionalFieldType();
          String fieldToAdd = fieldType.getName();
          if (additionalFieldTypes.containsKey(fieldToAdd)) {
            additionalField.setAdditionalFieldType(additionalFieldTypes.get(fieldToAdd));
          } else {
            if (additionalFieldTypesToSave.containsKey(fieldToAdd)) {
              additionalField.setAdditionalFieldType(additionalFieldTypesToSave.get(fieldToAdd));
            } else {
              additionalFieldTypesToSave.put(fieldToAdd, fieldType);
            }
          }
          // Same as above I cannot add my own constructor because it breaks deserialisation
          AdditionalFieldTypeValue newAdditionalField = new AdditionalFieldTypeValue();
          newAdditionalField.setAdditionalFieldType(additionalField.getAdditionalFieldType());
          newAdditionalField.setValueOf(additionalField.getValueOf());
          newAdditionalField.setTickets(Arrays.asList(newTicketToSave));
        }

        /*
         *  Deal with Labels
         */
        List<Label> theLabels = newTicketToAdd.getLabels();
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
            newTicketToSave.getLabels().add(existingLabel);
          } else {
            if (labelsToSave.containsKey(labelToAdd)) {
              // Use already saved label from db
              newTicketToSave.getLabels().add(labelsToSave.get(labelToAdd));
            } else {
              // Adding completely new label
              Label newLabel = new Label();
              newLabel.setName(label.getName());
              newLabel.setDescription(label.getDescription());
              newLabel.setDisplayColor(label.getDisplayColor());
              newLabel.setTicket(new ArrayList<Ticket>());
              newLabel.getTicket().add(newTicketToSave);
              labelsToSave.put(labelToAdd, newLabel);
              newTicketToSave.getLabels().add(newLabel);
            }
          }
        }

        /*
         *  Deal with States
         */
        State stateToAdd = newTicketToAdd.getState();
        if (states.containsKey(stateToAdd.getLabel())) {
          newTicketToAdd.setState(states.get(stateToAdd.getLabel()));
        } else {
          if (statesToSave.containsKey(stateToAdd.getLabel())) {
            newTicketToSave.setState(statesToSave.get(stateToAdd.getLabel()));
          } else {
            State newState = new State();
            newState.setLabel(stateToAdd.getLabel());
            newState.setDescription(stateToAdd.getDescription());
            newState.setGrouping(stateToAdd.getGrouping());
            statesToSave.put(newState.getLabel(), newState);
            newTicketToSave.setState(newState);
          }
        }

        /*
         *  Deal with TicketTypes
         */
        TicketType ticketTypeToAdd = newTicketToAdd.getTicketType();
        if (ticketTypes.containsKey(ticketTypeToAdd.getName())) {
          newTicketToAdd.setTicketType(ticketTypes.get(ticketTypeToAdd.getName()));
        } else {
          if (ticketTypesToSave.containsKey(ticketTypeToAdd.getName())) {
            newTicketToSave.setTicketType(ticketTypesToSave.get(ticketTypeToAdd.getName()));
          } else {
            TicketType newType = new TicketType();
            newType.setName(ticketTypeToAdd.getName());
            newType.setDescription(ticketTypeToAdd.getDescription());
            ticketTypesToSave.put(newType.getName(), newType);
            newTicketToSave.setTicketType(newType);
          }
        }

        /*
         *  Add ticket to be saved later
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
        currentIndex++;
      }

      /*
       *  Save fields with relationships first
       */
      logger.info("Saving fields with relationships...");
      logger.info("Saving AdditionalFieldTypes...");
      batchSaveEntitiesToRepository(
          additionalFieldTypesToSave.values(), additionalFieldTypeRepository);
      logger.info("Saving States...");
      batchSaveEntitiesToRepository(statesToSave.values(), stateRepository);
      logger.info("Saving AttacmentTypes...");
      batchSaveEntitiesToRepository(attachmentTypesToSave.values(), attachmentTypeRepository);
      logger.info("Saving Labels...");
      batchSaveEntitiesToRepository(labelsToSave.values(), labelRepository);
      /*
       *  Save tickets in batches and clean up memory while doiing it
       */
      logger.info("Saving Tickets...");
      int savedTickets = batchSaveEntitiesToRepository(ticketsToSave, ticketRepository);
      savedNumberOfTickets += savedTickets;
      // Clean up
      ticketsToSave.clear();
      labelsToSave.clear();
      statesToSave.clear();
      attachmentTypesToSave.clear();
      additionalFieldTypesToSave.clear();
      ticketTypesToSave.clear();
      logger.info("Flushing tickets...");
      ticketRepository.flush();
      System.gc();
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
    return endTime - startTime;
  }

  /*
   *  Batching the Save for H2 backend to avoid out of memory errors
   */
  @Transactional
  private <T> int batchSaveEntitiesToRepository(
      Collection<T> entities, JpaRepository<T, ?> repository) {

    int savedNumberOfItems = 0;
    int itemsToSave = itemsToSaveInBatch;

    String dataSourceUrl = environment.getProperty("spring.datasource.url");
    boolean isH2Db = false;
    if (dataSourceUrl != null) {
      isH2Db = dataSourceUrl.startsWith("jdbc:h2:");
      if (isH2Db) {
        itemsToSave = 5000;
      }
    }

    Iterator<T> tickerator = entities.iterator();
    while (tickerator.hasNext()) {
      List<T> batchOfItemsToSave = new ArrayList<>();
      for (int i = 0; i < itemsToSave && tickerator.hasNext(); i++) {
        batchOfItemsToSave.add(tickerator.next());
        tickerator.remove();
      }
      if (!isH2Db) {
        logger.info("Saving batch of " + itemsToSave + " items...");
      }
      long startSave = System.currentTimeMillis();
      List<T> savedItems = repository.saveAll(batchOfItemsToSave);
      batchOfItemsToSave.clear();
      System.gc();
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

  private Map<String, AttachmentType> preloadAttachmentTypes() {
    List<AttachmentType> attachmentTypes = attachmentTypeRepository.findAll();
    return attachmentTypes.stream()
        .collect(Collectors.toMap(AttachmentType::getMimeType, Function.identity()));
  }

  private Map<String, State> preloadStates() {
    List<State> states = stateRepository.findAll();
    return states.stream().collect(Collectors.toMap(State::getLabel, Function.identity()));
  }

  private Map<String, AdditionalFieldType> preloadAdditionalFieldTypes() {
    List<AdditionalFieldType> additionalFieldTypes = additionalFieldTypeRepository.findAll();
    return additionalFieldTypes.stream()
        .collect(Collectors.toMap(AdditionalFieldType::getName, Function.identity()));
  }

  private Map<String, Label> preloadLabels() {
    List<Label> labels = labelRepository.findAll();
    return labels.stream().collect(Collectors.toMap(Label::getName, Function.identity()));
  }

  private Map<String, TicketType> preloadTicketTypes() {
    List<TicketType> ticketTypes = ticketTypeRepository.findAll();
    return ticketTypes.stream().collect(Collectors.toMap(TicketType::getName, Function.identity()));
  }

  public double getImportProgress() {
    return importProgress;
  }

  private void setImportProgress(double progress) {
    this.importProgress = progress;
  }
}
