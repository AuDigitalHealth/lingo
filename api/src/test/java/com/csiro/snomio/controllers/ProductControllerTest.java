package com.csiro.snomio.controllers;

import static com.csiro.snomio.AmtTestData.EMLA_5_PERCENT_PATCH_20_CARTON;
import static com.csiro.snomio.AmtTestData.NEXIUM_HP7;
import static com.csiro.snomio.AmtTestData.PICATO_0_015_PERCENT_GEL_3_X_470_MG_TUBES;
import static com.csiro.snomio.MedicationAssertions.confirmAmtModelLinks;
import static com.csiro.snomio.service.ProductService.CTPP_LABEL;
import static com.csiro.snomio.service.ProductService.MPP_LABEL;
import static com.csiro.snomio.service.ProductService.MPUU_LABEL;
import static com.csiro.snomio.service.ProductService.MP_LABEL;
import static com.csiro.snomio.service.ProductService.TPP_LABEL;
import static com.csiro.snomio.service.ProductService.TPUU_LABEL;
import static com.csiro.snomio.service.ProductService.TP_LABEL;

import com.csiro.snomio.MedicationAssertions;
import com.csiro.snomio.SnomioTestBase;
import com.csiro.snomio.product.ProductSummary;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class ProductControllerTest extends SnomioTestBase {

  @Test
  void getSimpleProductModel() {
    ProductSummary productSummary =
        getSnomioTestClient().getProductModel(EMLA_5_PERCENT_PATCH_20_CARTON);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, CTPP_LABEL);

    confirmAmtModelLinks(productSummary);
  }

  @Test
  void getComplexProductModel() {
    ProductSummary productSummary = getSnomioTestClient().getProductModel(NEXIUM_HP7);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 4, TP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 3, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 4, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 4, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 4, CTPP_LABEL);

    confirmAmtModelLinks(productSummary);
  }

  @Test
  @Disabled("Failing because of Snowstorm ECL defect, should reenable once that is resolved")
  void getProductModelExposingSnowstormEclDefect() {
    ProductSummary productSummary =
        getSnomioTestClient().getProductModel(PICATO_0_015_PERCENT_GEL_3_X_470_MG_TUBES);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, MPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 1, TPUU_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 2, MPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 2, TPP_LABEL);
    MedicationAssertions.assertProductSummaryHas(productSummary, 0, 2, CTPP_LABEL);

    confirmAmtModelLinks(productSummary);
  }
}
