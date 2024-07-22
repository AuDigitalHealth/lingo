package com.csiro.snomio.controllers;

import static com.csiro.snomio.AmtTestData.*;
import static com.csiro.snomio.MedicationAssertions.confirmAmtModelLinks;
import static com.csiro.snomio.service.ProductSummaryService.CTPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MPUU_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TPUU_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TP_LABEL;
import static com.csiro.snomio.util.SnomedConstants.UNIT_OF_PRESENTATION;

import com.csiro.snomio.MedicationAssertions;
import com.csiro.snomio.SnomioTestBase;
import com.csiro.snomio.product.Node;
import com.csiro.snomio.product.ProductCreationDetails;
import com.csiro.snomio.product.ProductSummary;
import com.csiro.snomio.product.details.*;
import com.csiro.tickets.models.Ticket;
import java.math.BigDecimal;
import java.util.List;
import lombok.extern.java.Log;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.DirtiesContext;

@Log
@DirtiesContext
class MedicationCreationControllerTest extends SnomioTestBase {

  public static final long BETADINE_GAUZE = 50526011000036105L;

  @Test
  void calculateExistingProductWithNoChanges() {
    // get Oxaliccord
    PackageDetails<MedicationProductDetails> packageDetails =
        getSnomioTestClient()
            .getMedicationPackDetails(OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    // calculate
    ProductSummary productSummary =
        getSnomioTestClient().calculateMedicationProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    confirmAmtModelLinks(productSummary, false, false, false);
  }

  @Test
  void validateProductSizeTotalQtyAndConcentrationChecks() {
    PackageDetails<MedicationProductDetails> packageDetails =
        getSnomioTestClient()
            .getMedicationPackDetails(OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID);
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
        getSnomioTestClient().calculateMedicationProductSummary(packageDetails);

    confirmAmtModelLinks(productSummary, false, false, false);

    // Error scenario setting  totalQty to null
    ingredient.setTotalQuantity(null);
    Assertions.assertThat(
            getSnomioTestClient().calculateMedicationProductSummaryWithBadRequest(packageDetails))
        .contains(
            "Total quantity and concentration strength must be present if the product quantity exists for ingredient 395814003|Oxaliplatin (substance)| but total quantity is not specified");
    // Error scenario setting  concentration to null
    ingredient.setConcentrationStrength(null);
    ingredient.setTotalQuantity(totalQty); // reverting total qty
    Assertions.assertThat(
            getSnomioTestClient().calculateMedicationProductSummaryWithBadRequest(packageDetails))
        .contains(
            "Total quantity and concentration strength must be present if the product quantity exists for ingredient 395814003|Oxaliplatin (substance)| but concentration strength is not specified");

    // Error scenario setting  totalQty && concentration to null
    ingredient.setConcentrationStrength(null);
    ingredient.setTotalQuantity(null);
    Assertions.assertThat(
            getSnomioTestClient().calculateMedicationProductSummaryWithBadRequest(packageDetails))
        .contains(
            "Total quantity and concentration strength must be present if the product quantity exists for ingredient 395814003|Oxaliplatin (substance)| but total quantity and concentration strength are not specified");
  }

  @Test
  void validateProductSizeTotalQtyAndConcentrationChecksForAnomalousProducts() {
    PackageDetails<MedicationProductDetails> packageDetails =
        getSnomioTestClient()
            .getMedicationPackDetails(OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID);
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
        getSnomioTestClient().calculateMedicationProductSummary(packageDetails);

    confirmAmtModelLinks(productSummary, false, false, false);

    // Changing pack size unit not matches with concentration denominator unit
    Assertions.assertThat(UNIT_ML).isNotNull();
    Assertions.assertThat(UNIT_MG_MG).isNotNull();
    productQty.setUnit(UNIT_ML);
    Assertions.assertThat(productQty.getUnit().getConceptId()).isEqualTo(UNIT_ML.getConceptId());
    ingredient.getConcentrationStrength().setUnit(UNIT_MG_MG);
    Assertions.assertThat(ingredient.getConcentrationStrength().getUnit().getConceptId())
        .isEqualTo(UNIT_MG_MG.getConceptId());
    ingredient.setTotalQuantity(null);
    ingredient.setBasisOfStrengthSubstance(
        null); // make sure this sets to null when concentration strength or total qty is null

    productSummary = getSnomioTestClient().calculateMedicationProductSummary(packageDetails);

    confirmAmtModelLinks(productSummary, false, false, false); // make sure calculate goes well

    // Changing pack size unit to value other than mg or mL
    Assertions.assertThat(UNIT_SACHET).isNotNull();
    productQty.setUnit(UNIT_SACHET);
    Assertions.assertThat(productQty.getUnit().getConceptId())
        .isEqualTo(UNIT_SACHET.getConceptId());

    // Setting concentration and total qty to null and
    ingredient.setConcentrationStrength(null);
    ingredient.setTotalQuantity(null);
    ingredient.setBasisOfStrengthSubstance(
        null); // make sure this sets to null when concentration strength or total qty is null

    productSummary = getSnomioTestClient().calculateMedicationProductSummary(packageDetails);

    confirmAmtModelLinks(productSummary, false, false, false); // make sure calculate goes well
  }

  @Test
  void validateProductSizeTotalQuantityAndConcentrationValuesAreAligned() {

    // Make sure  Concentration Strength = Total Qty / product Size
    PackageDetails<MedicationProductDetails> packageDetails =
        getSnomioTestClient()
            .getMedicationPackDetails(OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID);

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
        getSnomioTestClient().calculateMedicationProductSummary(packageDetails);

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
            getSnomioTestClient().calculateMedicationProductSummaryWithBadRequest(packageDetails))
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

    productSummary = getSnomioTestClient().calculateMedicationProductSummary(packageDetails);

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
            getSnomioTestClient().calculateMedicationProductSummaryWithBadRequest(packageDetails))
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
        getSnomioTestClient()
            .getMedicationPackDetails(OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    // change pack size to 2
    packageDetails.getContainedProducts().iterator().next().setValue(BigDecimal.valueOf(2));

    // calculate
    ProductSummary productSummary =
        getSnomioTestClient().calculateMedicationProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    confirmAmtModelLinks(productSummary, false, false, false);

    Ticket ticketResponse =
        getSnomioTestClient().createTicket("createSimpleProductFromExistingWithPackSizeChange");

    productSummary.getNodes().stream()
        .filter(n -> n.getLabel().equals(TPP_LABEL))
        .findFirst()
        .get()
        .getNewConceptDetails()
        .setSpecifiedConceptId("736931000168108");

    // create
    ProductSummary createdProduct =
        getSnomioTestClient()
            .createMedicationProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId(), null));

    Assertions.assertThat(createdProduct.getSingleSubject().getConceptId()).matches("\\d{7,18}");

    confirmAmtModelLinks(createdProduct, false, false, false);

    // load product model
    ProductSummary productModelPostCreation =
        getSnomioTestClient().getProductModel(createdProduct.getSingleSubject().getConceptId());

    Assertions.assertThat(productModelPostCreation.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TP_LABEL);

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
        getSnomioTestClient()
            .getMedicationPackDetails(
                Long.parseLong(createdProduct.getSingleSubject().getConceptId()));

    Assertions.assertThat(packageDetailsPostCreation).isEqualTo(packageDetails);
  }

  @Test
  void testOiiFilterForCalculate() {
    // get Oxaliccord
    PackageDetails<MedicationProductDetails> packageDetails =
        getSnomioTestClient()
            .getMedicationPackDetails(OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID);

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
        getSnomioTestClient().calculateMedicationProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isTrue();
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, CTPP_LABEL); // new CTPP
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPP_LABEL); // new TPP
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 1, 0, TPUU_LABEL); // new TPU
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);

    confirmAmtModelLinks(productSummary, false, false, false);
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
    ProductSummary productSummary =
        getSnomioTestClient().calculateMedicationProductSummary(packageDetails);

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
            .createMedicationProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId(), null));

    Assertions.assertThat(createdProduct.getSingleSubject().getConceptId()).matches("\\d{7,18}");

    // load product model
    ProductSummary productModelPostCreation =
        getSnomioTestClient().getProductModel(createdProduct.getSingleSubject().getConceptId());

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
            .getMedicationPackDetails(
                Long.parseLong(createdProduct.getSingleSubject().getConceptId()));

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
    ProductSummary productSummary =
        getSnomioTestClient().calculateMedicationProductSummary(packageDetails);

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
            .createMedicationProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId(), null));

    Assertions.assertThat(createdProduct.getSingleSubject().getConceptId()).matches("\\d{7,18}");

    // load product model
    ProductSummary productModelPostCreation =
        getSnomioTestClient().getProductModel(createdProduct.getSingleSubject().getConceptId());

    Assertions.assertThat(productModelPostCreation.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 3, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 4, TP_LABEL);

    MedicationAssertions.confirmAmtModelLinks(productModelPostCreation, false, false, false);

    // load atomic data
    PackageDetails<MedicationProductDetails> packageDetailsPostCreation =
        getSnomioTestClient()
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
        getSnomioTestClient().getMedicationPackDetails(BETADINE_GAUZE);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    // no changes

    log.info("Calculate preview");
    // calculate
    ProductSummary productSummary =
        getSnomioTestClient().calculateMedicationProductSummary(packageDetails);

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

    MedicationAssertions.confirmAmtModelLinks(productSummary, false, true, true);

    log.info("Create ticket");
    Ticket ticketResponse =
        getSnomioTestClient().createTicket("attemptCreateProductNoChangesPrimitiveMpuu");

    log.info("Create product");
    // create
    ProductSummary createdProduct =
        getSnomioTestClient()
            .createMedicationProduct(
                new ProductCreationDetails<>(
                    productSummary, packageDetails, ticketResponse.getId(), null));

    Assertions.assertThat(createdProduct.getSingleSubject().getConceptId()).matches("\\d{7,18}");

    MedicationAssertions.confirmAmtModelLinks(createdProduct, false, false, false);

    log.info("Load product model after creation");
    // load product model
    ProductSummary productModelPostCreation =
        getSnomioTestClient().getProductModel(createdProduct.getSingleSubject().getConceptId());

    Assertions.assertThat(productModelPostCreation.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productModelPostCreation, 0, 1, TP_LABEL);

    MedicationAssertions.confirmAmtModelLinks(productModelPostCreation, false, false, false);

    log.info("Load atomic data after creation");
    // load atomic data
    PackageDetails<MedicationProductDetails> packageDetailsPostCreation =
        getSnomioTestClient()
            .getMedicationPackDetails(
                Long.parseLong(createdProduct.getSingleSubject().getConceptId()));

    // TODO this works around a different order in the packages...we need to consider this more
    MedicationAssertions.assertEqualPackage(packageDetailsPostCreation, packageDetails);
  }

  @Test
  void attemptCreateProductNoChangesPrimitiveMpuuSelected() {
    log.info("Look up existing product");

    // get Arginine 2000 Amino Acid Supplement
    PackageDetails<MedicationProductDetails> packageDetails =
        getSnomioTestClient().getMedicationPackDetails(BETADINE_GAUZE);

    Assertions.assertThat(packageDetails.getContainedPackages()).isNullOrEmpty();
    Assertions.assertThat(packageDetails.getContainedProducts()).size().isEqualTo(1);

    // no changes

    log.info("Calculate preview");
    // calculate
    ProductSummary productSummary =
        getSnomioTestClient().calculateMedicationProductSummary(packageDetails);

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

    MedicationAssertions.confirmAmtModelLinks(productSummary, false, true, true);

    packageDetails.getSelectedConceptIdentifiers().add("50915011000036102");

    productSummary = getSnomioTestClient().calculateMedicationProductSummary(packageDetails);

    Assertions.assertThat(productSummary.isContainsNewConcepts()).isFalse();
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, CTPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);
  }
}
