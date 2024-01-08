package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.exception.SnomioProblem;
import com.csiro.tickets.controllers.dto.AttachmentUploadResponse;
import com.csiro.tickets.helper.AttachmentUtils;
import com.csiro.tickets.models.Attachment;
import com.csiro.tickets.models.AttachmentType;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.AttachmentRepository;
import com.csiro.tickets.repository.AttachmentTypeRepository;
import com.csiro.tickets.repository.TicketRepository;
import com.drew.imaging.ImageProcessingException;
import jakarta.transaction.Transactional;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Optional;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class AttachmentController {

  protected final Log logger = LogFactory.getLog(getClass());
  final AttachmentRepository attachmentRepository;
  final AttachmentTypeRepository attachmentTypeRepository;
  final TicketRepository ticketRepository;

  @Value("${snomio.attachments.directory}")
  private String attachmentsDirectory;

  public AttachmentController(
      AttachmentRepository attachmentRepository,
      TicketRepository ticketRepository,
      AttachmentTypeRepository attachmentTypeRepository) {
    this.attachmentRepository = attachmentRepository;
    this.ticketRepository = ticketRepository;
    this.attachmentTypeRepository = attachmentTypeRepository;
  }

  @GetMapping("/api/attachments/{id}")
  public ResponseEntity<Attachment> getAttachment(@PathVariable Long id) {
    Optional<Attachment> attachmentOptional = attachmentRepository.findById(id);
    if (attachmentOptional.isPresent()) {
      return ResponseEntity.ok(attachmentOptional.get());
    } else {
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/api/attachments/download/{id}")
  public ResponseEntity<ByteArrayResource> downloadAttachment(@PathVariable Long id) {
    Optional<Attachment> attachmentOptional = attachmentRepository.findById(id);
    if (attachmentOptional.isPresent()) {
      Attachment attachment = attachmentOptional.get();
      return getFile(attachment, false);
    } else {
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/api/attachments/thumbnail/{id}")
  public ResponseEntity<ByteArrayResource> getThumbnail(@PathVariable Long id) {
    Optional<Attachment> attachmentOptional = attachmentRepository.findById(id);
    if (attachmentOptional.isPresent()) {
      Attachment attachment = attachmentOptional.get();
      return getFile(attachment, true);
    } else {
      return ResponseEntity.notFound().build();
    }
  }

  @PostMapping(
      value = "/api/attachments/upload/{ticketId}",
      produces = MediaType.APPLICATION_JSON_VALUE)
  @Transactional
  public ResponseEntity<AttachmentUploadResponse> uploadAttachment(
      @PathVariable Long ticketId, @RequestParam("file") MultipartFile file) {
    if (file.isEmpty()) {
      return ResponseEntity.badRequest()
          .body(
              AttachmentUploadResponse.builder()
                  .message(AttachmentUploadResponse.MESSAGE_EMPTYFILE)
                  .attachmentId(null)
                  .build());
    }
    String attachmentsDir = attachmentsDirectory + (attachmentsDirectory.endsWith("/") ? "" : "/");
    Optional<Ticket> tickeOptional = ticketRepository.findById(ticketId);
    if (tickeOptional.isPresent()) {
      try {
        // Save attachment file to target location. Filename will be SHA256 hash
        String attachmentSHA = AttachmentUtils.calculateSHA256(file);
        String attachmentLocation =
            AttachmentUtils.getAttachmentAbsolutePath(attachmentsDir, attachmentSHA);
        String attachmentFileName = file.getOriginalFilename();
        File attachmentFile = new File(attachmentLocation);
        if (!attachmentFile.exists()) {
          attachmentFile.getParentFile().mkdirs();
          Files.copy(file.getInputStream(), Path.of(attachmentLocation));
        }

        // Handle the Content Type of the new attachment
        String contentType = file.getContentType();
        if (contentType == null || contentType.isEmpty()) {
          throw new SnomioProblem(
              "/api/attachments/upload", "Missing Content type", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        AttachmentType attachmentType = null;
        Optional<AttachmentType> existingAttachmentType =
            attachmentTypeRepository.findByMimeType(contentType);
        if (existingAttachmentType.isPresent()) {
          attachmentType = existingAttachmentType.get();
        } else {
          attachmentType = AttachmentType.of(contentType);
          attachmentTypeRepository.save(attachmentType);
        }

        Ticket theTicket = tickeOptional.get();
        Attachment newAttachment =
            Attachment.builder()
                .description(attachmentFileName)
                .filename(attachmentFileName)
                .location(AttachmentUtils.getAttachmentRelativePath(attachmentSHA))
                .length(file.getSize())
                .sha256(attachmentSHA)
                .ticket(theTicket)
                .attachmentType(attachmentType)
                .build();

        // Generate thumbnail for the attachment if it's an image
        if (attachmentType.getMimeType().startsWith("image")) {
          if (AttachmentUtils.saveThumbnail(
              attachmentFile,
              AttachmentUtils.getThumbnailAbsolutePath(attachmentsDir, attachmentSHA))) {
            newAttachment.setThumbnailLocation(
                AttachmentUtils.getThumbnailRelativePath(attachmentSHA));
          }
        }

        // Save the attachment in the DB
        theTicket.getAttachments().add(newAttachment);
        attachmentRepository.save(newAttachment);
        return ResponseEntity.ok(
            AttachmentUploadResponse.builder()
                .message(AttachmentUploadResponse.MESSAGE_SUCCESS)
                .attachmentId(newAttachment.getId())
                .build());
      } catch (IOException | NoSuchAlgorithmException | ImageProcessingException e) {
        e.printStackTrace();
        throw new SnomioProblem(
            "/api/upload",
            "Could not upload file: " + file.getOriginalFilename(),
            HttpStatus.INTERNAL_SERVER_ERROR,
            e.getMessage());
      }
    } else {
      return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body(
              AttachmentUploadResponse.builder()
                  .message(AttachmentUploadResponse.MESSAGE_MISSINGTICKET)
                  .attachmentId(null)
                  .build());
    }
  }

  ResponseEntity<ByteArrayResource> getFile(Attachment attachment, boolean isThumbnail) {
    try {
      File theFile = null;
      if (isThumbnail) {
        theFile =
            new File(
                attachmentsDirectory
                    + (attachmentsDirectory.endsWith("/") ? "" : "/")
                    + attachment.getThumbnailLocation());
      } else {
        theFile =
            new File(
                attachmentsDirectory
                    + (attachmentsDirectory.endsWith("/") ? "" : "/")
                    + attachment.getLocation());
      }
      ByteArrayResource data =
          new ByteArrayResource(Files.readAllBytes(Paths.get(theFile.getAbsolutePath())));
      HttpHeaders headers = new HttpHeaders();
      if (!isThumbnail) {
        headers.add(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + attachment.getFilename() + '"');
      }
      MediaType mediaType = MediaType.parseMediaType(attachment.getAttachmentType().getMimeType());
      return ResponseEntity.ok()
          .headers(headers)
          .contentLength(data.contentLength())
          .contentType(mediaType)
          .body(data);
    } catch (IOException e) {
      throw new ResourceNotFoundProblem(
          isThumbnail
              ? "Could not find thumbnail "
              : "Could not find file " + " for attachment id " + attachment.getId());
    }
  }

  @Transactional
  @DeleteMapping("/api/attachments/{id}")
  public ResponseEntity<Void> deleteAttachment(@PathVariable Long id) {
    Optional<Attachment> attachmentOptional = attachmentRepository.findById(id);
    if (attachmentOptional.isPresent()) {
      Attachment attachment = attachmentOptional.get();
      String attachmentPath = attachment.getLocation();
      String thumbPath = attachment.getThumbnailLocation();
      // Try to remove attachment from DB first
      Ticket ticket = attachment.getTicket();
      ticket.getAttachments().remove(attachment);
      ticketRepository.save(ticket);
      attachmentRepository.deleteById(id);
      attachmentRepository.flush();
      ticketRepository.flush();
      List<Attachment> attachmensWithSameFile =
          attachmentRepository.findAllByLocation(attachmentPath);
      // No attachments exist pointing to the same file, so delete the attachment file and its
      // thumbnail if it exists
      if (attachmensWithSameFile.size() == 0) {
        String attachmentsDir =
            attachmentsDirectory + (attachmentsDirectory.endsWith("/") ? "" : "/");
        File attachmentFile = new File(attachmentsDir + "/" + attachmentPath);
        if (!attachmentFile.delete()) {
          throw new SnomioProblem(
              "/api/attachments/" + id,
              "Could not delete Attachment! Check attachment file at "
                  + attachmentsDir
                  + "/"
                  + attachmentPath,
              HttpStatus.INTERNAL_SERVER_ERROR);
        }
        logger.info("Deleted attachment file " + attachmentPath);
        if (!thumbPath.isEmpty()) {
          File thumbFile = new File(attachmentsDir + "/" + thumbPath);
          if (!thumbFile.delete()) {
            throw new SnomioProblem(
                "/api/attachments/" + id,
                "Could not delete Thumbnail for attachment! Check thumbnail at "
                    + attachmentsDir
                    + "/"
                    + thumbPath,
                HttpStatus.INTERNAL_SERVER_ERROR);
          }
          logger.info("Deleted thumbnail file " + thumbPath);
        }
      } else {
        logger.warn(
            "Didn't delete "
                + attachmentPath
                + " "
                + attachmensWithSameFile.size()
                + " other attachment(s) are sharing the same file");
      }
      return ResponseEntity.ok().build();
    } else {
      return ResponseEntity.notFound().build();
    }
  }
}
