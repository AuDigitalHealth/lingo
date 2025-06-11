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

import static au.gov.digitalhealth.lingo.service.ProductSummaryService.CTPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.MPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.MPUU_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.MP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.TPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.TPUU_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.TP_LABEL;

import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormDescription;
import au.gov.digitalhealth.lingo.AmtTestData;
import au.gov.digitalhealth.lingo.LingoTestBase;
import au.gov.digitalhealth.lingo.MedicationAssertions;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.MappingType;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.update.ProductDescriptionUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductExternalIdentifierUpdateRequest;
import au.gov.digitalhealth.lingo.service.ProductUpdateService;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import au.gov.digitalhealth.tickets.helper.JsonReader;
import au.gov.digitalhealth.tickets.models.Ticket;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Collections;
import java.util.Set;
import java.util.UUID;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

class ProductControllerTest extends LingoTestBase {

  public static final String ARTG_SCHEME = "artgid";
  @Autowired ProductUpdateService productUpdateService;

  @Value("${snomio.dialectKey}")
  String dialectKey;

  @Test
  void getSimpleProductModel() {
    ProductSummary productSummary =
        getLingoTestClient().getProductModel(AmtTestData.EMLA_5_PERCENT_PATCH_20_CARTON);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, CTPP_LABEL);

    MedicationAssertions.confirmAmtModelLinks(productSummary, false, false, false);
  }

  @Test
  void getComplexProductModel() {
    ProductSummary productSummary = getLingoTestClient().getProductModel(AmtTestData.NEXIUM_HP7);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 4, TP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 4, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 4, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 4, CTPP_LABEL);

    MedicationAssertions.confirmAmtModelLinks(productSummary, false, false, false);
  }

  @Test
  @Disabled("Failing because of Snowstorm ECL defect, should reenable once that is resolved")
  void getProductModelExposingSnowstormEclDefect() {
    ProductSummary productSummary =
        getLingoTestClient().getProductModel(AmtTestData.PICATO_0_015_PERCENT_GEL_3_X_470_MG_TUBES);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 2, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 2, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 2, CTPP_LABEL);

    MedicationAssertions.confirmAmtModelLinks(productSummary, false, false, false);
  }

  @Test
  void updateProductDescriptionTest() throws JsonProcessingException {
    Ticket ticketResponse = getLingoTestClient().createTicket("Update Product Test");

    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    SnowstormConcept existingConcept =
        objectMapper.readValue(
            JsonReader.readJsonFile("snowstorm/EMLA_5_PERCENT_PATCH_20_CARTON_BULK_LOAD.json"),
            SnowstormConcept.class);

    SnowstormDescription fsn =
        SnowstormDtoUtil.getFsnFromDescriptions(existingConcept.getDescriptions());
    SnowstormDescription pt =
        SnowstormDtoUtil.getPreferredTerm(existingConcept.getDescriptions(), dialectKey);

    String randomString = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    String newFsn = randomString + "-" + fsn.getTerm();
    String newPt = randomString + "-" + pt.getTerm();

    fsn.setTerm(newFsn);
    pt.setTerm(newPt);

    ProductDescriptionUpdateRequest productDescriptionUpdateRequest =
        new ProductDescriptionUpdateRequest(Set.of(fsn, pt), ticketResponse.getId());
    SnowstormConceptMini updatedProduct =
        getLingoTestClient()
            .updateProductDescription(
                productDescriptionUpdateRequest, existingConcept.getConceptId());

    Assertions.assertThat(updatedProduct.getPt().getTerm()).isEqualTo(newPt);
    Assertions.assertThat(updatedProduct.getFsn().getTerm()).isEqualTo(newFsn);

    // Testing semantic tag check
    fsn.setTerm(newPt);

    ProblemDetail problemDetail =
        getLingoTestClient()
            .putRequest(
                "/api/MAIN/SNOMEDCT-AU/AUAMT/product-model/"
                    + existingConcept.getConceptId()
                    + "/descriptions",
                new ProductDescriptionUpdateRequest(Set.of(fsn, pt), ticketResponse.getId()),
                HttpStatus.BAD_REQUEST,
                ProblemDetail.class);

    Assertions.assertThat(problemDetail.getTitle()).isEqualTo("Atomic data validation problem");
    Assertions.assertThat(problemDetail.getDetail())
        .isEqualTo(
            String.format(
                "The required semantic tag \"(containerized branded product package)\" is missing from the FSN \"%s\".",
                fsn.getTerm()));
  }

  @Test
  void updateProductExternalIdentifiersTest() {
    Ticket ticketResponse = getLingoTestClient().createTicket("Update Product Test");
    ProductSummary productSummary =
        getLingoTestClient().getProductModel(AmtTestData.EMLA_5_PERCENT_PATCH_20_CARTON);
    Node existingCtpp = productSummary.getSubjects().iterator().next();

    ProductExternalIdentifierUpdateRequest productExternalIdentifierUpdateRequest =
        new ProductExternalIdentifierUpdateRequest(
            Set.of(
                ExternalIdentifier.builder()
                    .identifierScheme(ARTG_SCHEME)
                    .value("123")
                    .relationshipType(MappingType.RELATED)
                    .build(),
                ExternalIdentifier.builder()
                    .identifierScheme(ARTG_SCHEME)
                    .value("345")
                    .relationshipType(MappingType.RELATED)
                    .build()),
            ticketResponse.getId());
    Set<ExternalIdentifier> updatedExternalIdentifiers =
        getLingoTestClient()
            .updateProductExternalIdentifiers(
                productExternalIdentifierUpdateRequest, existingCtpp.getConceptId());
    Assertions.assertThat(updatedExternalIdentifiers).hasSize(2);
    Assertions.assertThat(
            updatedExternalIdentifiers.stream().anyMatch(e -> e.getValue().equals("123")))
        .isTrue();
    Assertions.assertThat(
            updatedExternalIdentifiers.stream().anyMatch(e -> e.getValue().equals("345")))
        .isTrue();

    productExternalIdentifierUpdateRequest =
        new ProductExternalIdentifierUpdateRequest(
            Set.of(
                ExternalIdentifier.builder()
                    .identifierScheme(ARTG_SCHEME)
                    .value("123")
                    .relationshipType(MappingType.RELATED)
                    .build(),
                ExternalIdentifier.builder()
                    .identifierScheme(ARTG_SCHEME)
                    .value("222")
                    .relationshipType(MappingType.RELATED)
                    .build()),
            ticketResponse.getId());
    updatedExternalIdentifiers =
        getLingoTestClient()
            .updateProductExternalIdentifiers(
                productExternalIdentifierUpdateRequest, existingCtpp.getConceptId());
    Assertions.assertThat(updatedExternalIdentifiers).hasSize(2);
    Assertions.assertThat(
            updatedExternalIdentifiers.stream().anyMatch(e -> e.getValue().equals("123")))
        .isTrue();
    Assertions.assertThat(
            updatedExternalIdentifiers.stream().anyMatch(e -> e.getValue().equals("222")))
        .isTrue();

    // Test for removing artg id
    productExternalIdentifierUpdateRequest =
        new ProductExternalIdentifierUpdateRequest(Collections.emptySet(), ticketResponse.getId());
    updatedExternalIdentifiers =
        getLingoTestClient()
            .updateProductExternalIdentifiers(
                productExternalIdentifierUpdateRequest, existingCtpp.getConceptId());
    Assertions.assertThat(updatedExternalIdentifiers).isEmpty();
  }
}
