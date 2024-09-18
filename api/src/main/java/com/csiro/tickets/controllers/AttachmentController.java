package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ErrorMessages;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.exception.SnomioProblem;
import com.csiro.tickets.AttachmentUploadResponse;
import com.csiro.tickets.helper.AttachmentUtils;
import com.csiro.tickets.models.Attachment;
import com.csiro.tickets.models.AttachmentType;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.AttachmentRepository;
import com.csiro.tickets.repository.AttachmentTypeRepository;
import com.csiro.tickets.repository.TicketRepository;
import com.csiro.tickets.service.AttachmentService;
import jakarta.transaction.Transactional;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.NoSuchAlgorithmException;
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

  private static final String UPLOAD_API = "/api/attachments/upload/";
  protected final Log logger = LogFactory.getLog(getClass());
  final AttachmentRepository attachmentRepository;
  final AttachmentTypeRepository attachmentTypeRepository;
  final TicketRepository ticketRepository;

  final AttachmentService attachmentService;

  @Value("${snomio.attachments.directory}")
  private String attachmentsDirectory;

  public AttachmentController(
      AttachmentRepository attachmentRepository,
      TicketRepository ticketRepository,
      AttachmentTypeRepository attachmentTypeRepository,
      AttachmentService attachmentService) {
    this.attachmentRepository = attachmentRepository;
    this.ticketRepository = ticketRepository;
    this.attachmentTypeRepository = attachmentTypeRepository;
    this.attachmentService = attachmentService;
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

  @PostMapping(value = UPLOAD_API + "{ticketId}", produces = MediaType.APPLICATION_JSON_VALUE)
  @Transactional
  public ResponseEntity<AttachmentUploadResponse> uploadAttachment(
      @PathVariable Long ticketId, @RequestParam("file") MultipartFile file) {
    if (file.isEmpty()) {
      throw new SnomioProblem(
          UPLOAD_API + ticketId,
          "File is empty!",
          HttpStatus.BAD_REQUEST,
          "The file you are trying to upload is empty. [" + file.getOriginalFilename() + "]");
    }
    String attachmentsDir = attachmentsDirectory + (attachmentsDirectory.endsWith("/") ? "" : "/");
    Ticket theTicket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));
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
      AttachmentType attachmentType = getExistingAttachmentType(contentType, ticketId);

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

      generateThumbnail(attachmentsDir, attachmentFile, newAttachment);

      // Save the attachment in the DB
      attachmentRepository.save(newAttachment);
      return ResponseEntity.ok(
          AttachmentUploadResponse.builder()
              .message(AttachmentUploadResponse.MESSAGE_SUCCESS)
              .attachmentId(newAttachment.getId())
              .ticketId(ticketId)
              .sha256(attachmentSHA)
              .build());
    } catch (IOException | NoSuchAlgorithmException e) {
      throw new SnomioProblem(
          UPLOAD_API + ticketId,
          "Could not upload file: " + file.getOriginalFilename(),
          HttpStatus.INTERNAL_SERVER_ERROR,
          e.getMessage());
    }
  }

  // Generate thumbnail for the attachment if it's an image
  private void generateThumbnail(
      String attachmentsDir, File attachmentFile, Attachment newAttachment) throws IOException {
    if (newAttachment.getAttachmentType().getMimeType().startsWith("image")
        && (AttachmentUtils.saveThumbnail(
            attachmentFile,
            AttachmentUtils.getThumbnailAbsolutePath(attachmentsDir, newAttachment.getSha256())))) {
      newAttachment.setThumbnailLocation(
          AttachmentUtils.getThumbnailRelativePath(newAttachment.getSha256()));
    }
  }

  private AttachmentType getExistingAttachmentType(String contentType, Long ticketId) {
    if (contentType == null || contentType.isEmpty()) {
      throw new SnomioProblem(
          UPLOAD_API + ticketId, "Missing Content type", HttpStatus.INTERNAL_SERVER_ERROR);
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
    return attachmentType;
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
    if (!attachmentOptional.isPresent()) {
      throw new ResourceNotFoundProblem(
          "Attachment " + id + " does not exist and cannot be deleted");
    }
    Attachment attachment = attachmentOptional.get();
    attachmentRepository.deleteById(id);
    attachmentRepository.flush();
    // Remove the attachment files if we can
    attachmentService.deleteAttachmentFiles(attachment);
    return ResponseEntity.noContent().build();
  }
}
