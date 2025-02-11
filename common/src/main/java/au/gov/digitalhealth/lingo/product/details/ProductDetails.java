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
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
  @Type(value = MedicationProductDetails.class, name = "medication"),
  @Type(value = DeviceProductDetails.class, name = "device")
})
public abstract class ProductDetails extends ProductBaseDto {
  @NotNull @Valid Quantity packSize;
  @NotNull SnowstormConceptMini productName;
  String otherIdentifyingInformation;

  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    Map<String, String> idMap = addToIdFsnMap(null, productName);
    idMap.putAll(getSpecialisedIdFsnMap());
    return idMap;
  }

  @JsonIgnore
  protected abstract Map<String, String> getSpecialisedIdFsnMap();
}
