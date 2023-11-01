package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.models.Attachment;
import com.csiro.tickets.repository.AttachmentRepository;
import com.csiro.tickets.repository.TicketRepository;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Optional;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AttachmentController {

  protected final Log logger = LogFactory.getLog(getClass());
  final AttachmentRepository attachmentRepository;
  final TicketRepository ticketRepository;

  @Value("${snomio.attachments.directory}")
  private String attachmentsDirectory;

  @Autowired
  public AttachmentController(
      AttachmentRepository attachmentRepository, TicketRepository ticketRepository) {
    this.attachmentRepository = attachmentRepository;
    this.ticketRepository = ticketRepository;
  }

  @GetMapping("/api/download/{id}")
  public ResponseEntity<ByteArrayResource> downloadAttachment(@PathVariable Long id) {
    Optional<Attachment> attachmentOptional = attachmentRepository.findById(id);
    if (attachmentOptional.isPresent()) {
      Attachment attachment = attachmentOptional.get();
      return getFile(attachment, false);
    } else {
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/api/thumbnail/{attachmentId}/{thumbnailFile}")
  public ResponseEntity<ByteArrayResource> getThumbnail(
      @PathVariable Long attachmentId, @PathVariable String thumbnailFile) {
    Optional<Attachment> attachmentOptional =
        attachmentRepository.findByThumbnailLocation(attachmentId + "/" + thumbnailFile);
    if (attachmentOptional.isPresent()) {
      Attachment attachment = attachmentOptional.get();
      return getFile(attachment, true);
    } else {
      return ResponseEntity.notFound().build();
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
}
