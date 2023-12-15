package com.csiro.snomio.controllers;

import static com.csiro.snomio.AmtTestData.NEXIUM_HP7;
import static com.csiro.snomio.AmtTestData.OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID;
import static com.csiro.snomio.MedicationAssertions.confirmAmtModelLinks;
import static com.csiro.snomio.service.ProductService.CTPP_LABEL;
import static com.csiro.snomio.service.ProductService.MPP_LABEL;
import static com.csiro.snomio.service.ProductService.MPUU_LABEL;
import static com.csiro.snomio.service.ProductService.MP_LABEL;
import static com.csiro.snomio.service.ProductService.TPP_LABEL;
import static com.csiro.snomio.service.ProductService.TPUU_LABEL;
import static com.csiro.snomio.service.ProductService.TP_LABEL;
import static com.csiro.snomio.util.SnomedConstants.UNIT_OF_PRESENTATION;


import com.csiro.snomio.MedicationAssertions;
import com.csiro.snomio.SnomioTestBase;
import com.csiro.snomio.models.product.ProductCreationDetails;
import com.csiro.snomio.models.product.ProductSummary;
import com.csiro.snomio.models.product.details.MedicationProductDetails;
import com.csiro.snomio.models.product.details.PackageDetails;
import com.csiro.snomio.models.product.details.PackageQuantity;
import java.math.BigDecimal;

import com.csiro.tickets.models.Ticket;
import lombok.extern.java.Log;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.DirtiesContext;

@Log
@DirtiesContext
class MedicationCreationControllerTest extends SnomioTestBase {

  @Test
  void createSimpleProductFromExistingWithPackSizeChange() {
    // get Oxaliccord
    PackageDetails<MedicationProductDetails> packageDetails =
        getSnomioTestClient()
            .getMedicationPackDetails(OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    // change pack size to 2
    packageDetails.getContainedProducts().iterator().next().setValue(BigDecimal.valueOf(2));

    // calculate
    ProductSummary productSummary = getSnomioTestClient().calculateProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    confirmAmtModelLinks(productSummary);

    Ticket ticketResponse =
        getSnomioTestClient().createTicket("createSimpleProductFromExistingWithPackSizeChange");

    // create
    ProductSummary createdProduct =
        getSnomioTestClient()
            .createProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId()));

    Assertions.assertThat(createdProduct.getSubject().getConceptId()).matches("\\d{7,18}");

    confirmAmtModelLinks(createdProduct);

    // load product model
    ProductSummary productModelPostCreation =
        getSnomioTestClient().getProductModel(createdProduct.getSubject().getConceptId());

    Assertions.assertThat(productModelPostCreation.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TP_LABEL);

    confirmAmtModelLinks(productModelPostCreation);

    // load atomic data
    PackageDetails<MedicationProductDetails> packageDetailsPostCreation =
        getSnomioTestClient()
            .getMedicationPackDetails(Long.parseLong(createdProduct.getSubject().getConceptId()));

    Assertions.assertThat(packageDetailsPostCreation).isEqualTo(packageDetails);
  }

  @Test
  void createComplexProductFromExistingWithPackSizeChange() {
    // get Oxaliccord
    PackageDetails<MedicationProductDetails> packageDetails =
        getSnomioTestClient().getMedicationPackDetails(NEXIUM_HP7);

    Assertions.assertThat(packageDetails.getContainedPackages()).size().isEqualTo(3);
    Assertions.assertThat(packageDetails.getContainedProducts()).isNullOrEmpty();

    for (PackageQuantity<MedicationProductDetails> innerPack :
        packageDetails.getContainedPackages()) {
      Assertions.assertThat(innerPack.getValue()).isEqualTo(BigDecimal.ONE.setScale(1));
      Assertions.assertThat(innerPack.getUnit().getConceptId())
          .isEqualTo(UNIT_OF_PRESENTATION.getValue());
    }

    // change pack size to 2
    packageDetails.getContainedPackages().iterator().next().setValue(BigDecimal.valueOf(2));

    // calculate
    ProductSummary productSummary = getSnomioTestClient().calculateProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 3, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 3, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 3, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 4, TP_LABEL);

    Ticket ticketResponse =
        getSnomioTestClient().createTicket("createComplexProductFromExistingWithPackSizeChange");

    // create
    ProductSummary createdProduct =
        getSnomioTestClient()
            .createProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId()));

    Assertions.assertThat(createdProduct.getSubject().getConceptId()).matches("\\d{7,18}");

    // load product model
    ProductSummary productModelPostCreation =
        getSnomioTestClient().getProductModel(createdProduct.getSubject().getConceptId());

    Assertions.assertThat(productModelPostCreation.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, TP_LABEL);

    // load atomic data
    PackageDetails<MedicationProductDetails> packageDetailsPostCreation =
        getSnomioTestClient()
            .getMedicationPackDetails(Long.parseLong(createdProduct.getSubject().getConceptId()));

    //    Assertions.assertThat(packageDetailsPostCreation).isEqualTo(packageDetails);
    MedicationAssertions.assertEqualPackage(packageDetailsPostCreation, packageDetails);
  }

  @Test
  void createComplexProductFromExistingWithProductSizeChange() {
    // get Oxaliccord
    PackageDetails<MedicationProductDetails> packageDetails =
        getSnomioTestClient().getMedicationPackDetails(NEXIUM_HP7);

    Assertions.assertThat(packageDetails.getContainedPackages()).size().isEqualTo(3);
    Assertions.assertThat(packageDetails.getContainedProducts()).isNullOrEmpty();

    for (PackageQuantity<MedicationProductDetails> innerPack :
        packageDetails.getContainedPackages()) {
      Assertions.assertThat(innerPack.getValue()).isEqualTo(BigDecimal.ONE.setScale(1));
      Assertions.assertThat(innerPack.getUnit().getConceptId())
          .isEqualTo(UNIT_OF_PRESENTATION.getValue());
    }

    // change inner pack to 29
    packageDetails
        .getContainedPackages()
        .iterator()
        .next()
        .getPackageDetails()
        .getContainedProducts()
        .iterator()
        .next()
        .setValue(BigDecimal.valueOf(29).setScale(1));

    // calculate
    ProductSummary productSummary = getSnomioTestClient().calculateProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 2, 2, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 2, 2, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 2, 2, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 4, TP_LABEL);

    Ticket ticketResponse =
        getSnomioTestClient().createTicket("createComplexProductFromExistingWithProductSizeChange");

    // create
    ProductSummary createdProduct =
        getSnomioTestClient()
            .createProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId()));

    Assertions.assertThat(createdProduct.getSubject().getConceptId()).matches("\\d{7,18}");

    // load product model
    ProductSummary productModelPostCreation =
        getSnomioTestClient().getProductModel(createdProduct.getSubject().getConceptId());

    Assertions.assertThat(productModelPostCreation.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, TP_LABEL);

    MedicationAssertions.confirmAmtModelLinks(productModelPostCreation);

    // load atomic data
    PackageDetails<MedicationProductDetails> packageDetailsPostCreation =
        getSnomioTestClient()
            .getMedicationPackDetails(Long.parseLong(createdProduct.getSubject().getConceptId()));

    // TODO this works around a different order in the packages...we need to consider this more
    MedicationAssertions.assertEqualPackage(packageDetailsPostCreation, packageDetails);
  }
}
