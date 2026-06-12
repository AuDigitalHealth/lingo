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

import au.gov.digitalhealth.lingo.exception.ErrorMessages;
import au.gov.digitalhealth.tickets.AttachmentUploadResponse;
import au.gov.digitalhealth.tickets.TicketTestBaseLocal;
import au.gov.digitalhealth.tickets.helper.AttachmentUrlDto;
import au.gov.digitalhealth.tickets.models.Attachment;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.AttachmentRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import io.restassured.http.ContentType;
import java.io.File;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

class AttachmentControllerTest extends TicketTestBaseLocal {

  @Autowired AttachmentRepository attachmentRepository;
  @Autowired TicketRepository ticketRepository;

  @Value("${snomio.attachments.directory}")
  private String attachmentsDirectory;

  @BeforeEach
  public void importTickets() throws IOException {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .post(
            this.getSnomioLocation()
                + "/api/ticketimport?importPath="
                + new ClassPathResource("test-jira-export.json").getFile().getAbsolutePath())
        .then()
        .log()
        .all()
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
    String sha = calculateSha256(theFile);
    Assertions.assertEquals(sha, attachmentToTest.getSha256());
  }

  @Test
  void downloadAttachment_notFound_returns404() {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/attachments/download/999999")
        .then()
        .statusCode(HttpStatus.NOT_FOUND.value());
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
    String sha = calculateSha256(theFile);
    String attachmentsDir = attachmentsDirectory + (attachmentsDirectory.endsWith("/") ? "" : "/");
    String thumbSha =
        calculateSha256(
            FileUtils.readFileToByteArray(
                new File(attachmentsDir + "/" + attachmentToTest.getThumbnailLocation())));
    Assertions.assertEquals(sha, thumbSha);
  }

  @Test
  void downloadThumbnail_notFound_returns404() {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/attachments/thumbnail/999999")
        .then()
        .statusCode(HttpStatus.NOT_FOUND.value());
  }

  @Test
  void downloadAttachmentJson() {
    List<Attachment> attachments = attachmentRepository.findAll();
    Attachment attachmentToTest =
        attachments.stream()
            .filter(attachment -> attachment.getThumbnailLocation() != null)
            .findFirst()
            .get();
    Attachment theAttachment = getAttachmentJson(attachmentToTest.getId());
    Assertions.assertEquals(attachmentToTest, theAttachment);
    Assertions.assertEquals(
        "Adobe Portable Document Format", theAttachment.getAttachmentType().getName());
  }

  @Test
  void getAttachment_notFound_returns404() {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/attachments/999999")
        .then()
        .statusCode(HttpStatus.NOT_FOUND.value());
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
    List<Long> ticketIds = tickets.stream().map(Ticket::getId).toList();
    Long newTestId = ticketIds.isEmpty() ? 0L : Collections.max(ticketIds) + 1;
    String badUrl = this.getSnomioLocation() + "/api/attachments/upload/" + newTestId;

    ProblemDetail badResponse =
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
            .as(ProblemDetail.class);
    Assertions.assertTrue(
        badResponse
            .getDetail()
            .matches(ErrorMessages.TICKET_ID_NOT_FOUND.replace("%s", newTestId.toString())));

    AttachmentUploadResponse response =
        createAttachment(
            url,
            new File(
                new ClassPathResource("attachments/AA-3112/_thumb_3.png")
                    .getFile()
                    .getAbsolutePath()),
            "image/png");

    url = this.getSnomioLocation() + "/api/attachments/" + response.getAttachmentId();
    Attachment theAttachment =
        withAuth().when().get(url).then().statusCode(200).extract().as(Attachment.class);
    String attachmentsDir = attachmentsDirectory + (attachmentsDirectory.endsWith("/") ? "" : "/");
    String sha =
        calculateSha256(
            FileUtils.readFileToByteArray(
                new File(attachmentsDir + "/" + theAttachment.getLocation())));
    Assertions.assertEquals(theAttachment.getSha256(), sha);
    Assertions.assertNotNull(theAttachment.getThumbnailLocation());
    String thumbSha = calculateSha256(getThumbnail(theAttachment));
    Assertions.assertNotNull(thumbSha);
  }

