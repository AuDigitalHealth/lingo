package com.csiro.snomio.controllers;

import static com.csiro.snomio.AmtTestData.COMBINE_ROLE_J_AND_J_1_CARTON;
import static com.csiro.snomio.MedicationAssertions.confirmAmtModelLinks;
import static com.csiro.snomio.service.ProductSummaryService.CTPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MPUU_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TPUU_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TP_LABEL;

import com.csiro.snomio.MedicationAssertions;
import com.csiro.snomio.SnomioTestBase;
import com.csiro.snomio.product.ProductCreationDetails;
import com.csiro.snomio.product.ProductSummary;
import com.csiro.snomio.product.details.DeviceProductDetails;
import com.csiro.snomio.product.details.PackageDetails;
import com.csiro.tickets.models.Ticket;
import java.math.BigDecimal;
import lombok.extern.java.Log;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.DirtiesContext;

@Log
@DirtiesContext
class DeviceCreationControllerTest extends SnomioTestBase {

  @Test
  @Disabled
  void calculateExistingProductWithNoChanges() {
    PackageDetails<DeviceProductDetails> packageDetails =
        getSnomioTestClient().getDevicePackDetails(COMBINE_ROLE_J_AND_J_1_CARTON);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    // calculate
    ProductSummary productSummary =
        getSnomioTestClient().calculateDeviceProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    confirmAmtModelLinks(productSummary);
  }

  @Test
  void createSimpleProductFromExistingWithPackSizeChange() {
    // get Oxaliccord
    PackageDetails<DeviceProductDetails> packageDetails =
        getSnomioTestClient().getDevicePackDetails(COMBINE_ROLE_J_AND_J_1_CARTON);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    // change pack size to 2
    packageDetails.getContainedProducts().iterator().next().setValue(BigDecimal.valueOf(2));

    // calculate
    ProductSummary productSummary =
        getSnomioTestClient().calculateDeviceProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    confirmAmtModelLinks(productSummary);

    Ticket ticketResponse =
        getSnomioTestClient().createTicket("createSimpleProductFromExistingWithPackSizeChange");

    // create
    ProductSummary createdProduct =
        getSnomioTestClient()
            .createDeviceProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId(), null));

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
    PackageDetails<DeviceProductDetails> packageDetailsPostCreation =
        getSnomioTestClient()
            .getDevicePackDetails(Long.parseLong(createdProduct.getSubject().getConceptId()));

    Assertions.assertThat(packageDetailsPostCreation).isEqualTo(packageDetails);
  }

  @Test
  void createSimpleProductFromExistingWithNewDeviceName() {
    // get Oxaliccord
    PackageDetails<DeviceProductDetails> packageDetails =
        getSnomioTestClient().getDevicePackDetails(COMBINE_ROLE_J_AND_J_1_CARTON);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    DeviceProductDetails productDetails =
        packageDetails.getContainedProducts().iterator().next().getProductDetails();
    productDetails.setSpecificDeviceType(null);
    productDetails.setNewSpecificDeviceName("New specific device name");

    // calculate
    ProductSummary productSummary =
        getSnomioTestClient().calculateDeviceProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    confirmAmtModelLinks(productSummary);

    Ticket ticketResponse =
        getSnomioTestClient().createTicket("createSimpleProductFromExistingWithPackSizeChange");

    // create
    ProductSummary createdProduct =
        getSnomioTestClient()
            .createDeviceProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId(), null));

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
    PackageDetails<DeviceProductDetails> packageDetailsPostCreation =
        getSnomioTestClient()
            .getDevicePackDetails(Long.parseLong(createdProduct.getSubject().getConceptId()));

    Assertions.assertThat(packageDetailsPostCreation.getContainedProducts()).size().isEqualTo(1);
    DeviceProductDetails productDetailsPostCreation =
        packageDetailsPostCreation.getContainedProducts().iterator().next().getProductDetails();
    Assertions.assertThat(productDetailsPostCreation.getSpecificDeviceType().getPt().getTerm())
        .isEqualTo("New specific device name");
    Assertions.assertThat(productDetailsPostCreation.getSpecificDeviceType().getFsn().getTerm())
        .isEqualTo("New specific device name (physical object)");
  }
}
