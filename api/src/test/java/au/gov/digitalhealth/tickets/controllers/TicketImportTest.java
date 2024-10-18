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

import au.gov.digitalhealth.tickets.AdditionalFieldValueDto;
import au.gov.digitalhealth.tickets.TicketImportDto;
import au.gov.digitalhealth.tickets.TicketTestBaseLocal;
import au.gov.digitalhealth.tickets.repository.CommentRepository;
import au.gov.digitalhealth.tickets.repository.TicketTypeRepository;
import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.http.ContentType;
import java.io.File;
import java.io.IOException;
import java.time.Instant;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;

class TicketImportTest extends TicketTestBaseLocal {
  protected final Log logger = LogFactory.getLog(getClass());
  private final String ticket1Title =
      "TGA - ARTG ID 200051 AZITHROMYCIN AN azithromycin (as monohydrate) 500mg film-coated tablet blister pack";
  private final String ticket2Title =
      "TGA - ARTG ID 191034 SOZOL pantoprazole (as sodium sesquihydrate) 20 mg enteric-coated tablet blister pack.";
  @Autowired TicketServiceImpl ticketService;
  @Autowired TicketTypeRepository ticketTypeRepository;
  @Autowired CommentRepository commentRepository;

  @Test
  void testimportTicket() throws IOException {
    ImportResponse importResopnse =
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

    Assertions.assertTrue(
        importResopnse.getMessage().contains("tickets have been imported successfully"));
    TicketImportDto ticket1 = ticketService.findByTitle(ticket1Title);
    TicketImportDto ticket2 = ticketService.findByTitle(ticket2Title);

    // Ticket 1
    Assertions.assertEquals(Instant.parse("2018-06-13T11:35:58.000+10:00"), ticket1.getCreated());
    Assertions.assertEquals(1371, ticket1.getDescription().length());
    Assertions.assertEquals("To Do", ticket1.getState().getLabel());
    Assertions.assertEquals("Author Product", ticket1.getTicketType().getName());
    Assertions.assertEquals(4, ticket1.getAdditionalFieldValues().size());
    Assertions.assertEquals(0, ticket1.getAttachments().size());
    Assertions.assertEquals(1, ticket1.getLabels().size());
    Assertions.assertEquals("JiraExport", ticket1.getLabels().iterator().next().getName());
    Assertions.assertEquals(1, ticket1.getExternalRequestors().size());
    Assertions.assertEquals(
        "Internal", ticket1.getExternalRequestors().iterator().next().getName());
    Assertions.assertEquals(13, ticket1.getComments().size());

    ticket1
        .getComments()
        .forEach(
            comment -> {
              Assertions.assertEquals(
                  Instant.parse("2018-06-13T11:35:58.000+10:00"), comment.getCreated());
            });

    // Ticket 2
    Assertions.assertEquals(Instant.parse("2018-06-11T11:35:58.000+10:00"), ticket2.getCreated());
    Assertions.assertEquals(1371, ticket2.getDescription().length());
    Assertions.assertEquals("Closed", ticket2.getState().getLabel());
    Assertions.assertEquals("Edit Product", ticket2.getTicketType().getName());
    Assertions.assertEquals(4, ticket2.getAdditionalFieldValues().size());
    AdditionalFieldValueDto artgid2 =
        ticket2.getAdditionalFieldValues().stream()
            .filter(afv -> afv.getAdditionalFieldType().getName().equals("AMTFlags"))
            .findFirst()
            .get();
    Assertions.assertEquals("PBS", artgid2.getValueOf());
    Assertions.assertEquals(3, ticket2.getAttachments().size());
    Assertions.assertEquals(
        "application/pdf", ticket2.getAttachments().get(0).getAttachmentType().getMimeType());
    ticket2
        .getAttachments()
        .forEach(
            comment -> {
              Assertions.assertEquals(
                  Instant.parse("2018-06-11T11:35:58.000+10:00"), comment.getCreated());
            });

    Assertions.assertEquals(0, ticket2.getLabels().size());
    Assertions.assertEquals(17, ticket2.getComments().size());

    Assertions.assertEquals(2, commentRepository.findByText("<p>Closed as per Serge 1</p>").size());
    ticket2
        .getComments()
        .forEach(
            comment -> {
              // Last comment has current date
              if (!comment.getText().contains("AA-4950")) {
                Assertions.assertEquals(
                    Instant.parse("2018-06-11T11:35:58.000+10:00"), comment.getCreated());
              }
            });

    Assertions.assertTrue(
        (ticket1.getSchedule().getName().equals("S4")
            && ticket2.getSchedule().getName().equals("S4")));
  }

  @Test
  void createUpdateFilesTest() throws IOException {
    ImportResponse importResopnse =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .post(
                this.getSnomioLocation()
                    + "/api/ticketimport/createupdatefiles?oldImportFilePath="
                    + new ClassPathResource("test-jira-export.json").getFile().getAbsolutePath()
                    + "&newImportFilePath="
                    + new ClassPathResource("test-jira-export-update.json")
                        .getFile()
                        .getAbsolutePath())
            .then()
            .statusCode(200)
            .extract()
            .as(ImportResponse.class);

    Assertions.assertTrue(
        importResopnse.getMessage().contains("Successfully created new import files at"));

    int startIndex = importResopnse.getMessage().indexOf("[");
    int endIndex = importResopnse.getMessage().indexOf("]");
    String path1 = "";
    String path2 = "";

    if (startIndex != -1 && endIndex != -1) {
      String paths = importResopnse.getMessage().substring(startIndex + 1, endIndex);
      String[] pathArray = paths.split(",");

      if (pathArray.length >= 2) {
        path1 = pathArray[0].trim();
        path2 = pathArray[1].trim();
      }
    }
    Assertions.assertTrue(path1.contains("test-jira-export.json.updates"));
    Assertions.assertTrue(path2.contains("test-jira-export.json.newitems"));

    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.findAndRegisterModules();
    objectMapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);
    try {
      TicketImportDto[] updateDtos;
      TicketImportDto[] newItemsDtos;
      newItemsDtos = objectMapper.readValue(new File(path2), TicketImportDto[].class);
      updateDtos = objectMapper.readValue(new File(path1), TicketImportDto[].class);
      Assertions.assertEquals(0, newItemsDtos.length);
      Assertions.assertEquals(1, updateDtos.length);
      Assertions.assertTrue(updateDtos[0].getTitle().contains("Updated"));
      Assertions.assertEquals("S5", updateDtos[0].getSchedule().getName());

    } catch (IOException e) {
      Assertions.fail("There was an error opening the export files", e);
    }
  }
}
