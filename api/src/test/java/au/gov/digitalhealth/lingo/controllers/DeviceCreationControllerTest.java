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

import static au.gov.digitalhealth.lingo.MedicationAssertions.checkExternalIdentifiers;
import static au.gov.digitalhealth.lingo.MedicationAssertions.confirmAmtModelLinks;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.CTPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.MPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.MPUU_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.MP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.TPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.TPUU_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.TP_LABEL;

import au.gov.digitalhealth.lingo.AmtTestData;
import au.gov.digitalhealth.lingo.LingoTestBase;
import au.gov.digitalhealth.lingo.MedicationAssertions;
import au.gov.digitalhealth.lingo.product.ProductCreationDetails;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.tickets.models.Ticket;
import java.math.BigDecimal;
import lombok.extern.java.Log;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.DirtiesContext;

@Log
@DirtiesContext
class DeviceCreationControllerTest extends LingoTestBase {

  @Test
  void calculateExistingProductWithNoChanges() {
    PackageDetails<DeviceProductDetails> packageDetails =
        getLingoTestClient().getDevicePackDetails(AmtTestData.COMBINE_ROLE_J_AND_J_1_CARTON);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    // calculate
    ProductSummary productSummary =
        getLingoTestClient().calculateDeviceProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    Assertions.assertThat(
            productSummary.getNodes().stream()
                .filter(n -> n.getLabel().equals(TPUU_LABEL))
                .findFirst()
                .orElseThrow()
                .getConceptOptions())
        .isNotEmpty();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, true, false);
  }

  @Test
  void createSimpleProductFromExistingWithPackSizeChange() {
    // get Oxaliccord
    PackageDetails<DeviceProductDetails> packageDetails =
        getLingoTestClient().getDevicePackDetails(AmtTestData.COMBINE_ROLE_J_AND_J_1_CARTON);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    // change pack size to 2
    packageDetails.getContainedProducts().iterator().next().setValue(new BigDecimal("2.0"));

    // calculate
    ProductSummary productSummary =
        getLingoTestClient().calculateDeviceProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, true, false);

    Ticket ticketResponse =
        getLingoTestClient().createTicket("createSimpleProductFromExistingWithPackSizeChange");

    // create
    productSummary.getSubjects().clear();
    ProductSummary createdProduct =
        getLingoTestClient()
            .createDeviceProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId(), null, null));

    Assertions.assertThat(createdProduct.getSingleSubject().getConceptId()).matches("\\d{7,18}");

    confirmAmtModelLinks(createdProduct, false, true, false);

    // load product model
    ProductSummary productModelPostCreation =
        getLingoTestClient().getProductModel(createdProduct.getSingleSubject().getConceptId());

    Assertions.assertThat(productModelPostCreation.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TP_LABEL);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productModelPostCreation, false, true, false);

    // load atomic data
    PackageDetails<DeviceProductDetails> packageDetailsPostCreation =
        getLingoTestClient()
            .getDevicePackDetails(Long.parseLong(createdProduct.getSingleSubject().getConceptId()));

    Assertions.assertThat(packageDetailsPostCreation).isEqualTo(packageDetails);
  }

  @Test
  void createSimpleProductFromExistingWithNewDeviceName() {
    // get Oxaliccord
    PackageDetails<DeviceProductDetails> packageDetails =
        getLingoTestClient().getDevicePackDetails(AmtTestData.COMBINE_ROLE_J_AND_J_1_CARTON);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    DeviceProductDetails productDetails =
        packageDetails.getContainedProducts().iterator().next().getProductDetails();
    productDetails.setSpecificDeviceType(null);
    productDetails.setNewSpecificDeviceName("New specific device name");

    // calculate
    ProductSummary productSummary =
        getLingoTestClient().calculateDeviceProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, true, false);

    Ticket ticketResponse =
        getLingoTestClient().createTicket("createSimpleProductFromExistingWithPackSizeChange");

    // create
    ProductSummary createdProduct =
        getLingoTestClient()
            .createDeviceProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId(), null, null));

    Assertions.assertThat(createdProduct.getSingleSubject().getConceptId()).matches("\\d{7,18}");

    confirmAmtModelLinks(createdProduct, false, true, false);

    // load product model
    ProductSummary productModelPostCreation =
        getLingoTestClient().getProductModel(createdProduct.getSingleSubject().getConceptId());

    Assertions.assertThat(productModelPostCreation.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TP_LABEL);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productModelPostCreation, false, true, false);

    // load atomic data
    PackageDetails<DeviceProductDetails> packageDetailsPostCreation =
        getLingoTestClient()
            .getDevicePackDetails(Long.parseLong(createdProduct.getSingleSubject().getConceptId()));

    Assertions.assertThat(packageDetailsPostCreation.getContainedProducts()).size().isEqualTo(1);
    DeviceProductDetails productDetailsPostCreation =
        packageDetailsPostCreation.getContainedProducts().iterator().next().getProductDetails();
    Assertions.assertThat(productDetailsPostCreation.getSpecificDeviceType().getPt().getTerm())
        .isEqualTo("New specific device name");
    Assertions.assertThat(productDetailsPostCreation.getSpecificDeviceType().getFsn().getTerm())
        .isEqualTo("New specific device name (physical object)");
  }
}
