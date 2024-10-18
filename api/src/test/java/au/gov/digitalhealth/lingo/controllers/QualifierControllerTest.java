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
package au.gov.digitalhealth.lingo.controllers;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.gov.digitalhealth.lingo.LingoTestBase;
import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.product.BrandCreationRequest;
import au.gov.digitalhealth.tickets.models.Ticket;
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
class QualifierControllerTest extends LingoTestBase {

  @Autowired FieldBindingConfiguration fieldBindingConfiguration;

  @BeforeAll
  public static void setUpClass() {
    System.setProperty(
        "snomio.field-bindings.mappers.MAIN_SNOMEDCT-AU_AUAMT.product.productName.semanticTag",
        "(product name)");
  }

  @Test
  void createBrandTest() {
    Ticket ticketResponse = getLingoTestClient().createTicket("Create Brand Test");
    String randomBrandName = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    BrandCreationRequest brandCreationRequest =
        new BrandCreationRequest(randomBrandName, ticketResponse.getId());
    SnowstormConceptMini createdBrand = getLingoTestClient().createBrand(brandCreationRequest);
    Assertions.assertThat(Long.parseLong(createdBrand.getConceptId())).isPositive();
    Assertions.assertThat(createdBrand.getPt().getTerm()).isEqualTo(randomBrandName);
    String expectedFsn =
        String.format("%s %s", randomBrandName, fieldBindingConfiguration.getBrandSemanticTag());

    Assertions.assertThat(createdBrand.getFsn().getTerm()).isEqualTo(expectedFsn);

    ProblemDetail problemDetail =
        getLingoTestClient()
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
