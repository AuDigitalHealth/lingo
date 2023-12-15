package com.csiro.tickets.controllers;

import com.csiro.tickets.TicketTestBase;
import com.csiro.tickets.controllers.dto.ImportResponse;
import com.csiro.tickets.models.Attachment;
import com.csiro.tickets.repository.AttachmentRepository;
import io.restassured.http.ContentType;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;

class AttachmentControllerTest extends TicketTestBase {

  @Autowired AttachmentRepository attachmentRepository;

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
  void downloadFile() throws NoSuchAlgorithmException {
    List<Attachment> attachments = attachmentRepository.findAll();
    Attachment attachmentToTest = attachments.get(0);
    byte[] theFile =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .get(this.getSnomioLocation() + "/api/download/" + attachmentToTest.getId())
            .then()
            .statusCode(200)
            .extract()
            .asByteArray();
    String sha = caclulateSha256(theFile);
    Assertions.assertEquals(sha, attachmentToTest.getSha256());
  }

  @Test
  void downloadThumbnail() throws NoSuchAlgorithmException {

    List<Attachment> attachments = attachmentRepository.findAll();
    Attachment attachmentToTest =
        attachments.stream()
            .filter(attachment -> attachment.getThumbnailLocation() != null)
            .findFirst()
            .get();
    String url =
        this.getSnomioLocation() + "/api/thumbnail/" + attachmentToTest.getThumbnailLocation();

    byte[] theFile =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .get(url)
            .then()
            .statusCode(200)
            .extract()
            .asByteArray();
    String sha = caclulateSha256(theFile);
    Assertions.assertEquals(sha, attachmentToTest.getSha256());
  }

  private String caclulateSha256(byte[] theFile) throws NoSuchAlgorithmException {
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
