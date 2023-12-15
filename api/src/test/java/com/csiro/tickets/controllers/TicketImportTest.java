package com.csiro.tickets.controllers;


import com.csiro.tickets.TicketTestBase;
import com.csiro.tickets.controllers.dto.ImportResponse;
import com.csiro.tickets.controllers.dto.TicketImportDto;
import com.csiro.tickets.models.AdditionalFieldValue;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.CommentRepository;
import com.csiro.tickets.repository.TicketRepository;
import com.csiro.tickets.repository.TicketTypeRepository;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.http.ContentType;
import java.io.File;
import java.io.IOException;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;

class TicketImportTest extends TicketTestBase {
  @Autowired TicketRepository ticketRepository;

  @Autowired TicketTypeRepository ticketTypeRepository;

  @Autowired CommentRepository commentRepository;

  protected final Log logger = LogFactory.getLog(getClass());

  private final String ticket1Title =
      "TGA - ARTG ID 200051 AZITHROMYCIN AN azithromycin (as monohydrate) 500mg film-coated tablet blister pack";
  private final String ticket2Title =
      "TGA - ARTG ID 191034 SOZOL pantoprazole (as sodium sesquihydrate) 20 mg enteric-coated tablet blister pack.";

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

    Assertions.assertEquals(
        true, importResopnse.getMessage().contains("tickets have been imported successfully"));
    Ticket ticket1 = ticketRepository.findByTitle(ticket1Title).get();
    Ticket ticket2 = ticketRepository.findByTitle(ticket2Title).get();

    // Ticket 1
    Assertions.assertEquals(1371, ticket1.getDescription().length());
    Assertions.assertEquals(true, ticket1.getState().getLabel().equals("To Do"));
    Assertions.assertEquals(true, ticket1.getTicketType().getName().equals("Author Product"));
    Assertions.assertEquals(5, ticket1.getAdditionalFieldValues().size());
    AdditionalFieldValue artgid1 =
        ticket1.getAdditionalFieldValues().stream()
            .filter(afv -> afv.getAdditionalFieldType().getName().equals("Schedule"))
            .findFirst()
            .get();
    Assertions.assertEquals(true, artgid1.getValueOf().equals("S4"));
    Assertions.assertEquals(0, ticket1.getAttachments().size());
    Assertions.assertEquals(1, ticket1.getLabels().size());
    Assertions.assertEquals(true, ticket1.getLabels().get(0).getName().equals("Internal"));
    Assertions.assertEquals(13, ticket1.getComments().size());

    // Ticket 2
    Assertions.assertEquals(1371, ticket2.getDescription().length());
    Assertions.assertEquals(true, ticket2.getState().getLabel().equals("Closed"));
    Assertions.assertEquals(true, ticket2.getTicketType().getName().equals("Edit Product"));
    Assertions.assertEquals(5, ticket2.getAdditionalFieldValues().size());
    AdditionalFieldValue artgid2 =
        ticket2.getAdditionalFieldValues().stream()
            .filter(afv -> afv.getAdditionalFieldType().getName().equals("AMTFlags"))
            .findFirst()
            .get();
    Assertions.assertEquals(true, artgid2.getValueOf().equals("PBS"));
    Assertions.assertEquals(3, ticket2.getAttachments().size());
    Assertions.assertEquals(
        true,
        ticket2
            .getAttachments()
            .get(0)
            .getAttachmentType()
            .getMimeType()
            .equals("application/pdf"));
    Assertions.assertEquals(0, ticket2.getLabels().size());
    Assertions.assertEquals(17, ticket2.getComments().size());

    Assertions.assertEquals(2, commentRepository.findByText("<p>Closed as per Serge 1</p>").size());
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

    Assertions.assertEquals(
        true, importResopnse.getMessage().contains("Successfully created new import files at"));

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
    Assertions.assertEquals(true, path1.contains("test-jira-export.json.updates"));
    Assertions.assertEquals(true, path2.contains("test-jira-export.json.newitems"));

    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);
    try {
      TicketImportDto[] updateDtos;
      TicketImportDto[] newItemsDtos;
      newItemsDtos = objectMapper.readValue(new File(path2), TicketImportDto[].class);
      updateDtos = objectMapper.readValue(new File(path1), TicketImportDto[].class);
      Assertions.assertEquals(0, newItemsDtos.length);
      Assertions.assertEquals(1, updateDtos.length);
      Assertions.assertEquals(true, updateDtos[0].getTitle().contains("Updated"));
      Assertions.assertEquals(
          true,
          updateDtos[0].getAdditionalFieldValues().stream()
              .filter(afv -> afv.getValueOf().equals("S5"))
              .findAny()
              .isPresent());
    } catch (IOException e) {
      Assertions.fail("There was an error opening the export files", e);
    }
  }
}
