package com.csiro.snomio.controllers;

import static com.csiro.snomio.service.ProductSummaryService.CTPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MPUU_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TPUU_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TP_LABEL;
import static org.awaitility.Awaitility.await;

import com.csiro.snomio.MedicationAssertions;
import com.csiro.snomio.SnomioTestBase;
import com.csiro.snomio.exception.SingleConceptExpectedProblem;
import com.csiro.snomio.product.PackSizeWithIdentifiers;
import com.csiro.snomio.product.ProductBrands;
import com.csiro.snomio.product.ProductPackSizes;
import com.csiro.snomio.product.ProductSummary;
import com.csiro.snomio.product.bulk.BrandPackSizeCreationDetails;
import com.csiro.snomio.product.bulk.BulkProductAction;
import com.csiro.snomio.product.details.ExternalIdentifier;
import com.csiro.tickets.models.Ticket;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.annotation.DirtiesContext;

@Log
@DirtiesContext
class MedicationNewBrandPackTest extends SnomioTestBase {

  public static final long TESTOSTERONE_SCHERING_PLOUGH_200MG_IMPLANT_1_TUBE = 933246331000036103L;
  public static final String TESTOSTERONE_SCHERING_PLOUGH = "933240811000036102";
  public static final long OESTRADIOL_SCHERING_PLOUGH_100_MG_IMPLANT_1_TUBE = 933246291000036106L;
  public static final String OESTRADIOL_SCHERING_PLOUGH = "933240831000036106";
  public static final long ZOLADEX_3_6_MG_IMPLANT_1_SYRINGE = 82906011000036104L;

  @Autowired ObjectMapper objectMapper;

  @Test
  void calculateExistingProductWithNoChanges() {
    ProductPackSizes productPackSizes =
        getSnomioTestClient()
            .getMedicationProductPackSizes(TESTOSTERONE_SCHERING_PLOUGH_200MG_IMPLANT_1_TUBE);

    ProductBrands productBrands =
        getSnomioTestClient()
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
        getSnomioTestClient().calculateNewBrandAndPackSizes(brandPackSizeCreationDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    MedicationAssertions.confirmAmtModelLinks(productSummary, false);
  }

  @Test
  void calculateExistingProductWithNoChangesBrandsNull() {
    ProductPackSizes productPackSizes =
        getSnomioTestClient()
            .getMedicationProductPackSizes(TESTOSTERONE_SCHERING_PLOUGH_200MG_IMPLANT_1_TUBE);

    BrandPackSizeCreationDetails brandPackSizeCreationDetails =
        BrandPackSizeCreationDetails.builder()
            .productId(Long.toString(TESTOSTERONE_SCHERING_PLOUGH_200MG_IMPLANT_1_TUBE))
            .packSizes(productPackSizes)
            .brands(null)
            .build();

    // calculate
    ProductSummary productSummary =
        getSnomioTestClient().calculateNewBrandAndPackSizes(brandPackSizeCreationDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    MedicationAssertions.confirmAmtModelLinks(productSummary, false);
  }

  @Test
  void calculateExistingProductWithNoChangesPackSizeNull() {
    ProductBrands productBrands =
        getSnomioTestClient()
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
        getSnomioTestClient().calculateNewBrandAndPackSizes(brandPackSizeCreationDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    MedicationAssertions.confirmAmtModelLinks(productSummary, false);
  }

  @Test
  void createSimpleProductFromExistingWithPackSizeAdditions() {
    ExternalIdentifier testArtg = new ExternalIdentifier("https://www.tga.gov.au/artg", "273936");

    ProductPackSizes productPackSizes =
        getSnomioTestClient()
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
        getSnomioTestClient().calculateNewBrandAndPackSizes(brandPackSizeCreationDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    MedicationAssertions.confirmAmtModelLinks(productSummary, true);

    Ticket ticketResponse =
        getSnomioTestClient().createTicket("createSimpleProductFromExistingWithPackSizeAdditions");

    BulkProductAction<BrandPackSizeCreationDetails> action =
        new BulkProductAction<>(
            productSummary, brandPackSizeCreationDetails, ticketResponse.getId(), null);

    ProductSummary createdProduct = getSnomioTestClient().createNewBrandPackSizes(action);

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
                          () -> getSnomioTestClient().getProductModel(conceptId), Objects::nonNull);

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

              MedicationAssertions.confirmAmtModelLinks(productModelPostCreation, false);

              // load atomic data
              getSnomioTestClient()
                  .getMedicationPackDetails(Long.parseLong(subject.getConceptId()));
            });

    productPackSizes =
        getSnomioTestClient()
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
    Assertions.assertThat(newPackSizeFound);
  }

  @Test
  @Disabled
  void createSimpleProductFromExistingWithBrandAndPackSizeAdditions()
      throws JsonProcessingException, InterruptedException {

    ProductPackSizes productPackSizes =
        getSnomioTestClient().getMedicationProductPackSizes(ZOLADEX_3_6_MG_IMPLANT_1_SYRINGE);

    PackSizeWithIdentifiers packSizeWithIdentifier = new PackSizeWithIdentifiers();
    packSizeWithIdentifier.setPackSize(new BigDecimal("12.0"));
    packSizeWithIdentifier.setExternalIdentifiers(Collections.emptySet());

    productPackSizes.getPackSizes().add(packSizeWithIdentifier);

    ProductBrands productBrands =
        getSnomioTestClient().getMedicationProductBrands(ZOLADEX_3_6_MG_IMPLANT_1_SYRINGE);
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
        getSnomioTestClient().calculateNewBrandAndPackSizes(brandPackSizeCreationDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 2, 2, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 2, 2, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 2, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 2, TP_LABEL);

    MedicationAssertions.confirmAmtModelLinks(productSummary, true);

    Ticket ticketResponse =
        getSnomioTestClient().createTicket("createSimpleProductFromExistingWithPackSizeAdditions");

    BulkProductAction<BrandPackSizeCreationDetails> action =
        new BulkProductAction<>(
            productSummary, brandPackSizeCreationDetails, ticketResponse.getId(), null);

    ProductSummary createdProduct = getSnomioTestClient().createNewBrandPackSizes(action);

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
                              return getSnomioTestClient().getProductModel(subject.getConceptId());
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

              MedicationAssertions.confirmAmtModelLinks(productModelPostCreation, false);

              // load atomic data
              getSnomioTestClient()
                  .getMedicationPackDetails(Long.parseLong(subject.getConceptId()));
              log.fine("CTPP " + subject.getConceptId() + " passed validation");
            });

    log.info(
        "bulk action was "
            + objectMapper.writeValueAsString(
                getSnomioTestClient().getBulkProductAction(ticketResponse.getId())));
  }
}
