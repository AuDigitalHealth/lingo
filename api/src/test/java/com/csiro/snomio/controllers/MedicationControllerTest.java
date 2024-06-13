package com.csiro.snomio.controllers;

import static com.csiro.snomio.AmtTestData.AMOXIL_500_MG_CAPSULE;
import static com.csiro.snomio.AmtTestData.AMOXIL_500_MG_CAPSULE_28_BLISTER_PACK;
import static com.csiro.snomio.AmtTestData.NEXIUM_HP7;

import com.csiro.snomio.SnomioTestBase;
import com.csiro.snomio.product.ProductBrands;
import com.csiro.snomio.product.ProductPackSizes;
import io.restassured.common.mapper.TypeRef;
import java.math.BigDecimal;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class MedicationControllerTest extends SnomioTestBase {

  @Test
  void getComplexPackageDetail() {
    getSnomioTestClient().getMedicationPackDetails(NEXIUM_HP7);
  }

  @Test
  void getComplexPackageSizes() {
    getSnomioTestClient()
        .getRequest(
            "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/" + NEXIUM_HP7 + "/pack-sizes",
            HttpStatus.BAD_REQUEST,
            new TypeRef<>() {});
  }

  @Test
  void getComplexPackageBrands() {
    getSnomioTestClient()
        .getRequest(
            "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/" + NEXIUM_HP7 + "/brands",
            HttpStatus.BAD_REQUEST,
            new TypeRef<>() {});
  }

  @Test
  void getSimplePackgeDetail() {
    getSnomioTestClient().getMedicationPackDetails(AMOXIL_500_MG_CAPSULE_28_BLISTER_PACK);
  }

  @Test
  void getSimplePackgePackSizes() {
    ProductPackSizes packSizes =
        getSnomioTestClient().getMedicationProductPackSizes(AMOXIL_500_MG_CAPSULE_28_BLISTER_PACK);
    Assertions.assertEquals(1, packSizes.getPackSizes().size());
    Assertions.assertEquals(new BigDecimal("28.0"), packSizes.getPackSizes().iterator().next());
  }

  @Test
  void getSimplePackgeBrands() {
    ProductBrands brands =
        getSnomioTestClient().getMedicationProductBrands(AMOXIL_500_MG_CAPSULE_28_BLISTER_PACK);
    Assertions.assertEquals(2, brands.getBrands().size());
    brands.getBrands().forEach(b -> Assertions.assertEquals(1, b.getExternalIdentifiers().size()));
  }

  @Test
  void getSimpleProductDetail() {
    getSnomioTestClient().getMedicationProductDetails(AMOXIL_500_MG_CAPSULE);
  }
}