  @Test
  void uploadAttachmentsFromUrls() throws IOException {
    List<Ticket> tickets = ticketRepository.findAll();
    Ticket ticketToTest = tickets.stream().findFirst().orElseThrow();

    String url =
        this.getSnomioLocation() + "/api/attachments/upload/" + ticketToTest.getId() + "/from-urls";

    // Missing fileName
    AttachmentUrlDto missingFileName = new AttachmentUrlDto();
    missingFileName.setUrl("https://example.com/file.pdf");

    // Blank url
    AttachmentUrlDto blankUrl = new AttachmentUrlDto();
    blankUrl.setFileName("file.pdf");
    blankUrl.setUrl("  ");

    // Too long fileName (over 255 chars)
    AttachmentUrlDto longName = new AttachmentUrlDto();
    longName.setFileName("a".repeat(300));
    longName.setUrl("https://example.com/file.pdf");

    // Invalid URL
    AttachmentUrlDto invalidUrl = new AttachmentUrlDto();
    invalidUrl.setFileName("file.pdf");
    invalidUrl.setUrl("not-a-valid-url");

    List<AttachmentUrlDto> invalidList = List.of(missingFileName, blankUrl, longName, invalidUrl);

    // Entire list invalid -> Bad Request
    withAuth()
        .contentType(ContentType.JSON)
        .body(invalidList)
        .when()
        .post(url)
        .then()
        .statusCode(HttpStatus.BAD_REQUEST.value());

    // Single-item invalid -> Bad Request
    withAuth()
        .contentType(ContentType.JSON)
        .body(List.of(missingFileName))
        .when()
        .post(url)
        .then()
        .statusCode(HttpStatus.BAD_REQUEST.value());

    AttachmentUrlDto attachmentDto = new AttachmentUrlDto();
    attachmentDto.setFileName("smoll.pdf");
    attachmentDto.setUrl(
        "https://adha-ncts-request-attachments-prod.s3.ap-southeast-2.amazonaws.com/b7f7d7763e9e4925a26a40c1db24081d");
    List<au.gov.digitalhealth.tickets.helper.AttachmentUrlDto> request = List.of(attachmentDto);

    AttachmentUploadResponse[] responses =
        withAuth()
            .contentType(ContentType.JSON)
            .body(request)
            .when()
            .post(url)
            .then()
            .statusCode(HttpStatus.OK.value())
            .extract()
            .as(AttachmentUploadResponse[].class);

    Assertions.assertEquals(1, responses.length);
    AttachmentUploadResponse resp = responses[0];
    Assertions.assertNotNull(resp);
    Assertions.assertNotNull(resp.getAttachmentId());

    Attachment theAttachment = getAttachmentJson(resp.getAttachmentId());
    Assertions.assertNotNull(theAttachment);
    Assertions.assertEquals("smoll.pdf", theAttachment.getFilename());
    Assertions.assertNotNull(theAttachment.getLocation());
  }

  @Test
  void uploadAttachmentsFromUrls_blankUrl_returnsBadRequest() {
    List<Ticket> tickets = ticketRepository.findAll();
    Ticket ticketToTest = tickets.stream().findFirst().orElseThrow();

    String url =
        this.getSnomioLocation() + "/api/attachments/upload/" + ticketToTest.getId() + "/from-urls";

    AttachmentUrlDto blankUrl = new AttachmentUrlDto();
    blankUrl.setFileName("file.pdf");
    blankUrl.setUrl("  ");

    // A blank url is rejected by bean validation on the request body (@NotBlank), before the
    // service is invoked.
    String body =
        withAuth()
            .contentType(ContentType.JSON)
            .body(List.of(blankUrl))
            .when()
            .post(url)
            .then()
            .statusCode(HttpStatus.BAD_REQUEST.value())
            .extract()
            .asString();

    Assertions.assertTrue(
        body.contains("url must not be blank"),
        "Response should contain the bean-validation message for the blank url");
  }

  @Test
  void uploadAttachmentsFromUrls_malformedUrl_badRequestDetailContainsContext() {
    List<Ticket> tickets = ticketRepository.findAll();
    Ticket ticketToTest = tickets.stream().findFirst().orElseThrow();
    Long ticketId = ticketToTest.getId();

    String url = this.getSnomioLocation() + "/api/attachments/upload/" + ticketId + "/from-urls";

    AttachmentUrlDto malformedUrl = new AttachmentUrlDto();
    malformedUrl.setFileName("report.pdf");
    malformedUrl.setUrl("http://localhost:0/no-such-server/report.pdf");

    ProblemDetail response =
        withAuth()
            .contentType(ContentType.JSON)
            .body(List.of(malformedUrl))
            .when()
            .post(url)
            .then()
            .statusCode(HttpStatus.BAD_REQUEST.value())
            .extract()
            .as(ProblemDetail.class);

    Assertions.assertNotNull(response.getDetail());
    Assertions.assertTrue(
        response.getDetail().contains("report.pdf"), "Detail should contain the file name");
    Assertions.assertTrue(
        response.getDetail().contains(ticketId.toString()), "Detail should contain the ticket ID");
  }

