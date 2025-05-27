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
import static org.awaitility.Awaitility.await;

import au.gov.digitalhealth.lingo.LingoTestBase;
import au.gov.digitalhealth.lingo.MedicationAssertions;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.MappingType;
import au.gov.digitalhealth.lingo.exception.SingleConceptExpectedProblem;
import au.gov.digitalhealth.lingo.product.BrandWithIdentifiers;
import au.gov.digitalhealth.lingo.product.PackSizeWithIdentifiers;
import au.gov.digitalhealth.lingo.product.ProductBrands;
import au.gov.digitalhealth.lingo.product.ProductPackSizes;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.bulk.BrandPackSizeCreationDetails;
import au.gov.digitalhealth.lingo.product.bulk.BulkProductAction;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.tickets.models.Ticket;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.annotation.DirtiesContext;

@Log
@DirtiesContext
@TestMethodOrder(OrderAnnotation.class)
class MedicationNewBrandPackTest extends LingoTestBase {

  public static final long TESTOSTERONE_SCHERING_PLOUGH_200MG_IMPLANT_1_TUBE = 933246331000036103L;
  public static final String TESTOSTERONE_SCHERING_PLOUGH = "933240811000036102";
  public static final long OESTRADIOL_SCHERING_PLOUGH_100_MG_IMPLANT_1_TUBE = 933246291000036106L;
  public static final String OESTRADIOL_SCHERING_PLOUGH = "933240831000036106";
  public static final long ZOLADEX_3_6_MG_IMPLANT_1_SYRINGE = 82906011000036104L;
  public static final String ARTG_SCHEME = "artgid";

  @Autowired ObjectMapper objectMapper;

