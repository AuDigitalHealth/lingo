package com.csiro.tickets.service;

import com.csiro.snomio.exception.SnomioProblem;
import com.csiro.tickets.models.Attachment;
import com.csiro.tickets.repository.AttachmentRepository;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AttachmentService {

  final AttachmentRepository attachmentRepository;

  @Value("${snomio.attachments.directory}")
  private String attachmentsDirectory;

  protected final Log logger = LogFactory.getLog(getClass());

  @Autowired
  public AttachmentService(AttachmentRepository attachmentRepository) {
    this.attachmentRepository = attachmentRepository;
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
        throw new SnomioProblem(
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
          throw new SnomioProblem(
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
