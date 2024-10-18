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
package au.gov.digitalhealth.lingo;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.IOException;
import org.springframework.core.io.ClassPathResource;

public class AmtTestData {

  public static final long EMLA_5_PERCENT_PATCH_20_CARTON = 60912011000036106L;
  public static final long OXALICCORD_50ML_PER_10ML_IN_10ML_VIAL_CTPP_ID = 24441000036107L;
  public static final long NEXIUM_HP7 = 21062011000036103L;
  public static final long PICATO_0_015_PERCENT_GEL_3_X_470_MG_TUBES = 117891000036107L;
  public static final long AMOXIL_500_MG_CAPSULE_28_BLISTER_PACK = 700027211000036107L;
  public static final long AMOXIL_500_MG_CAPSULE = 6140011000036103L;
  public static final long COMBINE_ROLE_J_AND_J_1_CARTON = 688631000168101L;
  public static final long COMBINE_ROLL_10_X_10 = 48646011000036109L;

  public static final long SACHET = 733013000L;

  public static final SnowstormConceptMini UNIT_SACHET = initializeUnitSachet();
  public static final SnowstormConceptMini UNIT_MG_MG = initializeUnitMgMg();

  public static final SnowstormConceptMini UNIT_ML = initializeUnitML();

  private static SnowstormConceptMini initializeUnitSachet() {
    return getSnowStormConcept("test-unit-sachet.json");
  }

  private static SnowstormConceptMini initializeUnitMgMg() {
    return getSnowStormConcept("test-unit-mg-mg.json");
  }

  private static SnowstormConceptMini initializeUnitML() {
    return getSnowStormConcept("test-unit-mL.json");
  }

  private static SnowstormConceptMini getSnowStormConcept(String fileName) {
    ObjectMapper objectMapper = new ObjectMapper();
    SnowstormConceptMini snowstormConceptMini = null;
    try {
      snowstormConceptMini =
          objectMapper.readValue(
              new File(new ClassPathResource(fileName).getFile().getAbsolutePath()),
              SnowstormConceptMini.class);
    } catch (IOException e) {
      throw new RuntimeException("Failed to initialize " + fileName, e);
    }
    return snowstormConceptMini;
  }
}
