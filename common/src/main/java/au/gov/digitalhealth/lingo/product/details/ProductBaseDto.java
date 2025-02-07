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
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public abstract class ProductBaseDto {
  private static Map<String, String> initialiseMap(Map<String, String> idMap) {
    if (idMap == null) {
      idMap = new HashMap<>();
    }
    return idMap;
  }

  @JsonIgnore
  public abstract Map<String, String> getIdFsnMap();

  protected Map<String, String> addToIdFsnMap(
      Map<String, String> idMap, ProductBaseDto... productBaseDtos) {
    idMap = initialiseMap(idMap);
    for (ProductBaseDto productBaseDto : productBaseDtos) {
      if (productBaseDto != null) {
        idMap.putAll(productBaseDto.getIdFsnMap());
      }
    }
    return idMap;
  }

  protected Map<String, String> addToIdFsnMap(
      Map<String, String> idMap, SnowstormConceptMini... conceptMinis) {
    idMap = initialiseMap(idMap);
    for (SnowstormConceptMini conceptMini : conceptMinis) {
      if (conceptMini != null) {
        idMap.put(conceptMini.getConceptId(), SnowstormDtoUtil.getFsnTerm(conceptMini));
      }
    }
    return idMap;
  }

  protected Map<String, String> addToIdFsnMap(
      Map<String, String> idMap, Set<SnowstormConceptMini> concepts) {
    idMap = initialiseMap(idMap);
    if (concepts != null) {
      for (SnowstormConceptMini conceptMini : concepts) {
        if (conceptMini != null) {
          idMap.put(conceptMini.getConceptId(), SnowstormDtoUtil.getFsnTerm(conceptMini));
        }
      }
    }

    return idMap;
  }
}
