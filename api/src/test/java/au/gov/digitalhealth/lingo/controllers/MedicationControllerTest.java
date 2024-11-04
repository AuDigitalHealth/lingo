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

import static org.assertj.core.api.Assertions.assertThat;

import au.gov.digitalhealth.lingo.AmtTestData;
import au.gov.digitalhealth.lingo.LingoTestBase;
import au.gov.digitalhealth.lingo.product.ProductBrands;
import au.gov.digitalhealth.lingo.product.ProductPackSizes;
import io.restassured.common.mapper.TypeRef;
import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class MedicationControllerTest extends LingoTestBase {

  @Test
  void getComplexPackageDetail() {
    Assertions.assertNotNull(getLingoTestClient().getMedicationPackDetails(AmtTestData.NEXIUM_HP7));
  }

  @Test
  void getComplexPackageSizes() {
    Assertions.assertNotNull(
        getLingoTestClient()
            .getRequest(
                "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/" + AmtTestData.NEXIUM_HP7 + "/pack-sizes",
                HttpStatus.BAD_REQUEST,
                new TypeRef<>() {}));
  }

  @Test
  void getComplexPackageBrands() {
    Assertions.assertNotNull(
        getLingoTestClient()
            .getRequest(
                "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/" + AmtTestData.NEXIUM_HP7 + "/brands",
                HttpStatus.BAD_REQUEST,
                new TypeRef<>() {}));
  }

  @Test
  void getSimplePackgeDetail() {
    Assertions.assertNotNull(
        getLingoTestClient()
            .getMedicationPackDetails(AmtTestData.AMOXIL_500_MG_CAPSULE_28_BLISTER_PACK));
  }

  @Test
  void getSimplePackgePackSizes() {
    ProductPackSizes packSizes =
        getLingoTestClient().getMedicationProductPackSizes(140491000036103L);
    Assertions.assertEquals(5, packSizes.getPackSizes().size());
    Set<Pair<BigDecimal, String>> packSizeWithIdentifiers =
        packSizes.getPackSizes().stream()
            .map(
                p ->
                    Pair.of(
                        p.getPackSize(),
                        p.getExternalIdentifiers().iterator().next().getIdentifierValue()))
            .collect(Collectors.toSet());
    assertThat(packSizeWithIdentifiers)
        .containsExactlyInAnyOrder(
            Pair.of(new BigDecimal("5.0"), "175178"),
            Pair.of(new BigDecimal("10.0"), "175178"),
            Pair.of(new BigDecimal("25.0"), "175178"),
            Pair.of(new BigDecimal("20.0"), "175178"),
            Pair.of(new BigDecimal("30.0"), "175178"));
  }

  @Test
  void getSimplePackgeBrands() {
    ProductBrands brands =
        getLingoTestClient()
            .getMedicationProductBrands(AmtTestData.AMOXIL_500_MG_CAPSULE_28_BLISTER_PACK);
    Assertions.assertEquals(2, brands.getBrands().size());
    brands.getBrands().forEach(b -> Assertions.assertEquals(1, b.getExternalIdentifiers().size()));
  }

  @Test
  void getSimpleProductDetail() {
    Assertions.assertNotNull(
        getLingoTestClient().getMedicationProductDetails(AmtTestData.AMOXIL_500_MG_CAPSULE));
  }
}
