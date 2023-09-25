package com.csiro.tickets.service;

import com.csiro.tickets.TicketTestBase;
import com.csiro.tickets.controllers.dto.ImportResponse;
import com.csiro.tickets.repository.IterationRepository;
import com.csiro.tickets.repository.LabelRepository;
import com.csiro.tickets.repository.PriorityBucketRepository;
import com.csiro.tickets.repository.StateRepository;
import io.restassured.http.ContentType;
import java.io.IOException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;

class TicketImportTest extends TicketTestBase {

  @Autowired private LabelRepository labelRepository;

  @Autowired private StateRepository stateRepository;

  @Autowired private PriorityBucketRepository priorityBucketRepository;

  @Autowired private IterationRepository iterationRepository;

  @BeforeAll
  protected void initDb() {
    // Do nothing
  }

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
  }
}
