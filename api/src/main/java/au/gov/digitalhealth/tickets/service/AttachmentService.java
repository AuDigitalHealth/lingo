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

import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.tickets.models.Attachment;
import au.gov.digitalhealth.tickets.repository.AttachmentRepository;
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
