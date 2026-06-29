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
package au.gov.digitalhealth.lingo.configuration.model;

import static org.assertj.core.api.Assertions.assertThat;

import au.gov.digitalhealth.lingo.configuration.Configuration;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(classes = Configuration.class)
@ActiveProfiles("test")
class BrandedProductNameConfigTest {

  @Autowired Models models;

  @Test
  void nmpcSupportsBrandedProductNameAmtDoesNot() {
    ModelConfiguration nmpc = models.getModelConfiguration("MAIN_SNOMEDCT-IE");
    ModelConfiguration amt = models.getModelConfiguration("MAIN_SNOMEDCT-AU");

    assertThat(nmpc.getModelType()).isEqualTo(ModelType.NMPC);
    assertThat(nmpc.isNameGeneratorSupportsBrandedProductName()).isTrue();
    assertThat(amt.isNameGeneratorSupportsBrandedProductName()).isFalse();
  }
}