  @Test
  void uploadAttachmentsFromUrls_fileScheme_rejected() throws IOException {
    List<Ticket> tickets = ticketRepository.findAll();
    Ticket ticketToTest = tickets.stream().findFirst().orElseThrow();
    Long ticketId = ticketToTest.getId();

    String endpointUrl =
        this.getSnomioLocation() + "/api/attachments/upload/" + ticketId + "/from-urls";

    // A file:// URL pointing at a local resource must be rejected: only http/https are permitted,
    // otherwise the endpoint could be abused to disclose arbitrary local files (SSRF/LFI).
    File sourceFile = new ClassPathResource("grrfile.grr").getFile();
    String fileUrl = sourceFile.toURI().toURL().toString();

    AttachmentUrlDto dto = new AttachmentUrlDto();
    dto.setFileName("data.grr");
    dto.setUrl(fileUrl);

    ProblemDetail response =
        withAuth()
            .contentType(ContentType.JSON)
            .body(List.of(dto))
            .when()
            .post(endpointUrl)
            .then()
            .statusCode(HttpStatus.BAD_REQUEST.value())
            .extract()
            .as(ProblemDetail.class);

    Assertions.assertEquals("Failed to upload attachment from URL", response.getTitle());
    Assertions.assertNotNull(response.getDetail());
    Assertions.assertTrue(
        response.getDetail().contains("http and https"),
        "Detail should reference the unsupported scheme rejection");
    Assertions.assertTrue(
        response.getDetail().contains("data.grr"), "Detail should contain the file name");
    Assertions.assertTrue(
        response.getDetail().contains(ticketId.toString()), "Detail should contain the ticket ID");
  }

  @Test
  void uploadAttachmentsFromUrls_emptyList_returnsBadRequest() {
    List<Ticket> tickets = ticketRepository.findAll();
    Ticket ticketToTest = tickets.stream().findFirst().orElseThrow();

    String url =
        this.getSnomioLocation() + "/api/attachments/upload/" + ticketToTest.getId() + "/from-urls";

    ProblemDetail response =
        withAuth()
            .contentType(ContentType.JSON)
            .body(List.of())
            .when()
            .post(url)
            .then()
            .statusCode(HttpStatus.BAD_REQUEST.value())
            .extract()
            .as(ProblemDetail.class);

    Assertions.assertTrue(response.getDetail().contains("empty"));
  }

  @Test
  void uploadAttachmentsFromUrls_ticketNotFound_returns404() {
    List<Ticket> tickets = ticketRepository.findAll();
    List<Long> ticketIds = tickets.stream().map(Ticket::getId).toList();
    Long nonExistentTicketId = ticketIds.isEmpty() ? 1L : Collections.max(ticketIds) + 1;

    String url =
        this.getSnomioLocation() + "/api/attachments/upload/" + nonExistentTicketId + "/from-urls";

    AttachmentUrlDto attachmentDto = new AttachmentUrlDto();
    attachmentDto.setFileName("test.pdf");
    attachmentDto.setUrl(
        "https://adha-ncts-request-attachments-prod.s3.ap-southeast-2.amazonaws.com/b7f7d7763e9e4925a26a40c1db24081d");

    ProblemDetail response =
        withAuth()
            .contentType(ContentType.JSON)
            .body(List.of(attachmentDto))
            .when()
            .post(url)
            .then()
            .statusCode(HttpStatus.NOT_FOUND.value())
            .extract()
            .as(ProblemDetail.class);

    Assertions.assertTrue(
        response
            .getDetail()
            .matches(
                ErrorMessages.TICKET_ID_NOT_FOUND.replace("%s", nonExistentTicketId.toString())));
  }

