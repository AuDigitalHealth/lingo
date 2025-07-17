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
import au.gov.digitalhealth.lingo.util.NmpcConstants;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
  @JsonSubTypes.Type(value = MedicationProductDetails.class, name = "medication"),
  @JsonSubTypes.Type(value = DeviceProductDetails.class, name = "device"),
  @JsonSubTypes.Type(value = VaccineProductDetails.class, name = "vaccine"),
  @JsonSubTypes.Type(value = NutritionalProductDetails.class, name = "nutritional")
})
public abstract class ProductDetails extends PackageProductDetailsBase {
  @NotNull SnowstormConceptMini productName;
  SnowstormConceptMini deviceType;
  String otherIdentifyingInformation;
  public abstract String getProductType();
  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    Map<String, String> idMap = new HashMap<>();
    idMap.put(productName.getConceptId(), SnowstormDtoUtil.getFsnTerm(productName));
    if (deviceType != null) {
      idMap.put(deviceType.getConceptId(), SnowstormDtoUtil.getFsnTerm(deviceType));
    }
    idMap.putAll(getSpecialisedIdFsnMap());
    return idMap;
  }

  @JsonIgnore
  public Map<String, String> getIdPtMap() {
    Map<String, String> idMap = new HashMap<>();
    idMap.put(productName.getConceptId(), SnowstormDtoUtil.getPtTerm(productName));
    if (deviceType != null) {
      idMap.put(deviceType.getConceptId(), SnowstormDtoUtil.getPtTerm(deviceType));
    }
    idMap.putAll(getSpecialisedIdPtMap());
    return idMap;
  }

  protected abstract Map<String, String> getSpecialisedIdPtMap();

  protected abstract Map<String, String> getSpecialisedIdFsnMap();

  public abstract boolean hasDeviceType();

}
