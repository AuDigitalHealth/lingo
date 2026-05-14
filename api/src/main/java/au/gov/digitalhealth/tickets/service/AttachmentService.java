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
package au.gov.digitalhealth.tickets.service;

import au.gov.digitalhealth.lingo.exception.ErrorMessages;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.AttachmentUploadResponse;
import au.gov.digitalhealth.tickets.helper.AttachmentUtils;
import au.gov.digitalhealth.tickets.helper.MimeTypeUtils;
import au.gov.digitalhealth.tickets.helper.PathMultipartFile;
import au.gov.digitalhealth.tickets.models.Attachment;
import au.gov.digitalhealth.tickets.models.AttachmentType;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.AttachmentRepository;
import au.gov.digitalhealth.tickets.repository.AttachmentTypeRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Optional;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AttachmentService {
  public static final String UPLOAD_API = "/api/attachments/upload/";
  final AttachmentRepository attachmentRepository;
  final TicketRepository ticketRepository;
  final AttachmentTypeRepository attachmentTypeRepository;

  @Value("${snomio.attachments.directory}")
  private String attachmentsDirectory;

  protected final Log logger = LogFactory.getLog(getClass());

  @Autowired
  public AttachmentService(
      AttachmentRepository attachmentRepository,
      TicketRepository ticketRepository,
      AttachmentTypeRepository attachmentTypeRepository) {
    this.attachmentRepository = attachmentRepository;
    this.ticketRepository = ticketRepository;
    this.attachmentTypeRepository = attachmentTypeRepository;
  }

  public AttachmentUploadResponse processAttachmentUpload(Long ticketId, MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new LingoProblem(
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

      attachmentRepository.save(newAttachment);

      return AttachmentUploadResponse.builder()
          .message(AttachmentUploadResponse.MESSAGE_SUCCESS)
          .attachmentId(newAttachment.getId())
          .ticketId(ticketId)
          .sha256(attachmentSHA)
          .build();

    } catch (IOException | NoSuchAlgorithmException e) {
      throw new LingoProblem(
          UPLOAD_API + ticketId,
          "Could not upload file: " + file.getOriginalFilename(),
          HttpStatus.INTERNAL_SERVER_ERROR,
          e.getMessage());
    }
  }

  public AttachmentUploadResponse processAttachmentUploadFromUrl(
      Long ticketId, String url, String fileName, String contentType) {

    if (url == null || url.isBlank()) {
      throw new LingoProblem(
          UPLOAD_API + ticketId,
          "Invalid attachment URL",
          HttpStatus.BAD_REQUEST,
          "Attachment URL is missing");
    }
    Ticket theTicket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));
    Path tempFile = null;

    try (InputStream in = new URL(url).openStream()) {

      tempFile = Files.createTempFile("attachment-", ".tmp");
      Files.copy(in, tempFile, StandardCopyOption.REPLACE_EXISTING);

      String resolvedFileName = fileName != null ? fileName : tempFile.getFileName().toString();

      String resolvedContentType =
          contentType != null && !contentType.isBlank() ? contentType : null;
      if (resolvedContentType == null) {
        resolvedContentType = Files.probeContentType(Path.of(resolvedFileName));
      }
      if (resolvedContentType == null) {
        resolvedContentType = URLConnection.guessContentTypeFromName(resolvedFileName);
      }
      if (resolvedContentType == null) {
        logger.error(
            String.format(
                "Cannot determine content type for attachment: ticketId=%d, url=%s, fileName=%s",
                ticketId, url, resolvedFileName));
        throw new LingoProblem(
            UPLOAD_API + ticketId,
            "Cannot determine content type",
            HttpStatus.BAD_REQUEST,
            String.format(
                "Could not determine content type for file '%s' from url '%s' (ticketId=%d)."
                    + " Provide the content type explicitly.",
                resolvedFileName, url, ticketId));
      }

      logger.info(
          String.format(
              "Processing attachment from URL: ticketId=%d, url=%s, fileName=%s, contentType=%s",
              ticketId, url, resolvedFileName, resolvedContentType));

      MultipartFile multipartFile =
          new PathMultipartFile(tempFile, resolvedFileName, resolvedContentType);

      return processAttachmentUpload(theTicket.getId(), multipartFile);

    } catch (Exception e) {
      logger.error(
          String.format(
              "Failed to upload attachment from URL: ticketId=%d, url=%s, fileName=%s, error=%s",
              ticketId, url, fileName, e.getMessage()),
          e);
      throw new LingoProblem(
          UPLOAD_API + ticketId,
          "Failed to upload attachment from URL",
          HttpStatus.BAD_REQUEST,
          String.format(
              "Failed to process attachment '%s' from url '%s' (ticketId=%d): %s",
              fileName, url, ticketId, e.getMessage()));

    } finally {
      if (tempFile != null) {
        try {
          Files.deleteIfExists(tempFile);
        } catch (IOException ignored) {
        }
      }
    }
  }

  private AttachmentType getExistingAttachmentType(String contentType, Long ticketId) {
    if (contentType == null || contentType.isEmpty()) {
      throw new LingoProblem(
          UPLOAD_API + ticketId, "Missing Content type", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    Optional<AttachmentType> existing = attachmentTypeRepository.findByMimeType(contentType);
    if (existing.isPresent()) {
      return existing.get();
    }
    attachmentTypeRepository.upsertAttachmentType(
        contentType, MimeTypeUtils.toHumanReadable(contentType));
    return attachmentTypeRepository
        .findByMimeType(contentType)
        .orElseThrow(
            () ->
                new LingoProblem(
                    UPLOAD_API + ticketId,
                    "Missing Content in DB",
                    HttpStatus.INTERNAL_SERVER_ERROR));
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

  public void deleteAttachmentFiles(Attachment attachment) {
    String attachmentPath = attachment.getLocation();
    String thumbPath = attachment.getThumbnailLocation();
    List<Attachment> attachmensWithSameFile =
        attachmentRepository.findAllByLocation(attachmentPath);
    if (attachmensWithSameFile.isEmpty()) {
      // No attachments exist pointing to the same file, so delete the attachment file and its
      // thumbnail if it exists
      String attachmentsDir =
          attachmentsDirectory + (attachmentsDirectory.endsWith("/") ? "" : "/");
      File attachmentFile = new File(attachmentsDir + attachmentPath);
      try {
        // SonarLint likes Files.delete
        Files.delete(attachmentFile.toPath());
      } catch (IOException e) {
        throw new LingoProblem(
            "/api/attachments/" + attachment.getId(),
            "Could not delete Attachment! Check attachment file at "
                + attachmentsDir
                + "/"
                + attachmentPath,
            HttpStatus.INTERNAL_SERVER_ERROR);
      }
      logger.info("Deleted attachment file " + attachmentPath);
      if (thumbPath != null && !thumbPath.isEmpty()) {
        File thumbFile = new File(attachmentsDir + thumbPath);
        try {
          Files.delete(thumbFile.toPath());
        } catch (IOException e) {
          throw new LingoProblem(
              "/api/attachments/" + attachment.getId(),
              "Could not delete Thumbnail for attachment! Check thumbnail at "
                  + attachmentsDir
                  + "/"
                  + thumbPath,
              HttpStatus.INTERNAL_SERVER_ERROR);
        }
        logger.info("Deleted thumbnail file " + thumbPath);
      }
    }
  }
}
