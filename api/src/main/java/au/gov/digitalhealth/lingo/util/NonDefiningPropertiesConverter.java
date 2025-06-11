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
package au.gov.digitalhealth.lingo.util;

import static au.gov.digitalhealth.lingo.util.SnomedConstants.ADDITIONAL_RELATIONSHIP;

import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningPropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.NonDefiningPropertyDataType;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.PackageProductDetailsBase;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class NonDefiningPropertiesConverter {
  private NonDefiningPropertiesConverter() {
    // Utility class
  }

  public static Set<SnowstormRelationship> calculateNonDefiningRelationships(
      ModelConfiguration modelConfiguration,
      PackageProductDetailsBase packageDetails,
      ModelLevelType modelLevelType) {
    return calculateNonDefiningRelationships(
        modelConfiguration, packageDetails.getNonDefiningProperties(), modelLevelType);
  }

  public static Set<SnowstormRelationship> calculateNonDefiningRelationships(
      ModelConfiguration modelConfiguration,
      Collection<NonDefiningBase> nonDefiningProperties,
      ModelLevelType modelLevelType) {

    if (nonDefiningProperties.isEmpty()) {
      return Set.of();
    }

    Map<String, NonDefiningPropertyDefinition> nonDefiningPropertiesByName =
        modelConfiguration.getNonDefiningPropertiesByName();

    Set<SnowstormRelationship> snowstormRelationships = new HashSet<>();

    for (au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty
        nonDefiningProperty :
            au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty.filter(
                nonDefiningProperties)) {
      NonDefiningPropertyDefinition modelNonDefiningPropertyDefinition =
          nonDefiningPropertiesByName.get(nonDefiningProperty.getIdentifierScheme());

      if (modelNonDefiningPropertyDefinition == null) {
        throw new ProductAtomicDataValidationProblem(
            "Non-defining property "
                + nonDefiningProperty.getIdentifierScheme()
                + " is not valid for this product");
      }

      if (modelNonDefiningPropertyDefinition.getModelLevels().contains(modelLevelType)) {
        snowstormRelationships.add(
            convertToRelationship(
                nonDefiningProperty,
                modelConfiguration.getModuleId(),
                modelNonDefiningPropertyDefinition));
      }
    }

    return snowstormRelationships;
  }

  public static SnowstormRelationship calculateNonDefiningRelationships(
      au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty value,
      String conceptId,
      Collection<NonDefiningPropertyDefinition> propertyDefinitions,
      String moduleId) {

    List<NonDefiningPropertyDefinition> filteredPropertyDefinition =
        propertyDefinitions.stream()
            .filter(
                propertyDefinition ->
                    propertyDefinition.getName().equals(value.getIdentifierScheme()))
            .toList();

    if (filteredPropertyDefinition.isEmpty()) {
      throw new ProductAtomicDataValidationProblem(
          "Non-defining property "
              + value.getIdentifierScheme()
              + " is not valid for this product");
    } else if (filteredPropertyDefinition.size() > 1) {
      throw new ProductAtomicDataValidationProblem(
          "Non-defining property "
              + value.getIdentifierScheme()
              + " is defined multiple times in the model");
    }
    NonDefiningPropertyDefinition propertyDefinition = filteredPropertyDefinition.get(0);

    SnowstormRelationship snowstormRelationship =
        convertToRelationship(value, moduleId, propertyDefinition);
    snowstormRelationship.setSourceId(conceptId);
    return snowstormRelationship;
  }

  private static SnowstormRelationship convertToRelationship(
      au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty value,
      String moduleId,
      NonDefiningPropertyDefinition propertyDefinition) {
    SnowstormRelationship snowstormRelationship;
    if (propertyDefinition.getDataType().equals(NonDefiningPropertyDataType.CONCEPT)) {
      if (value.getValueObject() == null) {
        throw new ProductAtomicDataValidationProblem(
            "Non-defining property " + propertyDefinition.getIdentifier() + " is missing");
      }
      snowstormRelationship =
          SnowstormDtoUtil.getSnowstormRelationship(
              propertyDefinition.asLingoConstant(),
              value.getValueObject(),
              0,
              ADDITIONAL_RELATIONSHIP,
              moduleId);
    } else {
      if (value.getValue() == null) {
        throw new ProductAtomicDataValidationProblem(
            "Non-defining property " + propertyDefinition.getIdentifier() + " is missing");
      }
      snowstormRelationship =
          SnowstormDtoUtil.getSnowstormDatatypeComponent(
              propertyDefinition.asLingoConstant(),
              value.getValue(),
              propertyDefinition.getDataType().getSnowstormDatatype(),
              0,
              ADDITIONAL_RELATIONSHIP,
              moduleId);
    }
    return snowstormRelationship;
  }
}
