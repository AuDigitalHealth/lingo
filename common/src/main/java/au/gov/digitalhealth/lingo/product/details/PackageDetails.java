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
import au.gov.digitalhealth.lingo.configuration.model.BasePropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.util.NmpcType;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import au.gov.digitalhealth.lingo.validation.OnlyOneNotEmpty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
@OnlyOneNotEmpty(
    fields = {"containedProducts", "containedPackages"},
    message = "Either containedProducts or containedPackages must be populated, but not both")
public class PackageDetails<T extends ProductDetails> extends PackageProductDetailsBase {
  SnowstormConceptMini productName;
  SnowstormConceptMini containerType;
  List<@Valid ProductQuantity<T>> containedProducts = new ArrayList<>();
  List<@Valid PackageQuantity<T>> containedPackages = new ArrayList<>();
  List<String> selectedConceptIdentifiers = new ArrayList<>();
  String otherIdentifyingInformation;
  String genericOtherIdentifyingInformation;

  String variant;

  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    Map<String, String> idMap = new HashMap<>();
    if (productName != null) {
      idMap.put(productName.getConceptId(), SnowstormDtoUtil.getFsnTerm(productName));
    }
    if (containerType != null) {
      idMap.put(containerType.getConceptId(), SnowstormDtoUtil.getFsnTerm(containerType));
    }
    for (ProductQuantity<T> productQuantity : containedProducts) {
      idMap.putAll(productQuantity.getIdFsnMap());
    }
    for (PackageQuantity<T> packageQuantity : containedPackages) {
      idMap.putAll(packageQuantity.getIdFsnMap());
    }
    return idMap;
  }

  public void cascadeSelectedIdentifiers() {
    containedPackages.forEach(
        containedPackage -> {
          containedPackage
              .getPackageDetails()
              .getSelectedConceptIdentifiers()
              .addAll(selectedConceptIdentifiers);
          containedPackage.getPackageDetails().cascadeSelectedIdentifiers();
        });
  }

  @JsonIgnore
  public Map<String, String> getIdPtMap() {
    Map<String, String> idMap = new HashMap<>();
    if (productName != null) {
      idMap.put(productName.getConceptId(), SnowstormDtoUtil.getPtTerm(productName));
    }
    if (containerType != null) {
      idMap.put(containerType.getConceptId(), SnowstormDtoUtil.getPtTerm(containerType));
    }
    for (ProductQuantity<T> productQuantity : containedProducts) {
      idMap.putAll(productQuantity.getIdPtMap());
    }
    for (PackageQuantity<T> packageQuantity : containedPackages) {
      idMap.putAll(packageQuantity.getIdPtMap());
    }
    return idMap;
  }

  public boolean hasDeviceType() {
    return containedProducts.stream()
            .anyMatch(productQuantity -> productQuantity.getProductDetails().hasDeviceType())
        || containedPackages.stream()
            .anyMatch(packageQuantity -> packageQuantity.getPackageDetails().hasDeviceType());
  }

  public void cascadeProperties(ModelConfiguration modelConfiguration) {
    // copy properties from this package to the contained products
    nonDefiningProperties.forEach(
        nonDefiningProperty -> {
          BasePropertyDefinition propertyDefinition =
              modelConfiguration.getProperty(nonDefiningProperty.getIdentifierScheme());
          if (propertyDefinition.getModelLevels().stream()
              .anyMatch(ModelLevelType::isProductLevel)) {
            containedProducts.forEach(
                product ->
                    product
                        .getProductDetails()
                        .getNonDefiningProperties()
                        .add(nonDefiningProperty));
          }
        });
    // copy properties from the contained products to the packages
    containedProducts.forEach(
        containedProduct ->
            containedProduct
                .getProductDetails()
                .nonDefiningProperties
                .forEach(
                    nonDefiningProperty -> {
                      BasePropertyDefinition propertyDefinition =
                          modelConfiguration.getProperty(nonDefiningProperty.getIdentifierScheme());
                      if (propertyDefinition.getModelLevels().stream()
                          .anyMatch(ModelLevelType::isPackageLevel)) {
                        nonDefiningProperties.add(nonDefiningProperty);
                      }
                    }));
  }

  @JsonIgnore
  @Override
  public NmpcType getNmpcType() {
    return !getContainedPackages().isEmpty()
        ? getContainedPackages().stream()
            .findAny()
            .orElseThrow(() -> new LingoProblem("No contained package found looking for nmpc type"))
            .getPackageDetails()
            .getNmpcType()
        : getContainedProducts().stream()
            .findAny()
            .orElseThrow(() -> new LingoProblem("No contained product found looking for nmpc type"))
            .getProductDetails()
            .getNmpcType();
  }

  public String getVariant() {
    if (variant == null) {
      if (!containedProducts.isEmpty() && containedProducts.get(0).getProductDetails() != null) {
        variant = containedProducts.get(0).getProductDetails().getType();
      } else if (!containedPackages.isEmpty()
          && containedPackages.get(0).getPackageDetails() != null) {
        variant = containedPackages.get(0).getPackageDetails().getVariant();
      } else {
        String value = null;
        try {
          value = new ObjectMapper().writeValueAsString(this);
          log.severe(
              "No contained package or product found looking for variant in PackageDetails: "
                  + value);
        } catch (JsonProcessingException e) {
          log.log(Level.SEVERE, "Error serialising PackageDetails: " + e.getMessage(), e);
        }
        throw new LingoProblem(
            "No contained package or product found looking for variant: " + value);
      }
    }
    return variant;
  }

  @JsonIgnore
  public boolean isUnpopulated() {
    return (productName == null || productName.getConceptId() == null)
        && (containerType == null || containerType.getConceptId() == null)
        && containedProducts.isEmpty()
        && containedPackages.isEmpty();
  }
}
