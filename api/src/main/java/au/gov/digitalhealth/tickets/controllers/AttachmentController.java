/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.tickets.controllers;

import static au.gov.digitalhealth.tickets.service.AttachmentService.UPLOAD_API;

import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.AttachmentUploadResponse;
import au.gov.digitalhealth.tickets.helper.AttachmentUrlDto;
import au.gov.digitalhealth.tickets.models.Attachment;
import au.gov.digitalhealth.tickets.repository.AttachmentRepository;
import au.gov.digitalhealth.tickets.service.AttachmentService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class AttachmentController {

  protected final Log logger = LogFactory.getLog(getClass());
  final AttachmentRepository attachmentRepository;

  final AttachmentService attachmentService;

  @Value("${snomio.attachments.directory}")
  private String attachmentsDirectory;

  public AttachmentController(
      AttachmentRepository attachmentRepository, AttachmentService attachmentService) {

    this.attachmentRepository = attachmentRepository;

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
    return ResponseEntity.ok(attachmentService.processAttachmentUpload(ticketId, file));
  }

  @PostMapping(
      value = UPLOAD_API + "{ticketId}/from-urls",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  @Transactional
  public ResponseEntity<List<AttachmentUploadResponse>> uploadAttachmentsFromUrls(
      @PathVariable Long ticketId, @Valid @RequestBody List<AttachmentUrlDto> request) {

    if (request == null || request.isEmpty()) {
      throw new LingoProblem(
          UPLOAD_API + ticketId,
          "No attachments provided",
          HttpStatus.BAD_REQUEST,
          "Attachment list is empty");
    }

    List<AttachmentUploadResponse> responses = new ArrayList<>();

    for (AttachmentUrlDto attachment : request) {
      responses.add(
          attachmentService.processAttachmentUploadFromUrl(
              ticketId,
              attachment.getUrl(),
              attachment.getFileName(),
              attachment.getContentType()));
    }

    return ResponseEntity.ok(responses);
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
