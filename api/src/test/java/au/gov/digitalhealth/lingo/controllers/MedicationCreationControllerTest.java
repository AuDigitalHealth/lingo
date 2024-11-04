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
import static au.gov.digitalhealth.lingo.util.AmtConstants.INERT_SUBSTANCE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.UNIT_OF_PRESENTATION;

import au.gov.digitalhealth.lingo.AmtTestData;
import au.gov.digitalhealth.lingo.LingoTestBase;
import au.gov.digitalhealth.lingo.MedicationAssertions;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductCreationDetails;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.Ingredient;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.PackageQuantity;
import au.gov.digitalhealth.lingo.product.details.Quantity;
import au.gov.digitalhealth.tickets.models.Ticket;
import java.math.BigDecimal;
import java.util.List;
import lombok.extern.java.Log;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.DirtiesContext;

@Log
@DirtiesContext
class MedicationCreationControllerTest extends LingoTestBase {

  public static final long BETADINE_GAUZE = 50526011000036105L;

  @BeforeAll
  public static void setUpClass() {
    System.setProperty(
        "snomio.field-bindings.mappers.MAIN_SNOMEDCT-AU_AUAMT.product.validation.exclude.substances",
        "920012011000036105");
  }

  @Test
  void calculateExistingProductWithNoChanges() {
    // get Oxaliccord
    PackageDetails<MedicationProductDetails> packageDetails =
        getLingoTestClient()
            .getMedicationPackDetails(AmtTestData.OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    // calculate
    ProductSummary productSummary =
        getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, false, false);
  }

  @Test
  void validateProductSizeTotalQtyAndConcentrationChecks() {
    PackageDetails<MedicationProductDetails> packageDetails =
        getLingoTestClient()
            .getMedicationPackDetails(AmtTestData.OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID);
    Quantity productQty =
        packageDetails.getContainedProducts().get(0).getProductDetails().getQuantity();
    Ingredient ingredient =
        packageDetails
            .getContainedProducts()
            .get(0)
            .getProductDetails()
            .getActiveIngredients()
            .get(0);
    Quantity concentrationStrength = ingredient.getConcentrationStrength();
    Quantity totalQty = ingredient.getTotalQuantity();

    Assertions.assertThat(productQty).isNotNull();
    Assertions.assertThat(totalQty).isNotNull();
    Assertions.assertThat(concentrationStrength).isNotNull();
    ProductSummary productSummary =
        getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, false, false);

    // Error scenario setting  totalQty to null
    ingredient.setTotalQuantity(null);
    Assertions.assertThat(
            getLingoTestClient().calculateMedicationProductSummaryWithBadRequest(packageDetails))
        .contains(
            "Total quantity and concentration strength must be present if the product quantity exists for ingredient 395814003|Oxaliplatin (substance)| but total quantity is not specified");
    // Error scenario setting  concentration to null
    ingredient.setConcentrationStrength(null);
    ingredient.setTotalQuantity(totalQty); // reverting total qty
    Assertions.assertThat(
            getLingoTestClient().calculateMedicationProductSummaryWithBadRequest(packageDetails))
        .contains(
            "Total quantity and concentration strength must be present if the product quantity exists for ingredient 395814003|Oxaliplatin (substance)| but concentration strength is not specified");

    // Error scenario setting  totalQty && concentration to null
    ingredient.setConcentrationStrength(null);
    ingredient.setTotalQuantity(null);
    Assertions.assertThat(
            getLingoTestClient().calculateMedicationProductSummaryWithBadRequest(packageDetails))
        .contains(
            "Total quantity and concentration strength must be present if the product quantity exists for ingredient 395814003|Oxaliplatin (substance)| but total quantity and concentration strength are not specified");

