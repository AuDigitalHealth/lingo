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

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.gov.digitalhealth.lingo.util.NmpcType;
import au.gov.digitalhealth.lingo.validation.OnlyOnePopulated;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeName;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@JsonTypeName("vaccine")
@OnlyOnePopulated(
    fields = {"containerType", "deviceType"},
    message = "Only container type or device type can be populated, not both")
public class VaccineProductDetails extends MedicationProductDetails {
  SnowstormConceptMini targetPopulation;
  SnowstormConceptMini qualitiativeStrength;

  public VaccineProductDetails() {
    this.type = ProductType.VACCINE;
  }

  @Override
  public ProductType getType() {
    return type;
  }

  @Override
  protected Map<String, String> getSpecialisedIdFsnMap() {
    Map<String, String> idMap = super.getSpecialisedIdFsnMap();
    if (targetPopulation != null) {
      addToIdFsnMap(idMap, targetPopulation);
    }
    if (qualitiativeStrength != null) {
      addToIdFsnMap(idMap, qualitiativeStrength);
    }
    return idMap;
  }

  @Override
  protected Map<String, String> getSpecialisedIdPtMap() {
    Map<String, String> idMap = super.getSpecialisedIdPtMap();
    if (targetPopulation != null) {
      addToIdPtMap(idMap, targetPopulation);
    }
    if (qualitiativeStrength != null) {
      addToIdPtMap(idMap, qualitiativeStrength);
    }
    return idMap;
  }

  @JsonIgnore
  @Override
  public NmpcType getNmpcType() {
    return NmpcType.NMPC_VACCINE;
  }
}