  @Test
  void deleteAttachment() throws IOException {
    List<Ticket> tickets = ticketRepository.findAll();
    Ticket ticketToTest1 = tickets.get(0);
    Ticket ticketToTest2 = tickets.get(1);
    String url1 = this.getSnomioLocation() + "/api/attachments/upload/" + ticketToTest1.getId();
    String url2 = this.getSnomioLocation() + "/api/attachments/upload/" + ticketToTest2.getId();
    List<AttachmentUploadResponse> responses = new ArrayList<AttachmentUploadResponse>();
    responses.add(
        createAttachment(
            url1,
            new File(
                new ClassPathResource("attachments/AA-3112/_thumb_3.png")
                    .getFile()
                    .getAbsolutePath()),
            "image/png"));
    responses.add(
        createAttachment(
            url2,
            new File(
                new ClassPathResource("attachments/AA-3112/_thumb_3.png")
                    .getFile()
                    .getAbsolutePath()),
            "image/png"));
    Long attachmentId1 = responses.get(0).getAttachmentId();
    Long attachmentId2 = responses.get(1).getAttachmentId();
    Attachment attachment1 = getAttachmentJson(attachmentId1);
    Attachment attachment2 = getAttachmentJson(attachmentId2);
    // Remove attachment1
    Assertions.assertEquals(204, removeAttachment(attachmentId1));
    // Try to remove it again but attachment doesn't exist anymore - response 404
    Assertions.assertEquals(404, removeAttachment(attachmentId1));
    // But the attachment file is still there as attachment2 uses it
    String attachmentsDir = attachmentsDirectory + (attachmentsDirectory.endsWith("/") ? "" : "/");
    File attachmentFile1 = new File(attachmentsDir + "/" + attachment1.getLocation());
    Assertions.assertTrue(attachmentFile1.exists());
    // Make sure attachment1 and attachment2 had the same file
    Assertions.assertEquals(attachment1.getLocation(), attachment2.getLocation());
    // Make sure attachment file and thumbnail exist before removing last attachment
    File attachmentFile2 = new File(attachmentsDir + "/" + attachment2.getLocation());
    File thumbFile2 = new File(attachmentsDir + "/" + attachment2.getThumbnailLocation());
    Assertions.assertTrue(attachmentFile2.exists());
    Assertions.assertTrue(thumbFile2.exists());
    // Remove attachment2
    // Make sure attachment file and thumbnail are removed
    Assertions.assertEquals(204, removeAttachment(attachmentId2));
    Assertions.assertFalse(attachmentFile2.exists());
    Assertions.assertFalse(thumbFile2.exists());
  }

  @Test
  void checkAttachmentTypes() throws IOException {
    List<Ticket> tickets = ticketRepository.findAll();
    Ticket ticketToTest = tickets.stream().findFirst().orElseThrow();

    String url = this.getSnomioLocation() + "/api/attachments/upload/" + ticketToTest.getId();

    AttachmentUploadResponse response =
        createAttachment(
            url,
            new File(
                new ClassPathResource("attachments/AA-3112/_thumb_3.png")
                    .getFile()
                    .getAbsolutePath()),
            "image/png");

    String url2 = this.getSnomioLocation() + "/api/attachments/" + response.getAttachmentId();
    Attachment theAttachment =
        withAuth().when().get(url2).then().statusCode(200).extract().as(Attachment.class);
    Assertions.assertEquals(
        "Portable Network Graphics (PNG)", theAttachment.getAttachmentType().getName());

    AttachmentUploadResponse response2 =
        createAttachment(
            url,
            new File(new ClassPathResource("grrfile.grr").getFile().getAbsolutePath()),
            "application/grr");

    url2 = this.getSnomioLocation() + "/api/attachments/" + response2.getAttachmentId();
    Attachment theAttachment2 =
        withAuth().when().get(url2).then().statusCode(200).extract().as(Attachment.class);
    Assertions.assertEquals("application/grr", theAttachment2.getAttachmentType().getName());
  }

  private AttachmentUploadResponse createAttachment(String url, File theFile, String contentType) {
    return withAuth()
        .multiPart("file", theFile, contentType)
        .when()
        .post(url)
        .then()
        .log()
        .all()
        .statusCode(200)
        .extract()
        .as(AttachmentUploadResponse.class);
  }

  private int removeAttachment(Long attachmentId) {
    String url = this.getSnomioLocation() + "/api/attachments/" + attachmentId;
    return withAuth().when().delete(url).then().extract().response().getStatusCode();
  }

  private Attachment getAttachmentJson(Long attachmentId) {
    String url = this.getSnomioLocation() + "/api/attachments/" + attachmentId;
    return withAuth()
        .when()
        .get(url)
        .then()
        .statusCode(200)
        .log()
        .all()
        .extract()
        .as(Attachment.class);
  }

  private byte[] getThumbnail(Attachment attachmentToTest) {
    String url =
        this.getSnomioLocation() + "/api/attachments/thumbnail/" + attachmentToTest.getId();

    return withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(url)
        .then()
        .statusCode(200)
        .extract()
        .asByteArray();
  }

  private String calculateSha256(byte[] theFile) throws NoSuchAlgorithmException {
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