  @Test
  void calculateExistingProductWithNoChanges() {
    ProductPackSizes productPackSizes =
        getLingoTestClient()
            .getMedicationProductPackSizes(TESTOSTERONE_SCHERING_PLOUGH_200MG_IMPLANT_1_TUBE);

    ProductBrands productBrands =
        getLingoTestClient()
            .getMedicationProductBrands(TESTOSTERONE_SCHERING_PLOUGH_200MG_IMPLANT_1_TUBE);

    productBrands.setBrands(
        productBrands.getBrands().stream()
            .filter(brand -> brand.getBrand().getConceptId().equals(TESTOSTERONE_SCHERING_PLOUGH))
            .collect(Collectors.toSet()));

    BrandPackSizeCreationDetails brandPackSizeCreationDetails =
        BrandPackSizeCreationDetails.builder()
            .productId(Long.toString(TESTOSTERONE_SCHERING_PLOUGH_200MG_IMPLANT_1_TUBE))
            .packSizes(productPackSizes)
            .brands(productBrands)
            .build();

    // calculate
    ProductSummary productSummary =
        getLingoTestClient().calculateNewBrandAndPackSizes(brandPackSizeCreationDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    MedicationAssertions.checkNoExternalIdentifiersOnTpp(productSummary);
    MedicationAssertions.confirmAmtModelLinks(productSummary, false, false, false);
  }

  @Test
  void calculateExistingProductWithNoChangesBrandsNull() {
    ProductPackSizes productPackSizes =
        getLingoTestClient()
            .getMedicationProductPackSizes(TESTOSTERONE_SCHERING_PLOUGH_200MG_IMPLANT_1_TUBE);

    BrandPackSizeCreationDetails brandPackSizeCreationDetails =
        BrandPackSizeCreationDetails.builder()
            .productId(Long.toString(TESTOSTERONE_SCHERING_PLOUGH_200MG_IMPLANT_1_TUBE))
            .packSizes(productPackSizes)
            .brands(null)
            .build();

    // calculate
    ProductSummary productSummary =
        getLingoTestClient().calculateNewBrandAndPackSizes(brandPackSizeCreationDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    MedicationAssertions.checkNoExternalIdentifiersOnTpp(productSummary);
    MedicationAssertions.confirmAmtModelLinks(productSummary, false, false, false);
  }

  @Test
  void calculateExistingProductWithNoChangesPackSizeNull() {
    ProductBrands productBrands =
        getLingoTestClient()
            .getMedicationProductBrands(TESTOSTERONE_SCHERING_PLOUGH_200MG_IMPLANT_1_TUBE);

    productBrands.setBrands(
        productBrands.getBrands().stream()
            .filter(brand -> brand.getBrand().getConceptId().equals(TESTOSTERONE_SCHERING_PLOUGH))
            .collect(Collectors.toSet()));

    BrandPackSizeCreationDetails brandPackSizeCreationDetails =
        BrandPackSizeCreationDetails.builder()
            .productId(Long.toString(TESTOSTERONE_SCHERING_PLOUGH_200MG_IMPLANT_1_TUBE))
            .packSizes(null)
            .brands(productBrands)
            .build();

    // calculate
    ProductSummary productSummary =
        getLingoTestClient().calculateNewBrandAndPackSizes(brandPackSizeCreationDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    MedicationAssertions.checkNoExternalIdentifiersOnTpp(productSummary);
    MedicationAssertions.confirmAmtModelLinks(productSummary, false, false, false);
  }

  @Test
  void createSimpleProductFromExistingWithPackSizeAdditions() {
    ExternalIdentifier testArtg =
        ExternalIdentifier.builder()
            .identifierScheme(ARTG_SCHEME)
            .identifierValue("273936")
            .relationshipType(MappingType.RELATED)
            .build();

    ProductPackSizes productPackSizes =
        getLingoTestClient()
            .getMedicationProductPackSizes(OESTRADIOL_SCHERING_PLOUGH_100_MG_IMPLANT_1_TUBE);

    PackSizeWithIdentifiers packSizeWithIdentifier = new PackSizeWithIdentifiers();
    packSizeWithIdentifier.setPackSize(new BigDecimal("15.0"));
    packSizeWithIdentifier.setExternalIdentifiers(Collections.singleton(testArtg));

    productPackSizes.getPackSizes().add(packSizeWithIdentifier);

    BrandPackSizeCreationDetails brandPackSizeCreationDetails =
        BrandPackSizeCreationDetails.builder()
            .productId(Long.toString(OESTRADIOL_SCHERING_PLOUGH_100_MG_IMPLANT_1_TUBE))
            .packSizes(productPackSizes)
            .brands(null)
            .build();

    // calculate
    ProductSummary productSummary =
        getLingoTestClient().calculateNewBrandAndPackSizes(brandPackSizeCreationDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    MedicationAssertions.checkNoExternalIdentifiersOnTpp(productSummary);
    MedicationAssertions.confirmAmtModelLinks(productSummary, true, false, false);

    Ticket ticketResponse =
        getLingoTestClient().createTicket("createSimpleProductFromExistingWithPackSizeAdditions");

    BulkProductAction<BrandPackSizeCreationDetails> action =
        new BulkProductAction<>(
            productSummary, brandPackSizeCreationDetails, ticketResponse.getId(), null);

    ProductSummary createdProduct = getLingoTestClient().createNewBrandPackSizes(action);

    Assertions.assertThat(createdProduct.getSubjects()).size().isEqualTo(2);

    createdProduct
        .getSubjects()
        .forEach(
            subject -> {
              Assertions.assertThat(subject.getConceptId()).matches("\\d{7,18}");
            });

    createdProduct
        .getSubjects()
        .forEach(
            subject -> {
              // load product model
              String conceptId = subject.getConceptId();

              ProductSummary productModelPostCreation =
                  await()
                      .atMost(60, TimeUnit.SECONDS)
                      .ignoreExceptions()
                      .pollInterval(1, TimeUnit.SECONDS)
                      .until(
                          () -> getLingoTestClient().getProductModel(conceptId), Objects::nonNull);

              Assertions.assertThat(productModelPostCreation.isContainsNewConcepts()).isFalse();
              MedicationAssertions.assertProductSummaryHas(
                  productModelPostCreation, 0, 1, CTPP_LABEL);
              MedicationAssertions.assertProductSummaryHas(
                  productModelPostCreation, 0, 1, TPP_LABEL);
              MedicationAssertions.assertProductSummaryHas(
                  productModelPostCreation, 0, 1, MPP_LABEL);
              MedicationAssertions.assertProductSummaryHas(
                  productModelPostCreation, 0, 1, TPUU_LABEL);
              MedicationAssertions.assertProductSummaryHas(
                  productModelPostCreation, 0, 1, MPUU_LABEL);
              MedicationAssertions.assertProductSummaryHas(
                  productModelPostCreation, 0, 1, MP_LABEL);
              MedicationAssertions.assertProductSummaryHas(
                  productModelPostCreation, 0, 1, TP_LABEL);

              MedicationAssertions.checkNoExternalIdentifiersOnTpp(productSummary);
              MedicationAssertions.confirmAmtModelLinks(
                  productModelPostCreation, false, false, false);

              // load atomic data
              getLingoTestClient().getMedicationPackDetails(Long.parseLong(subject.getConceptId()));
            });

    productPackSizes =
        getLingoTestClient()
            .getMedicationProductPackSizes(OESTRADIOL_SCHERING_PLOUGH_100_MG_IMPLANT_1_TUBE);
    boolean newPackSizeFound =
        productPackSizes.getPackSizes().stream()
            .anyMatch(
                p ->
                    p.getPackSize().equals(BigDecimal.valueOf(15.0))
                        && p.getExternalIdentifiers()
                            .iterator()
                            .next()
                            .getIdentifierValue()
                            .equals(testArtg.getIdentifierValue()));
    Assertions.assertThat(newPackSizeFound).isTrue();
  }

  @Test
  @Order(1)
  void createSimpleProductFromExistingWithBrandAndPackSizeAdditions()
      throws JsonProcessingException, InterruptedException {

    ProductPackSizes productPackSizes =
        getLingoTestClient().getMedicationProductPackSizes(ZOLADEX_3_6_MG_IMPLANT_1_SYRINGE);

    PackSizeWithIdentifiers packSizeWithIdentifier = new PackSizeWithIdentifiers();
    packSizeWithIdentifier.setPackSize(new BigDecimal("12.0"));
    packSizeWithIdentifier.setExternalIdentifiers(Collections.emptySet());

    productPackSizes.getPackSizes().add(packSizeWithIdentifier);

    ProductBrands productBrands =
        getLingoTestClient().getMedicationProductBrands(ZOLADEX_3_6_MG_IMPLANT_1_SYRINGE);
    // 4 new brands

    BrandPackSizeCreationDetails brandPackSizeCreationDetails =
        BrandPackSizeCreationDetails.builder()
            .productId(Long.toString(ZOLADEX_3_6_MG_IMPLANT_1_SYRINGE))
            .packSizes(productPackSizes)
            .brands(productBrands)
            .build();

    log.fine(
        "brandPackSizeCreationDetails: "
            + objectMapper.writeValueAsString(brandPackSizeCreationDetails));

    // calculate
    ProductSummary productSummary =
        getLingoTestClient().calculateNewBrandAndPackSizes(brandPackSizeCreationDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 2, 2, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 2, 2, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 2, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 2, TP_LABEL);

    MedicationAssertions.checkNoExternalIdentifiersOnTpp(productSummary);
    MedicationAssertions.confirmAmtModelLinks(productSummary, true, false, false);

    Ticket ticketResponse =
        getLingoTestClient().createTicket("createSimpleProductFromExistingWithPackSizeAdditions");

    BulkProductAction<BrandPackSizeCreationDetails> action =
        new BulkProductAction<>(
            productSummary, brandPackSizeCreationDetails, ticketResponse.getId(), null);

    ProductSummary createdProduct = getLingoTestClient().createNewBrandPackSizes(action);

    Assertions.assertThat(createdProduct.getSubjects()).size().isEqualTo(4);

    createdProduct
        .getSubjects()
        .forEach(
            subject -> {
              Assertions.assertThat(subject.getConceptId()).matches("\\d{7,18}");
            });

    createdProduct
        .getSubjects()
        .forEach(
            subject -> {
              // load product model

              ProductSummary productModelPostCreation =
                  await()
                      .ignoreExceptions()
                      .atMost(60, TimeUnit.SECONDS)
                      .pollInterval(1, TimeUnit.SECONDS)
                      .until(
                          () -> {
                            try {
                              return getLingoTestClient().getProductModel(subject.getConceptId());
                            } catch (SingleConceptExpectedProblem e) {
                              return null;
                            }
                          },
                          Objects::nonNull);

              Assertions.assertThat(productModelPostCreation.isContainsNewConcepts()).isFalse();
              MedicationAssertions.assertProductSummaryHas(
                  productModelPostCreation, 0, 1, CTPP_LABEL);
              MedicationAssertions.assertProductSummaryHas(
                  productModelPostCreation, 0, 1, TPP_LABEL);
              MedicationAssertions.assertProductSummaryHas(
                  productModelPostCreation, 0, 1, MPP_LABEL);
              MedicationAssertions.assertProductSummaryHas(
                  productModelPostCreation, 0, 1, TPUU_LABEL);
              MedicationAssertions.assertProductSummaryHas(
                  productModelPostCreation, 0, 1, MPUU_LABEL);
              MedicationAssertions.assertProductSummaryHas(
                  productModelPostCreation, 0, 1, MP_LABEL);
              MedicationAssertions.assertProductSummaryHas(
                  productModelPostCreation, 0, 1, TP_LABEL);

              MedicationAssertions.checkNoExternalIdentifiersOnTpp(productSummary);
              MedicationAssertions.confirmAmtModelLinks(
                  productModelPostCreation, false, false, false);

              // load atomic data
              getLingoTestClient().getMedicationPackDetails(Long.parseLong(subject.getConceptId()));
              log.fine("CTPP " + subject.getConceptId() + " passed validation");
            });

    log.info(
        "bulk action was "
            + objectMapper.writeValueAsString(
                getLingoTestClient().getBulkProductAction(ticketResponse.getId())));
  }

  @Test
  void createBulkBrand() throws JsonProcessingException {

    // Fetch ProductBrands for two products
    ProductBrands productBrandsOstradol =
        getLingoTestClient()
            .getMedicationProductBrands(OESTRADIOL_SCHERING_PLOUGH_100_MG_IMPLANT_1_TUBE);

    ProductBrands productBrands =
        getLingoTestClient().getMedicationProductBrands(ZOLADEX_3_6_MG_IMPLANT_1_SYRINGE);

    // Create a set of ExternalIdentifiers to assign to all brands
    Set<ExternalIdentifier> testExternalIdentifiers =
        Set.of(
            ExternalIdentifier.builder()
                .identifierScheme(ARTG_SCHEME)
                .identifierValue("273936")
                .relationshipType(MappingType.RELATED)
                .build(),
            ExternalIdentifier.builder()
                .identifierScheme(ARTG_SCHEME)
                .identifierValue("321677")
                .relationshipType(MappingType.RELATED)
                .build());

    // Add brands from Ostradol product to Zoladex product brands
    productBrands.getBrands().addAll(productBrandsOstradol.getBrands());

    // Assign ExternalIdentifiers to each brand and store in a new set
    Set<BrandWithIdentifiers> newBrandExternalIdentifiers =
        productBrands.getBrands().stream()
            .peek(brand -> brand.setExternalIdentifiers(testExternalIdentifiers))
            .collect(Collectors.toSet());

    productBrands.setBrands(newBrandExternalIdentifiers);

    // Create details for brand and pack size creation
    BrandPackSizeCreationDetails brandPackSizeCreationDetails =
        BrandPackSizeCreationDetails.builder()
            .productId(Long.toString(ZOLADEX_3_6_MG_IMPLANT_1_SYRINGE))
            .brands(productBrands)
            .build();

    log.fine(
        "brandPackSizeCreationDetails: "
            + objectMapper.writeValueAsString(brandPackSizeCreationDetails));

    // Calculate new brand and pack sizes
    ProductSummary productSummary =
        getLingoTestClient().calculateNewBrandAndPackSizes(brandPackSizeCreationDetails);

    MedicationAssertions.checkNoExternalIdentifiersOnTpp(productSummary);
    // Assert that new concepts are included in the calculation
    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.confirmAmtModelLinks(productSummary, true, false, false);

    // Create a ticket for the new brand creation
    Ticket ticketResponse = getLingoTestClient().createTicket("createBulkBrand");

    // Create a bulk action with the calculated product summary and ticket
    BulkProductAction<BrandPackSizeCreationDetails> action =
        new BulkProductAction<>(
            productSummary, brandPackSizeCreationDetails, ticketResponse.getId(), null);

    // Create new brand pack sizes based on the action
    ProductSummary createdProduct = getLingoTestClient().createNewBrandPackSizes(action);

    // Assert that four subjects were created
    Assertions.assertThat(createdProduct.getSubjects()).hasSize(4);

    // Assert that each subject's conceptId matches the expected format
    createdProduct
        .getSubjects()
        .forEach(subject -> Assertions.assertThat(subject.getConceptId()).matches("\\d{7,18}"));

    createdProduct.getSubjects().stream()
        .map(n -> Long.parseLong(n.getConceptId()))
        .forEach(
            conceptToLoad -> {
              ProductBrands newProductBrands =
                  getLingoTestClient().getMedicationProductBrands(conceptToLoad);

              // Assert that the new brands are not empty and there are exactly four brands
              Assertions.assertThat(newProductBrands.getBrands()).isNotEmpty();
              Assertions.assertThat(newProductBrands.getBrands()).hasSize(4);

              // Check for duplicate conceptIds in the new brands
              Set<String> conceptIds = new HashSet<>();
              boolean hasDuplicates =
                  newProductBrands.getBrands().stream()
                      .map(b -> b.getBrand().getConceptId())
                      .anyMatch(conceptId -> !conceptIds.add(conceptId));
              Assertions.assertThat(hasDuplicates).isFalse(); // Ensure no duplicates exist

              // Assert that each brand has exactly 2 external identifiers
              newProductBrands
                  .getBrands()
                  .forEach(
                      brandWithIdentifiers ->
                          Assertions.assertThat(brandWithIdentifiers.getExternalIdentifiers())
                              .hasSize(2));
            });
  }
}
