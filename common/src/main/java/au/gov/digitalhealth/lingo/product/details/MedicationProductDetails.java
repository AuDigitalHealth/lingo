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
import au.gov.digitalhealth.lingo.validation.ValidSnowstormConceptMini;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeName;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@JsonTypeName("medication")
@OnlyOnePopulated(
    fields = {"containerType", "deviceType"},
    message = "Only container type or device type can be populated, not both")
public class MedicationProductDetails extends ProductDetails {
  @ValidSnowstormConceptMini SnowstormConceptMini existingMedicinalProduct;
  @ValidSnowstormConceptMini SnowstormConceptMini existingClinicalDrug;

  @ValidSnowstormConceptMini SnowstormConceptMini genericForm;
  @ValidSnowstormConceptMini SnowstormConceptMini specificForm;

  // These are the old unit of use/presentation attributes needed until purged
  @Valid Quantity quantity;
  @ValidSnowstormConceptMini SnowstormConceptMini containerType;
  @ValidSnowstormConceptMini SnowstormConceptMini unitOfPresentation;

  Set<@ValidSnowstormConceptMini SnowstormConceptMini> playsRole = new HashSet<>();

  List<@Valid Ingredient> activeIngredients = new ArrayList<>();

  @Override
  public ProductType getType() {
    if (deviceType != null) {
      this.type = ProductType.DRUG_DEVICE;
    } else {
      this.type = ProductType.MEDICATION;
    }
    return type;
  }

  @Override
  public ProductTemplate getProductType() {
    if (productType == null) {
      productType = determineProductType(activeIngredients);
    }
    return productType;
  }

  private ProductTemplate determineProductType(List<Ingredient> activeIngredients) {
    if (activeIngredients.isEmpty()) {
      return ProductTemplate.NO_INGREDIENTS;
    }

    for (Ingredient ingredient : activeIngredients) {
      if (ingredient.isIngredientConcentrationStrength()
          && ingredient.isIngredientPresentationStrength()) {
        return ProductTemplate.CONCENTRATION_AND_PRESENTATION_STRENGTH;
      } else if (ingredient.isIngredientConcentrationStrength()) {
        return ProductTemplate.CONCENTRATION_STRENGTH;
      } else if (ingredient.isIngredientPresentationStrength()) {
        return ProductTemplate.PRESENTATION_STRENGTH;
      }
    }

    return ProductTemplate.NO_STRENGTH;
  }

  @Override
  protected Map<String, String> getSpecialisedIdFsnMap() {
    Map<String, String> idMap = addToIdFsnMap(null, quantity);
    if (genericForm != null) {
      addToIdFsnMap(idMap, genericForm);
    }
    if (specificForm != null) {
      addToIdFsnMap(idMap, specificForm);
    }
    if (quantity != null) {
      idMap.putAll(quantity.getIdFsnMap());
    }
    if (containerType != null) {
      addToIdFsnMap(idMap, containerType);
    }
    for (SnowstormConceptMini role : playsRole) {
      addToIdFsnMap(idMap, role);
    }
    for (Ingredient ingredient : activeIngredients) {
      addToIdFsnMap(idMap, ingredient);
    }
    return idMap;
  }

  @Override
  protected Map<String, String> getSpecialisedIdPtMap() {
    Map<String, String> idMap = addToIdPtMap(null, quantity);
    if (genericForm != null) {
      addToIdPtMap(idMap, genericForm);
    }
    if (specificForm != null) {
      addToIdPtMap(idMap, specificForm);
    }
    if (quantity != null) {
      idMap.putAll(quantity.getIdPtMap());
    }
    if (containerType != null) {
      addToIdPtMap(idMap, containerType);
    }
    for (SnowstormConceptMini role : playsRole) {
      addToIdPtMap(idMap, role);
    }
    for (Ingredient ingredient : activeIngredients) {
      addToIdPtMap(idMap, ingredient);
    }
    return idMap;
  }

  public boolean hasDeviceType() {
    return deviceType != null;
  }

  @JsonIgnore
  @Override
  public NmpcType getNmpcType() {
    return NmpcType.NMPC_MEDICATION;
  }
}
