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

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.AttachmentUploadResponse;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.AttachmentRepository;
import au.gov.digitalhealth.tickets.repository.AttachmentTypeRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import java.nio.file.Path;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
class AttachmentServiceTest {

  @Mock AttachmentRepository attachmentRepository;
  @Mock TicketRepository ticketRepository;
  @Mock AttachmentTypeRepository attachmentTypeRepository;

  @Spy @InjectMocks AttachmentService attachmentService;

  @TempDir Path tempAttachmentsDir;

  WireMockServer wireMock;

  private static final long TICKET_ID = 1L;
  private static final byte[] DUMMY_BYTES = new byte[] {0, 1, 2, 3, 4};

  @BeforeEach
  void setUp() {
    wireMock = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
    wireMock.start();
    ReflectionTestUtils.setField(
        attachmentService, "attachmentsDirectory", tempAttachmentsDir.toString());
    ReflectionTestUtils.setField(attachmentService, "urlConnectTimeoutMs", 5000);
    ReflectionTestUtils.setField(attachmentService, "urlReadTimeoutMs", 5000);
  }

  @AfterEach
  void tearDown() {
    wireMock.stop();
  }

  @Test
  void processAttachmentUploadFromUrl_blankUrl_throwsBadRequestWithNoDetail() {
    LingoProblem ex =
        assertThrows(
            LingoProblem.class,
            () ->
                attachmentService.processAttachmentUploadFromUrl(
                    TICKET_ID, "  ", "file.pdf", null));

    assertThat(ex.getBody().getTitle()).isEqualTo("Invalid attachment URL");
  }

  @Test
  void processAttachmentUploadFromUrl_ticketNotFound_throwsNotFound() {
    stubFile("/file.pdf");
    when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.empty());

    assertThrows(
        ResourceNotFoundProblem.class,
        () ->
            attachmentService.processAttachmentUploadFromUrl(
                TICKET_ID, wireMock.baseUrl() + "/file.pdf", "file.pdf", null));
  }

  @Test
  void processAttachmentUploadFromUrl_unknownExtension_noContentType_throwsBadRequest() {
    stubFile("/data.xyz");
    when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(aTicket()));

    // "Cannot determine content type" LingoProblem is thrown inside the try block and caught
    // by catch (Exception e), so the outer title is "Failed to upload attachment from URL"
    // with the inner problem detail embedded in the exception message.
    LingoProblem ex =
        assertThrows(
            LingoProblem.class,
            () ->
                attachmentService.processAttachmentUploadFromUrl(
                    TICKET_ID, wireMock.baseUrl() + "/data.xyz", "data.xyz", null));

    assertThat(ex.getBody().getTitle()).isEqualTo("Failed to upload attachment from URL");
    assertThat(ex.getBody().getDetail()).contains("Cannot determine content type");
    assertThat(ex.getBody().getDetail()).contains("data.xyz");
    assertThat(ex.getBody().getDetail()).contains(String.valueOf(TICKET_ID));
  }

  @Test
  void processAttachmentUploadFromUrl_nullFilename_noContentType_throwsBadRequest() {
    // null fileName falls back to the temp file name (attachment-XXXXXX.tmp) — .tmp has no MIME
    // type
    stubFile("/download");
    when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(aTicket()));

    LingoProblem ex =
        assertThrows(
            LingoProblem.class,
            () ->
                attachmentService.processAttachmentUploadFromUrl(
                    TICKET_ID, wireMock.baseUrl() + "/download", null, null));

    assertThat(ex.getBody().getTitle()).isEqualTo("Failed to upload attachment from URL");
    assertThat(ex.getBody().getDetail()).contains("Cannot determine content type");
    assertThat(ex.getBody().getDetail()).contains(String.valueOf(TICKET_ID));
  }

  @Test
  void processAttachmentUploadFromUrl_readTimeout_throwsBadRequest() {
    // Stub returns after 2 s; read timeout is 1 ms, so URLConnection fires SocketTimeoutException
    wireMock.stubFor(
        get(urlEqualTo("/slow.pdf"))
            .willReturn(aResponse().withFixedDelay(2000).withStatus(200).withBody(DUMMY_BYTES)));
    ReflectionTestUtils.setField(attachmentService, "urlReadTimeoutMs", 1);
    when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(aTicket()));

    LingoProblem ex =
        assertThrows(
            LingoProblem.class,
            () ->
                attachmentService.processAttachmentUploadFromUrl(
                    TICKET_ID, wireMock.baseUrl() + "/slow.pdf", "slow.pdf", null));

    assertThat(ex.getBody().getTitle()).isEqualTo("Failed to upload attachment from URL");
    assertThat(ex.getBody().getDetail()).contains(wireMock.baseUrl() + "/slow.pdf");
    assertThat(ex.getBody().getDetail()).contains(String.valueOf(TICKET_ID));
  }

  @Test
  void processAttachmentUploadFromUrl_explicitContentType_bypassesProbing() {
    // Unknown extension .xyz would normally fail content type resolution,
    // but an explicit contentType param must be used directly without probing.
    stubFile("/data.xyz");
    when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(aTicket()));

    AttachmentUploadResponse mockResponse =
        AttachmentUploadResponse.builder()
            .attachmentId(99L)
            .ticketId(TICKET_ID)
            .message(AttachmentUploadResponse.MESSAGE_SUCCESS)
            .build();
    doReturn(mockResponse)
        .when(attachmentService)
        .processAttachmentUpload(eq(TICKET_ID), any(MultipartFile.class));

    AttachmentUploadResponse response =
        attachmentService.processAttachmentUploadFromUrl(
            TICKET_ID, wireMock.baseUrl() + "/data.xyz", "data.xyz", "application/octet-stream");

    assertThat(response.getAttachmentId()).isEqualTo(99L);
    assertThat(response.getTicketId()).isEqualTo(TICKET_ID);
  }

  @Test
  void processAttachmentUploadFromUrl_pdfExtension_noContentType_resolvedFromFilename() {
    // application/pdf is resolvable from the .pdf extension via URLConnection
    stubFile("/report.pdf");
    when(ticketRepository.findById(TICKET_ID)).thenReturn(Optional.of(aTicket()));

    AttachmentUploadResponse mockResponse =
        AttachmentUploadResponse.builder()
            .attachmentId(100L)
            .ticketId(TICKET_ID)
            .message(AttachmentUploadResponse.MESSAGE_SUCCESS)
            .build();
    doReturn(mockResponse)
        .when(attachmentService)
        .processAttachmentUpload(eq(TICKET_ID), any(MultipartFile.class));

    AttachmentUploadResponse response =
        attachmentService.processAttachmentUploadFromUrl(
            TICKET_ID, wireMock.baseUrl() + "/report.pdf", "report.pdf", null);

    assertThat(response.getAttachmentId()).isEqualTo(100L);
  }

  private void stubFile(String path) {
    wireMock.stubFor(
        get(urlEqualTo(path)).willReturn(aResponse().withStatus(200).withBody(DUMMY_BYTES)));
  }

  private Ticket aTicket() {
    Ticket ticket = new Ticket();
    ReflectionTestUtils.setField(ticket, "id", TICKET_ID);
    return ticket;
  }
}
