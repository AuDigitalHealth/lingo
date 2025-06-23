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
package au.gov.digitalhealth.lingo.service.validators;

import au.gov.digitalhealth.lingo.configuration.model.ExternalIdentifierDefinition;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import java.util.Map;

public interface MedicationDetailsValidator {

  static void validateExternalIdentifier(
      ExternalIdentifier externalIdentifier,
      Map<String, ExternalIdentifierDefinition> mappingRefsets) {
    if (!mappingRefsets.containsKey(externalIdentifier.getIdentifierScheme())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier scheme "
              + externalIdentifier.getIdentifierScheme()
              + " is not valid for this product");
    }
    ExternalIdentifierDefinition externalIdentifierDefinition =
        mappingRefsets.get(externalIdentifier.getIdentifierScheme());
    if (!externalIdentifierDefinition
        .getMappingTypes()
        .contains(externalIdentifier.getRelationshipType())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier relationship type "
              + externalIdentifier.getRelationshipType()
              + " is not valid for scheme "
              + externalIdentifier.getIdentifierScheme());
    }
    if (!externalIdentifierDefinition.getDataType().isValidValue(externalIdentifier.getValue())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier value "
              + externalIdentifier.getValue()
              + " is not valid for scheme "
              + externalIdentifier.getIdentifierScheme());
    }
    if (externalIdentifierDefinition.getValueRegexValidation() != null
        && !externalIdentifier
            .getValue()
            .matches(externalIdentifierDefinition.getValueRegexValidation())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier value "
              + externalIdentifier.getValue()
              + " does not match the regex validation for scheme "
              + externalIdentifier.getIdentifierScheme());
    }
  }

  void validatePackageDetails(
      PackageDetails<MedicationProductDetails> packageDetails, String branch);
}