    // should be passing for the excluded list
    ingredient.getActiveIngredient().conceptId(INERT_SUBSTANCE.getValue());
    ingredient.setBasisOfStrengthSubstance(null);
    productSummary = getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, false, false);
  }

  @Test
  void validateProductSizeTotalQtyAndConcentrationChecksForAnomalousProducts() {
    PackageDetails<MedicationProductDetails> packageDetails =
        getLingoTestClient()
            .getMedicationPackDetails(AmtTestData.OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID);
    Quantity productQty =
        packageDetails.getContainedProducts().get(0).getProductDetails().getQuantity();
    Ingredient ingredient =
        packageDetails
            .getContainedProducts()
            .get(0)
            .getProductDetails()
            .getActiveIngredients()
            .get(0);
    Quantity concentrationStrength = ingredient.getConcentrationStrength();
    Quantity totalQty = ingredient.getTotalQuantity();

    Assertions.assertThat(productQty).isNotNull();
    Assertions.assertThat(totalQty).isNotNull();
    Assertions.assertThat(concentrationStrength).isNotNull();
    ProductSummary productSummary =
        getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, false, false);

    // Changing pack size unit not matches with concentration denominator unit
    Assertions.assertThat(AmtTestData.UNIT_ML).isNotNull();
    Assertions.assertThat(AmtTestData.UNIT_MG_MG).isNotNull();
    productQty.setUnit(AmtTestData.UNIT_ML);
    Assertions.assertThat(productQty.getUnit().getConceptId())
        .isEqualTo(AmtTestData.UNIT_ML.getConceptId());
    ingredient.getConcentrationStrength().setUnit(AmtTestData.UNIT_MG_MG);
    Assertions.assertThat(ingredient.getConcentrationStrength().getUnit().getConceptId())
        .isEqualTo(AmtTestData.UNIT_MG_MG.getConceptId());
    ingredient.setTotalQuantity(null);
    ingredient.setBasisOfStrengthSubstance(
        null); // make sure this sets to null when concentration strength or total qty is null

    productSummary = getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, false, false); // make sure calculate goes well

    // Changing pack size unit to value other than mg or mL
    Assertions.assertThat(AmtTestData.UNIT_SACHET).isNotNull();
    productQty.setUnit(AmtTestData.UNIT_SACHET);
    Assertions.assertThat(productQty.getUnit().getConceptId())
        .isEqualTo(AmtTestData.UNIT_SACHET.getConceptId());

    // Setting concentration and total qty to null and
    ingredient.setConcentrationStrength(null);
    ingredient.setTotalQuantity(null);
    ingredient.setBasisOfStrengthSubstance(
        null); // make sure this sets to null when concentration strength or total qty is null

    productSummary = getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, false, false); // make sure calculate goes well
  }

  @Test
  void validateProductSizeTotalQuantityAndConcentrationValuesAreAligned() {

    // Make sure  Concentration Strength = Total Qty / product Size
    PackageDetails<MedicationProductDetails> packageDetails =
        getLingoTestClient()
            .getMedicationPackDetails(AmtTestData.OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID);

    fillTotalQtyAndStrength(
        BigDecimal.valueOf(100),
        BigDecimal.valueOf(10),
        BigDecimal.valueOf(10),
        packageDetails
            .getContainedProducts()
            .get(0)
            .getProductDetails()
            .getActiveIngredients()
            .get(0),
        packageDetails.getContainedProducts().get(0).getProductDetails().getQuantity());

    ProductSummary productSummary =
        getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, false, false);

    // Passing invalid concentration strength

    fillTotalQtyAndStrength(
        BigDecimal.valueOf(100),
        BigDecimal.valueOf(15),
        BigDecimal.valueOf(10),
        packageDetails
            .getContainedProducts()
            .get(0)
            .getProductDetails()
            .getActiveIngredients()
            .get(0),
        packageDetails.getContainedProducts().get(0).getProductDetails().getQuantity());
    Assertions.assertThat(
            getLingoTestClient().calculateMedicationProductSummaryWithBadRequest(packageDetails))
        .contains(
            "Concentration strength 15 for ingredient 395814003|Oxaliplatin (substance)| does not match calculated value");

    // Try with decimal points
    fillTotalQtyAndStrength(
        BigDecimal.valueOf(34453.333333),
        BigDecimal.valueOf(84.444444),
        BigDecimal.valueOf(408),
        packageDetails
            .getContainedProducts()
            .get(0)
            .getProductDetails()
            .getActiveIngredients()
            .get(0),
        packageDetails.getContainedProducts().get(0).getProductDetails().getQuantity());

    productSummary = getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, false, false);

    // Passing invalid concentration strength decimal check

    fillTotalQtyAndStrength(
        BigDecimal.valueOf(34453.333333),
        BigDecimal.valueOf(84.444445),
        BigDecimal.valueOf(408),
        packageDetails
            .getContainedProducts()
            .get(0)
            .getProductDetails()
            .getActiveIngredients()
            .get(0),
        packageDetails.getContainedProducts().get(0).getProductDetails().getQuantity());
    Assertions.assertThat(
            getLingoTestClient().calculateMedicationProductSummaryWithBadRequest(packageDetails))
        .contains(
            "Concentration strength 84.444445 for ingredient 395814003|Oxaliplatin (substance)| does not match calculated value 84.444444 from the provided total quantity and product quantity");
  }

  private void fillTotalQtyAndStrength(
      BigDecimal totalQty,
      BigDecimal concentrationStrength,
      BigDecimal productQty,
      Ingredient ingredient,
      Quantity productQuantity) {
    ingredient.getTotalQuantity().setValue(totalQty);
    ingredient.getConcentrationStrength().setValue(concentrationStrength);
    productQuantity.setValue(productQty);
  }

  @Test
  void createSimpleProductFromExistingWithPackSizeChange() {
    // get Oxaliccord
    PackageDetails<MedicationProductDetails> packageDetails =
        getLingoTestClient()
            .getMedicationPackDetails(AmtTestData.OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    // change pack size to 2
    packageDetails.getContainedProducts().iterator().next().setValue(new BigDecimal("2.0"));

    // calculate
    ProductSummary productSummary =
        getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, false, false);

    Ticket ticketResponse =
        getLingoTestClient().createTicket("createSimpleProductFromExistingWithPackSizeChange");

    productSummary.getNodes().stream()
        .filter(n -> n.getLabel().equals(TPP_LABEL))
        .findFirst()
        .get()
        .getNewConceptDetails()
        .setSpecifiedConceptId("736931000168108");

    // create
    ProductSummary createdProduct =
        getLingoTestClient()
            .createMedicationProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId(), null));

    Assertions.assertThat(createdProduct.getSingleSubject().getConceptId()).matches("\\d{7,18}");

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(createdProduct, false, false, false);

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
    confirmAmtModelLinks(productModelPostCreation, false, false, false);

    Assertions.assertThat(
            productModelPostCreation.getNodes().stream()
                .filter(n -> n.getLabel().equals(TPP_LABEL))
                .findFirst()
                .get()
                .getConceptId())
        .isEqualTo("736931000168108");

    // load atomic data
    PackageDetails<MedicationProductDetails> packageDetailsPostCreation =
        getLingoTestClient()
            .getMedicationPackDetails(
                Long.parseLong(createdProduct.getSingleSubject().getConceptId()));

    Assertions.assertThat(packageDetailsPostCreation).isEqualTo(packageDetails);
  }

  @Test
  void testOiiFilterForCalculate() {
    // get Oxaliccord
    PackageDetails<MedicationProductDetails> packageDetails =
        getLingoTestClient()
            .getMedicationPackDetails(AmtTestData.OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    // set oii
    packageDetails
        .getContainedProducts()
        .iterator()
        .next()
        .getProductDetails()
        .setOtherIdentifyingInformation("test-oii");

    // calculate
    ProductSummary productSummary =
        getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, CTPP_LABEL); // new CTPP
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPP_LABEL); // new TPP
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPUU_LABEL); // new TPU
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, false, false);
  }

  @Test
  void createComplexProductFromExistingWithPackSizeChange() {
    // get Oxaliccord
    PackageDetails<MedicationProductDetails> packageDetails =
        getLingoTestClient().getMedicationPackDetails(AmtTestData.NEXIUM_HP7);

    Assertions.assertThat(packageDetails.getContainedPackages()).size().isEqualTo(3);
    Assertions.assertThat(packageDetails.getContainedProducts()).isNullOrEmpty();

    for (PackageQuantity<MedicationProductDetails> innerPack :
        packageDetails.getContainedPackages()) {
      Assertions.assertThat(innerPack.getValue()).isEqualTo(BigDecimal.ONE.setScale(1));
      Assertions.assertThat(innerPack.getUnit().getConceptId())
          .isEqualTo(UNIT_OF_PRESENTATION.getValue());
    }

    // change pack size to 2
    packageDetails.getContainedPackages().iterator().next().setValue(new BigDecimal("2.0"));

    // calculate
    ProductSummary productSummary =
        getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 3, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 3, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 3, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 4, TP_LABEL);

    checkExternalIdentifiers(productSummary, packageDetails);

    Ticket ticketResponse =
        getLingoTestClient().createTicket("createComplexProductFromExistingWithPackSizeChange");

    // create
    ProductSummary createdProduct =
        getLingoTestClient()
            .createMedicationProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId(), null));

    Assertions.assertThat(createdProduct.getSingleSubject().getConceptId()).matches("\\d{7,18}");

    // load product model
    ProductSummary productModelPostCreation =
        getLingoTestClient().getProductModel(createdProduct.getSingleSubject().getConceptId());

    Assertions.assertThat(productModelPostCreation.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, TP_LABEL);

    checkExternalIdentifiers(productSummary, packageDetails);

    // load atomic data
    PackageDetails<MedicationProductDetails> packageDetailsPostCreation =
        getLingoTestClient()
            .getMedicationPackDetails(
                Long.parseLong(createdProduct.getSingleSubject().getConceptId()));

    MedicationAssertions.assertEqualPackage(packageDetailsPostCreation, packageDetails);
  }

  @Test
  void createComplexProductFromExistingWithProductSizeChange() {
    // get Oxaliccord
    PackageDetails<MedicationProductDetails> packageDetails =
        getLingoTestClient().getMedicationPackDetails(AmtTestData.NEXIUM_HP7);

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
    ProductSummary productSummary =
        getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 2, 2, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 2, 2, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 2, 2, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 4, TP_LABEL);

    Ticket ticketResponse =
        getLingoTestClient().createTicket("createComplexProductFromExistingWithProductSizeChange");

    // create
    ProductSummary createdProduct =
        getLingoTestClient()
            .createMedicationProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId(), null));

    Assertions.assertThat(createdProduct.getSingleSubject().getConceptId()).matches("\\d{7,18}");

    // load product model
    ProductSummary productModelPostCreation =
        getLingoTestClient().getProductModel(createdProduct.getSingleSubject().getConceptId());

    Assertions.assertThat(productModelPostCreation.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, TP_LABEL);

    confirmAmtModelLinks(productModelPostCreation, false, false, false);

    // load atomic data
    PackageDetails<MedicationProductDetails> packageDetailsPostCreation =
        getLingoTestClient()
            .getMedicationPackDetails(
                Long.parseLong(createdProduct.getSingleSubject().getConceptId()));

    // TODO this works around a different order in the packages...we need to consider this more
    MedicationAssertions.assertEqualPackage(packageDetailsPostCreation, packageDetails);
  }

  @Test
  void attemptCreateProductNoChangesPrimitiveMpuu() {
    log.info("Look up existing product");

    // get Arginine 2000 Amino Acid Supplement
    PackageDetails<MedicationProductDetails> packageDetails =
        getLingoTestClient().getMedicationPackDetails(BETADINE_GAUZE);

    // Combine assertions for package and product details
    Assertions.assertThat(packageDetails)
        .satisfies(
            details -> {
              Assertions.assertThat(details.getContainedPackages()).isNullOrEmpty();
              Assertions.assertThat(details.getContainedProducts()).hasSize(1);
            });

    log.info("Calculate preview");
    ProductSummary productSummary =
        getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();

    // Group product summary assertions into one block
    List<String> labels = List.of(CTPP_LABEL, TPP_LABEL, MPP_LABEL, TPUU_LABEL, MPUU_LABEL);
    labels.forEach(
        label -> MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, label));
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    // Combine assertions for MPUU nodes
    List<Node> mpuuNodes =
        productSummary.getNodes().stream().filter(n -> n.getLabel().equals(MPUU_LABEL)).toList();
    Assertions.assertThat(mpuuNodes)
        .hasSize(1)
        .first()
        .satisfies(
            mpuuNode -> {
              Assertions.assertThat(mpuuNode.isNewConcept()).isTrue();
              Assertions.assertThat(mpuuNode.getConcept()).isNull();
              Assertions.assertThat(mpuuNode.getConceptOptions()).hasSize(2);
            });

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, true, true);

    log.info("Create ticket");
    Ticket ticketResponse =
        getLingoTestClient().createTicket("attemptCreateProductNoChangesPrimitiveMpuu");

    log.info("Create product");
    ProductSummary createdProduct =
        getLingoTestClient()
            .createMedicationProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId(), null));

    Assertions.assertThat(createdProduct.getSingleSubject().getConceptId()).matches("\\d{7,18}");

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(createdProduct, false, false, false);

    log.info("Load product model after creation");
    ProductSummary productModelPostCreation =
        getLingoTestClient().getProductModel(createdProduct.getSingleSubject().getConceptId());

    Assertions.assertThat(productModelPostCreation.isContainsNewConcepts()).isFalse();

    labels.forEach(
        label ->
            MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, label));
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TP_LABEL);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productModelPostCreation, false, false, false);

    log.info("Load atomic data after creation");
    PackageDetails<MedicationProductDetails> packageDetailsPostCreation =
        getLingoTestClient()
            .getMedicationPackDetails(
                Long.parseLong(createdProduct.getSingleSubject().getConceptId()));

    MedicationAssertions.assertEqualPackage(packageDetailsPostCreation, packageDetails);
  }

  @Test
  void attemptCreateProductNoChangesPrimitiveMpuuSelected() {
    log.info("Look up existing product");

    // get Arginine 2000 Amino Acid Supplement
    PackageDetails<MedicationProductDetails> packageDetails =
        getLingoTestClient().getMedicationPackDetails(BETADINE_GAUZE);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    // no changes

    log.info("Calculate preview");
    // calculate
    ProductSummary productSummary =
        getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    List<Node> mpuuNodes =
        productSummary.getNodes().stream().filter(n -> n.getLabel().equals(MPUU_LABEL)).toList();
    Assertions.assertThat(mpuuNodes).size().isEqualTo(1);
    Node mpuuNode = mpuuNodes.iterator().next();
    Assertions.assertThat(mpuuNode.isNewConcept()).isTrue();
    Assertions.assertThat(mpuuNode.getConcept()).isNull();
    Assertions.assertThat(mpuuNode.getConceptOptions()).size().isEqualTo(2);

    checkExternalIdentifiers(productSummary, packageDetails);
    confirmAmtModelLinks(productSummary, false, true, true);

    packageDetails.getSelectedConceptIdentifiers().add("50915011000036102");

    productSummary = getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    checkExternalIdentifiers(productSummary, packageDetails);
  }

  @Test
  void createAndUpdateProductWithNewStrengthAndPackSize() {
    // Step 1: Load an existing single ingredient/component product
    PackageDetails<MedicationProductDetails> packageDetails =
        getLingoTestClient()
            .getMedicationPackDetails(AmtTestData.AMOXIL_500_MG_CAPSULE_28_BLISTER_PACK);

    // Step 2: Change the strength of the ingredient to a unique value
    Ingredient ingredient =
        packageDetails
            .getContainedProducts()
            .get(0)
            .getProductDetails()
            .getActiveIngredients()
            .get(0);
    ingredient.getTotalQuantity().setValue(BigDecimal.valueOf(99999)); // Unique strength

    // Step 3: Perform a calculate/preview operation
    ProductSummary productSummary =
        getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    // Step 4: Verify the calculation
    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    checkExternalIdentifiers(productSummary, packageDetails);

    // Step 5: Create the product
    Ticket ticketResponse =
        getLingoTestClient().createTicket("createAndUpdateProductWithNewStrengthAndPackSize");
    ProductSummary createdProduct =
        getLingoTestClient()
            .createMedicationProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId(), null));

    // Step 6: Load the new product and verify all concepts are existing
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

    // Step 7: Update the pack size to a new unique value
    packageDetails
        .getContainedProducts()
        .iterator()
        .next()
        .setValue(BigDecimal.valueOf(999)); // Unique pack size

    // Step 8: Perform another calculate/preview operation
    productSummary = getLingoTestClient().calculateMedicationProductSummary(packageDetails);

    // Step 9: Verify the calculation
    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    // Step 10: Ensure MPUU and TPUU concepts are from the previously created product
    Assertions.assertThat(productSummary.getSingleConceptWithLabel(MPUU_LABEL).getConceptId())
        .isEqualTo(createdProduct.getSingleConceptWithLabel(MPUU_LABEL).getConceptId());
    Assertions.assertThat(productSummary.getSingleConceptWithLabel(TPUU_LABEL).getConceptId())
        .isEqualTo(createdProduct.getSingleConceptWithLabel(TPUU_LABEL).getConceptId());

    checkExternalIdentifiers(productSummary, packageDetails);
  }
}
