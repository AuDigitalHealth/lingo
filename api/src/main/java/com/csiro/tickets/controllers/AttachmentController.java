package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.models.Attachment;
import com.csiro.tickets.repository.AttachmentRepository;
import com.csiro.tickets.repository.TicketRepository;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.SQLException;
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

  @Autowired AttachmentRepository attachmentRepository;

  @Autowired TicketRepository ticketRepository;

  @Value("${snomio.attachments.directory}")
  private String attachmentsDirectory;

  protected final Log logger = LogFactory.getLog(getClass());

  // TODO: Needs a test
  @GetMapping("/api/download/{id}")
  public ResponseEntity<ByteArrayResource> downloadAttachment(@PathVariable Long id)
      throws IOException, SQLException {
    Optional<Attachment> attachmentOptional = attachmentRepository.findById(id);
    if (attachmentOptional.isPresent()) {
      Attachment attachment = attachmentOptional.get();
      return getFile(attachment);
    } else {
      return ResponseEntity.notFound().build();
    }
  }

  ResponseEntity<ByteArrayResource> getFile(Attachment attachment) {
    try {
      File attachmentFile = new File(attachmentsDirectory + attachment.getLocation());
      ByteArrayResource data =
          new ByteArrayResource(Files.readAllBytes(Paths.get(attachmentFile.getAbsolutePath())));
      HttpHeaders headers = new HttpHeaders();
      headers.add(
          HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + attachment.getFilename());
      MediaType mediaType = MediaType.parseMediaType(attachment.getAttachmentType().getMimeType());
      return ResponseEntity.ok()
          .headers(headers)
          .contentLength(data.contentLength())
          .contentType(mediaType)
          .body(data);
    } catch (IOException e) {
      throw new ResourceNotFoundProblem(
          "Could not find attachment "
              + attachment.getFilename()
              + " wtih id "
              + attachment.getId());
    }
  }
}
