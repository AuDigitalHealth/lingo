package com.csiro.snomio.controllers;

import static com.csiro.snomio.AmtTestData.AMOXIL_500_MG_CAPSULE;
import static com.csiro.snomio.AmtTestData.AMOXIL_500_MG_CAPSULE_28_BLISTER_PACK;
import static com.csiro.snomio.AmtTestData.NEXIUM_HP7;

import com.csiro.snomio.SnomioTestBase;
import org.junit.jupiter.api.Test;

class MedicationControllerTest extends SnomioTestBase {

  @Test
  void getComplexPackageDetail() {
    getSnomioTestClient().getMedicationPackDetails(NEXIUM_HP7);
  }

  @Test
  void getSimplePackgeDetail() {
    getSnomioTestClient().getMedicationPackDetails(AMOXIL_500_MG_CAPSULE_28_BLISTER_PACK);
  }

  @Test
  void getSimpleProductDetail() {
    getSnomioTestClient().getMedicationProductDetails(AMOXIL_500_MG_CAPSULE);
  }
}
