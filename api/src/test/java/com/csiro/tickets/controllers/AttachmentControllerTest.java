package com.csiro.tickets.controllers;

import com.csiro.tickets.TicketTestBase;
import com.csiro.tickets.controllers.dto.AttachmentUploadResponse;
import com.csiro.tickets.controllers.dto.ImportResponse;
import com.csiro.tickets.models.Attachment;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.AttachmentRepository;
import com.csiro.tickets.repository.TicketRepository;
import io.restassured.http.ContentType;
import java.io.File;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;

class AttachmentControllerTest extends TicketTestBase {

  @Autowired AttachmentRepository attachmentRepository;
  @Autowired TicketRepository ticketRepository;

  @Value("${snomio.attachments.directory}")
  private String attachmentsDirectory;

  @BeforeEach
  private void importTickets() throws IOException {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .post(
            this.getSnomioLocation()
                + "/api/ticketimport?importPath="
                + new ClassPathResource("test-jira-export.json").getFile().getAbsolutePath())
        .then()
        .statusCode(200)
        .extract()
        .as(ImportResponse.class);
  }

  @Test
  void downloadAttachment() throws NoSuchAlgorithmException {
    List<Attachment> attachments = attachmentRepository.findAll();
    Attachment attachmentToTest = attachments.get(0);
    byte[] theFile =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .get(this.getSnomioLocation() + "/api/attachments/download/" + attachmentToTest.getId())
            .then()
            .statusCode(200)
            .extract()
            .asByteArray();
    String sha = caclulateSha256(theFile);
    Assertions.assertEquals(sha, attachmentToTest.getSha256());
  }

  @Test
  void downloadThumbnail() throws NoSuchAlgorithmException, IOException {
    List<Attachment> attachments = attachmentRepository.findAll();
    Attachment attachmentToTest =
        attachments.stream()
            .filter(attachment -> attachment.getThumbnailLocation() != null)
            .findFirst()
            .get();
    byte[] theFile = getThumbnail(attachmentToTest);
    String sha = caclulateSha256(theFile);
    String attachmentsDir = attachmentsDirectory + (attachmentsDirectory.endsWith("/") ? "" : "/");
    String thumbSha =
        caclulateSha256(
            FileUtils.readFileToByteArray(
                new File(attachmentsDir + "/" + attachmentToTest.getThumbnailLocation())));
    Assertions.assertEquals(sha, thumbSha);
  }

  @Test
  void getAttachmentJson() {
    List<Attachment> attachments = attachmentRepository.findAll();
    Attachment attachmentToTest =
        attachments.stream()
            .filter(attachment -> attachment.getThumbnailLocation() != null)
            .findFirst()
            .get();
    String url = this.getSnomioLocation() + "/api/attachments/" + attachmentToTest.getId();
    Attachment theAttachment =
        withAuth().when().get(url).then().statusCode(200).extract().as(Attachment.class);
    Assertions.assertEquals(attachmentToTest, theAttachment);
  }

  @Test
  void uploadAttachment() throws NoSuchAlgorithmException, IOException {
    List<Ticket> tickets = ticketRepository.findAll();
    Ticket ticketToTest = tickets.stream().findFirst().get();

    String url = this.getSnomioLocation() + "/api/attachments/upload/" + ticketToTest.getId();
    // Empty file error
    // This is coming from Spring but we also have check in the code
    withAuth()
        .multiPart("file", new File("target/emptyfile.png").createNewFile(), "image/png")
        .when()
        .post(url)
        .then()
        .statusCode(HttpStatus.BAD_REQUEST.value());

    // Ticket does not exist
    List<Long> ticketIds = tickets.stream().map(Ticket::getId).collect(Collectors.toList());
    Long newTestId = ticketIds.isEmpty() ? 0l : Collections.max(ticketIds) + 1;
    String badUrl = this.getSnomioLocation() + "/api/attachments/upload/" + newTestId;

    AttachmentUploadResponse badResponse =
        withAuth()
            .multiPart(
                "file",
                new File(
                    new ClassPathResource("attachments/AA-3112/_thumb_3.png")
                        .getFile()
                        .getAbsolutePath()),
                "image/png")
            .when()
            .post(badUrl)
            .then()
            .log()
            .all()
            .statusCode(HttpStatus.NOT_FOUND.value())
            .extract()
            .as(AttachmentUploadResponse.class);
    Assertions.assertEquals(
        badResponse.getMessage(), AttachmentUploadResponse.MESSAGE_MISSINGTICKET);

    AttachmentUploadResponse response =
        withAuth()
            .multiPart(
                "file",
                new File(
                    new ClassPathResource("attachments/AA-3112/_thumb_3.png")
                        .getFile()
                        .getAbsolutePath()),
                "image/png")
            .when()
            .post(url)
            .then()
            .statusCode(200)
            .extract()
            .as(AttachmentUploadResponse.class);

    url = this.getSnomioLocation() + "/api/attachments/" + response.getAttachmentId();
    Attachment theAttachment =
        withAuth().when().get(url).then().statusCode(200).extract().as(Attachment.class);
    String attachmentsDir = attachmentsDirectory + (attachmentsDirectory.endsWith("/") ? "" : "/");
    String sha =
        caclulateSha256(
            FileUtils.readFileToByteArray(
                new File(attachmentsDir + "/" + theAttachment.getLocation())));
    Assertions.assertEquals(theAttachment.getSha256(), sha);
    Assertions.assertNotNull(theAttachment.getThumbnailLocation());
    String thumbSha = caclulateSha256(getThumbnail(theAttachment));
    Assertions.assertNotNull(thumbSha);
  }

  private byte[] getThumbnail(Attachment attachmentToTest) {
    String url =
        this.getSnomioLocation() + "/api/attachments/thumbnail/" + attachmentToTest.getId();

    byte[] theFile =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .get(url)
            .then()
            .statusCode(200)
            .extract()
            .asByteArray();
    return theFile;
  }

  private String caclulateSha256(byte[] theFile) throws NoSuchAlgorithmException {
    if (theFile == null) {
      return null;
    }
    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    byte[] encodedHash = digest.digest(theFile);

    StringBuilder hexString = new StringBuilder(2 * encodedHash.length);
    for (byte b : encodedHash) {
      String hex = Integer.toHexString(0xff & b);
      if (hex.length() == 1) {
        hexString.append('0');
      }
      hexString.append(hex);
    }
    return hexString.toString();
  }
}
