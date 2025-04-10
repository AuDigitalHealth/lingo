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
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.NonDefiningPropertyDataType;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.PackageProductDetailsBase;
import java.util.HashSet;
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
    if (packageDetails.getNonDefiningProperties().isEmpty()) {
      return Set.of();
    }

    Map<String, NonDefiningProperty> nonDefiningPropertiesByName =
        modelConfiguration.getNonDefiningPropertiesByName();

    Set<SnowstormRelationship> snowstormRelationships = new HashSet<>();

    for (au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty
        nonDefiningProperty : packageDetails.getNonDefiningProperties()) {
      NonDefiningProperty modelNonDefiningProperty =
          nonDefiningPropertiesByName.get(nonDefiningProperty.getIdentifierScheme());

      if (modelNonDefiningProperty == null) {
        throw new ProductAtomicDataValidationProblem(
            "Non-defining property "
                + nonDefiningProperty.getIdentifierScheme()
                + " is not valid for this product");
      }

      if (modelNonDefiningProperty.getModelLevels().contains(modelLevelType)) {
        if (modelNonDefiningProperty.getDataType().equals(NonDefiningPropertyDataType.CONCEPT)) {
          if (nonDefiningProperty.getValueObject() == null) {
            throw new ProductAtomicDataValidationProblem(
                "Non-defining property "
                    + modelNonDefiningProperty.getIdentifier()
                    + " is missing");
          }
          SnowstormDtoUtil.getSnowstormRelationship(
              modelNonDefiningProperty.asLingoConstant(),
              nonDefiningProperty.getValueObject(),
              0,
              ADDITIONAL_RELATIONSHIP);
        } else {
          if (nonDefiningProperty.getValue() == null) {
            throw new ProductAtomicDataValidationProblem(
                "Non-defining property "
                    + modelNonDefiningProperty.getIdentifier()
                    + " is missing");
          }
          SnowstormDtoUtil.getSnowstormDatatypeComponent(
              modelNonDefiningProperty.asLingoConstant(),
              nonDefiningProperty.getValue(),
              modelNonDefiningProperty.getDataType().getSnowstormDatatype(),
              0,
              ADDITIONAL_RELATIONSHIP);
        }
      }
    }

    return snowstormRelationships;
  }
}
