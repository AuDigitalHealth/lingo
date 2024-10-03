package com.csiro.snomio.controllers;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.SnomioTestBase;
import com.csiro.snomio.configuration.FieldBindingConfiguration;
import com.csiro.snomio.product.BrandCreationRequest;
import com.csiro.tickets.models.Ticket;
import java.util.UUID;
import lombok.extern.java.Log;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.test.annotation.DirtiesContext;

@Log
@DirtiesContext
class QualifierControllerTest extends SnomioTestBase {

  @Autowired FieldBindingConfiguration fieldBindingConfiguration;

  @BeforeAll
  public static void setUpClass() {
    System.setProperty(
        "snomio.field-bindings.mappers.MAIN_SNOMEDCT-AU_AUAMT.product.productName.semanticTag",
        "(product name)");
  }

  @Test
  void createBrandTest() {
    Ticket ticketResponse = getSnomioTestClient().createTicket("Create Brand Test");
    String randomBrandName = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    BrandCreationRequest brandCreationRequest =
        new BrandCreationRequest(randomBrandName, ticketResponse.getId());
    SnowstormConceptMini createdBrand = getSnomioTestClient().createBrand(brandCreationRequest);
    Assertions.assertThat(Long.parseLong(createdBrand.getConceptId())).isGreaterThan(0);
    Assertions.assertThat(createdBrand.getPt().getTerm()).isEqualTo(randomBrandName);
    String expectedFsn =
        String.format("%s %s", randomBrandName, fieldBindingConfiguration.getBrandSemanticTag());

    Assertions.assertThat(createdBrand.getFsn().getTerm()).isEqualTo(expectedFsn);

    ProblemDetail problemDetail =
        getSnomioTestClient()
            .postRequest(
                "/api/MAIN/SNOMEDCT-AU/AUAMT/qualifier/product-name",
                brandCreationRequest,
                HttpStatus.BAD_REQUEST,
                ProblemDetail.class);

    Assertions.assertThat(problemDetail.getTitle()).isEqualTo("Atomic data validation problem");
    Assertions.assertThat(problemDetail.getDetail())
        .isEqualTo(
            "Concept with name '"
                + randomBrandName
                + "' already exists, cannot create a new concept with the same name.");
  }
}
