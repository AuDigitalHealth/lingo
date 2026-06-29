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
package au.gov.digitalhealth.lingo.product.details;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class ProductDetailsBrandedNameTest {

  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  void deserialisesBrandedProductNameOnMedication() throws Exception {
    String json =
        "{\"type\":\"medication\",\"brandedProductName\":\"Ongentys 50 mg hard capsules\"}";

    ProductDetails details = mapper.readValue(json, ProductDetails.class);

    assertTrue(details instanceof MedicationProductDetails);
    assertEquals("Ongentys 50 mg hard capsules", details.getBrandedProductName());
  }

  @Test
  void brandedProductNameDefaultsNull() {
    assertNull(new MedicationProductDetails().getBrandedProductName());
  }
}
