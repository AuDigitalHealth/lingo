package com.csiro.tickets.service;

import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.exception.TicketImportProblem;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.dto.TicketImportDto;
import com.csiro.tickets.models.AdditionalField;
import com.csiro.tickets.models.AdditionalFieldType;
import com.csiro.tickets.models.Attachment;
import com.csiro.tickets.models.AttachmentType;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import com.csiro.tickets.repository.AdditionalFieldRepository;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.sql.rowset.serial.SerialBlob;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class TicketService {

  @Autowired TicketRepository ticketRepository;

  @Autowired AdditionalFieldTypeRepository additionalFieldTypeRepository;

  @Autowired AdditionalFieldRepository additionalFieldRepository;

  @Autowired StateRepository stateRepository;

  @Autowired AttachmentTypeRepository attachmentTypeRepository;

  @Autowired AttachmentRepository attachmentRepository;

  @Autowired TicketTypeRepository ticketTypeRepository;

  @Autowired CommentRepository commentRepository;

  @Autowired LabelRepository labelRepository;

  protected final Log logger = LogFactory.getLog(getClass());

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
    Long importedTicketNumber = 0l;

    // This is used to optimise import performance and we save in batch

    long startTime = System.currentTimeMillis();
    long batchStart = System.currentTimeMillis();
    for (int dtos = startAt; dtos < importDtos.length; dtos++) {
      TicketImportDto dto = importDtos[dtos];
      List<Ticket> ticketsToSave = new ArrayList<Ticket>();
      Map<String, Label> labelsToSave = new HashMap<String, Label>();
      Map<String, State> statesToSave = new HashMap<String, State>();
      Map<String, AttachmentType> attachmentTypesToSave = new HashMap<String, AttachmentType>();
      Map<String, AdditionalFieldType> additionalFieldTypesToSave =
          new HashMap<String, AdditionalFieldType>();
      Map<String, TicketType> ticketTypesToSave = new HashMap<String, TicketType>();

      Ticket newTicketToAdd = Ticket.of(dto);
      Ticket newTicketToSave = new Ticket();
      newTicketToSave.setLabels(new ArrayList<Label>());
      newTicketToSave.setAttachments(new ArrayList<Attachment>());
      newTicketToSave.setAdditionalFields(new ArrayList<AdditionalField>());

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
          Optional<AttachmentType> existingAttachmentType =
              attachmentTypeRepository.findByMimeType(mimeTypeToAdd);
          existingAttachmentType.ifPresentOrElse(
              attachmentType -> {
                attachment.setAttachmentType(attachmentType);
              },
              () -> {
                if (attachmentTypesToSave.containsKey(mimeTypeToAdd)) {
                  // Do not add a new attachment type in the transaction to avoid primarykey
                  // collisions
                  attachment.setAttachmentType(attachmentTypesToSave.get(mimeTypeToAdd));
                } else {
                  // New AttachmentType to add, it will be saved later
                  attachmentTypesToSave.put(mimeTypeToAdd, attachment.getAttachmentType());
                }
              });
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
          throw new TicketImportProblem(e.getMessage());
        }
        // I cannot add my own Attachment(Attachment attachment) constructor because it breaks
        // deserialisation so I can't just do Attachment newAttachment = new Attachment(attachment);
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
       *  Deal with AdditionFieldTypes
       */
      List<AdditionalField> additionalFields = newTicketToAdd.getAdditionalFields();
      for (AdditionalField additionalField : additionalFields) {
        AdditionalFieldType fieldType = additionalField.getAdditionalFieldType();
        String fieldToAdd = fieldType.getName();
        Optional<AdditionalFieldType> existingFieldTypes =
            additionalFieldTypeRepository.findByName(fieldToAdd);
        existingFieldTypes.ifPresentOrElse(
            existingFieldType -> {
              additionalField.setAdditionalFieldType(existingFieldType);
            },
            () -> {
              if (additionalFieldTypesToSave.containsKey(fieldToAdd)) {
                additionalField.setAdditionalFieldType(additionalFieldTypesToSave.get(fieldToAdd));
              } else {
                additionalFieldTypesToSave.put(fieldToAdd, fieldType);
              }
            });
        // Same as above I cannot add my own constructor because it breaks deserialisation
        AdditionalField newAdditionalField = new AdditionalField();
        newAdditionalField.setAdditionalFieldType(additionalField.getAdditionalFieldType());
        newAdditionalField.setValueOf(additionalField.getValueOf());
        newAdditionalField.setTicket(newTicketToSave);
        newTicketToSave.getAdditionalFields().add(newAdditionalField);
      }

      /*
       *  Deal with Labels
       */
      List<Label> labels = newTicketToAdd.getLabels();
      for (int i = 0; i < labels.size(); i++) {
        Label label = labels.get(i);
        String labelToAdd = label.getName();
        // Check if the fieldType is already saved
        Optional<Label> existingLabels = labelRepository.findByName(labelToAdd);
        existingLabels.ifPresentOrElse(
            existingLabel -> {
              List<Ticket> existingTickets = new ArrayList<Ticket>(existingLabel.getTicket());
              existingTickets.add(newTicketToSave);
              existingLabel.setTicket(existingTickets);
              labelsToSave.put(existingLabel.getName(), existingLabel);
              newTicketToSave.getLabels().add(existingLabel);
            },
            () -> {
              if (labelsToSave.containsKey(labelToAdd)) {
                // Addig that will be saved but was already added
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
            });
      }

      // Make sure we use existing State
      State stateToAdd = newTicketToAdd.getState();
      stateRepository
          .findByLabel(stateToAdd.getLabel())
          .ifPresentOrElse(
              existingState -> {
                newTicketToAdd.setState(existingState);
              },
              () -> {
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
              });

      // Make sure we use existing TicketType
      TicketType ticketTypeToAdd = newTicketToAdd.getTicketType();
      ticketTypeRepository
          .findByName(ticketTypeToAdd.getName())
          .ifPresentOrElse(
              existingType -> {
                newTicketToAdd.setTicketType(existingType);
              },
              () -> {
                if (ticketTypesToSave.containsKey(ticketTypeToAdd.getName())) {
                  newTicketToSave.setTicketType(ticketTypesToSave.get(ticketTypeToAdd.getName()));
                } else {
                  TicketType newType = new TicketType();
                  newType.setName(ticketTypeToAdd.getName());
                  newType.setDescription(ticketTypeToAdd.getDescription());
                  ticketTypesToSave.put(newType.getName(), newType);
                  newTicketToSave.setTicketType(newType);
                }
              });

      /*
       *  Save the ticket
       */
      ticketsToSave.add(newTicketToSave);
      importedTicketNumber++;
      if (importedTicketNumber % 5000 == 0) {
        long batchEnd = System.currentTimeMillis();
        logger.info(
            "Saving batch of 5000 Tickets ["
                + importedTicketNumber
                + "] in "
                + Long.toString(batchEnd - batchStart)
                + "ms");
        additionalFieldTypeRepository.saveAll(additionalFieldTypesToSave.values());
        stateRepository.saveAll(statesToSave.values());
        attachmentTypeRepository.saveAll(attachmentTypesToSave.values());
        labelRepository.saveAll(labelsToSave.values());
        ticketRepository.saveAll(ticketsToSave);
        ticketsToSave.clear();
        batchStart = System.currentTimeMillis();
      } else if (importedTicketNumber > importDtos.length) {
        importedTicketNumber--;
        logger.info("Saving kast batch of [" + importedTicketNumber + "]");
        additionalFieldTypeRepository.saveAll(additionalFieldTypesToSave.values());
        stateRepository.saveAll(statesToSave.values());
        attachmentTypeRepository.saveAll(attachmentTypesToSave.values());
        labelRepository.saveAll(labelsToSave.values());
        ticketRepository.saveAll(ticketsToSave);
        ticketsToSave.clear();
      }
      setImportProgress((importedTicketNumber / importDtos.length) * 100);
      if (importedTicketNumber > 45000) {
        break;
      }
    }
    long endTime = System.currentTimeMillis();
    logger.info(
        "Processed "
            + importedTicketNumber
            + " tickets in "
            + Long.toString(endTime - startTime)
            + "ms");
    return importedTicketNumber;
  }

  public double getImportProgress() {
    return importProgress;
  }

  private void setImportProgress(double progress) {
    this.importProgress = progress;
  }
}
