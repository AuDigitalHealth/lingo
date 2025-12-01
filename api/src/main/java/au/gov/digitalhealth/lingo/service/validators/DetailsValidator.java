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

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.gov.digitalhealth.lingo.configuration.model.AdditionalFieldDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ExternalIdentifierDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningPropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ReferenceSetDefinition;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductDetails;
import au.gov.digitalhealth.lingo.product.details.ProductTemplate;
import au.gov.digitalhealth.lingo.product.details.ProductType;
import au.gov.digitalhealth.lingo.product.details.Quantity;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.details.properties.FieldValue;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import au.gov.digitalhealth.lingo.service.SnowstormClient;
import au.gov.digitalhealth.lingo.service.fhir.FhirClient;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import reactor.core.publisher.Mono;

@Log
public abstract class DetailsValidator {

  protected abstract Set<ProductType> getSupportedProductTypes();

  protected abstract Set<ProductTemplate> getSupportedProductTemplates();

  protected static void validateNumeratorDenominatorSet(
      @Valid Quantity strengthNumerator,
      @Valid Quantity strengthDenominator,
      String typeName,
      String objectName,
      String message,
      ValidationResult result) {
    if (strengthNumerator == null
        || strengthNumerator.getValue() == null
        || BigDecimal.ZERO.equals(strengthNumerator.getValue())) {
      result.addProblem(
          objectName
              + " must have a "
              + typeName
              + " strength numerator value greater than zero when "
              + message);
    }
    if (strengthNumerator.getUnit() == null) {
      result.addProblem(
          objectName
              + " must have a "
              + typeName
              + " strength numerator unit defined when "
              + message);
    }
    if (strengthDenominator == null
        || strengthDenominator.getValue() == null
        || BigDecimal.ZERO.equals(strengthDenominator.getValue())) {
      result.addProblem(
          objectName
              + " must have a "
              + typeName
              + " strength denominator value greater than zero when "
              + message);
    }
    if (strengthDenominator == null || strengthDenominator.getUnit() == null) {
      result.addProblem(
          objectName
              + " must have a "
              + typeName
              + " strength denominator unit defined when "
              + message);
    }
  }

  protected static void validateStrengthNotPopulated(
      @Valid Quantity strengthNumerator,
      @Valid Quantity strengthDenominator,
      String strengthType,
      String objectName,
      String message,
      ValidationResult result) {
    if (strengthNumerator != null
        && (strengthNumerator.getValue() != null || strengthNumerator.getUnit() != null)) {
      result.addProblem(
          objectName
              + " must not have a "
              + strengthType
              + " strength numerator defined "
              + message);
    }
    if (strengthDenominator != null
        && (strengthDenominator.getValue() != null || strengthDenominator.getUnit() != null)) {
      result.addProblem(
          objectName
              + " must not have a "
              + strengthType
              + " strength denominator defined "
              + message);
    }
  }

  protected static void validatePopulatedConcept(
      SnowstormConceptMini conceptMini, String message, ValidationResult result) {
    if (DetailsValidator.isUnpopulated(conceptMini)) {
      result.addProblem(message);
    }
  }

  protected static void validateConceptNotSet(
      SnowstormConceptMini conceptMini, String message, ValidationResult result) {
    if (DetailsValidator.isPopulated(conceptMini)) {
      result.addProblem(message);
    }
  }

  protected static boolean isPopulated(SnowstormConceptMini conceptMini) {
    return !DetailsValidator.isUnpopulated(conceptMini);
  }

  protected static boolean isUnpopulated(SnowstormConceptMini conceptMini) {
    return conceptMini == null
        || conceptMini.getConceptId() == null
        || conceptMini.getConceptId().isEmpty()
        || conceptMini.getPt() == null
        || conceptMini.getPt().getTerm() == null
        || conceptMini.getPt().getTerm().isEmpty()
        || conceptMini.getFsn() == null
        || conceptMini.getFsn().getTerm() == null
        || conceptMini.getFsn().getTerm().isEmpty();
  }

  protected static void validateQuantityNotZero(
      Quantity productQuantity, String message, ValidationResult result) {
    if (productQuantity == null
        || productQuantity.getValue() == null
        || BigDecimal.ZERO.equals(productQuantity.getValue())) {
      result.addProblem(message);
    }
  }

  protected void validateNonDefiningProperties(
      SnowstormClient snowstormClient,
      FhirClient fhirClient,
      String branch,
      List<@Valid NonDefiningBase> nonDefiningProperties,
      ProductPackageType type,
      ModelConfiguration modelConfiguration,
      ValidationResult result) {
    Collection<ModelLevel> levels =
        type == ProductPackageType.PACKAGE
            ? modelConfiguration.getPackageLevels()
            : modelConfiguration.getProductLevels();
    Map<String, ExternalIdentifierDefinition> externalIdentifiers = new HashMap<>();
    levels.forEach(
        level ->
            externalIdentifiers.putAll(modelConfiguration.getMappingsBySchemeForModelLevel(level)));
    Map<String, ReferenceSetDefinition> referenceSets = new HashMap<>();
    levels.forEach(
        level ->
            referenceSets.putAll(modelConfiguration.getReferenceSetsBySchemeForModelLevel(level)));
    Map<String, NonDefiningPropertyDefinition> nonDefiningPropertiesMap = new HashMap<>();
    levels.forEach(
        level ->
            nonDefiningPropertiesMap.putAll(
                modelConfiguration.getNonDefiningPropertiesBySchemeForModelLevel(level)));

    for (NonDefiningBase nonDefiningProperty : nonDefiningProperties) {
      switch (nonDefiningProperty.getType()) {
        case EXTERNAL_IDENTIFIER -> {
          ExternalIdentifierDefinition externalIdentifierDefinition =
              externalIdentifiers.get(nonDefiningProperty.getIdentifierScheme());
          if (externalIdentifierDefinition == null) {
            result.addProblem(
                "External identifier scheme '"
                    + nonDefiningProperty.getIdentifierScheme()
                    + "' is not defined for "
                    + type
                    + " in model configuration");
          } else {
            ExternalIdentifier externalIdentifier = (ExternalIdentifier) nonDefiningProperty;
            if (!externalIdentifierDefinition
                .getDataType()
                .isValidValue(externalIdentifier.getValue(), externalIdentifier.getValueObject())) {
              result.addProblem(
                  "External identifier value '"
                      + externalIdentifier.getValue()
                      + "' is not valid for scheme '"
                      + nonDefiningProperty.getIdentifierScheme()
                      + "'");
            } else if (externalIdentifierDefinition.getCodeSystem() != null) {
              // structurally valid external identifier, does it exist?
              if (externalIdentifierDefinition.getCodeSystem().equals("http://snomed.info/sct")
                  && snowstormClient.getConcept(branch, externalIdentifier.getValue()) == null) {
                result.addProblem(
                    "External identifier value '"
                        + externalIdentifier.getValue()
                        + "' does not exist in "
                        + branch);
              } else {
                fhirClient
                    .getConcept(
                        externalIdentifier.getValueObject().getConceptId(),
                        externalIdentifierDefinition.getCodeSystem())
                    .onErrorResume(
                        error -> {
                          result.addProblem(
                              "External identifier value '"
                                  + externalIdentifier.getValueObject().getConceptId()
                                  + "' does not exist in FHIR server for code system '"
                                  + externalIdentifierDefinition.getCodeSystem() + "'");
                          return Mono.empty();
                        })
                    .block();
              }
            }

            if (externalIdentifier.isAdditionalFieldMismatch(externalIdentifierDefinition)) {
              result.addProblem(
                  "External identifier '"
                      + (externalIdentifier.getValue() != null
                          ? externalIdentifier.getValue()
                          : externalIdentifier.getValueObject().getIdAndFsnTerm())
                      + "' additional fields do not match the definition for scheme '"
                      + nonDefiningProperty.getIdentifierScheme()
                      + "'. Expected: "
                      + String.join(
                          ", ", externalIdentifierDefinition.getAdditionalFields().keySet())
                      + " but found: "
                      + String.join(
                          ", ",
                          externalIdentifier.getAdditionalFields() == null
                              ? Set.of()
                              : externalIdentifier.getAdditionalFields().keySet()));
            } else if (!externalIdentifierDefinition.getAdditionalFields().isEmpty()
                && externalIdentifier.getAdditionalFields() != null
                && !externalIdentifier.getAdditionalFields().isEmpty()) {
              for (String additionalField :
                  externalIdentifierDefinition.getAdditionalFields().keySet()) {
                if (externalIdentifier.getAdditionalFields() == null
                    || !externalIdentifier.getAdditionalFields().containsKey(additionalField)) {
                  result.addProblem(
                      "Required external identifier additional field '"
                          + additionalField
                          + "' is not defined for scheme '"
                          + nonDefiningProperty.getIdentifierScheme()
                          + "'");
                }
                AdditionalFieldDefinition additionalFieldDefinition =
                    externalIdentifierDefinition.getAdditionalFields().get(additionalField);
                final FieldValue fieldValue =
                    externalIdentifier.getAdditionalFields().get(additionalField);
                if (!additionalFieldDefinition
                    .getDataType()
                    .isValidValue(fieldValue.getValue(), fieldValue.getValueObject())) {
                  result.addProblem(
                      "External identifier additional field '"
                          + additionalField
                          + "' value '"
                          + fieldValue.getValue()
                          + "' is not valid for the datatype for the scheme '"
                          + nonDefiningProperty.getIdentifierScheme()
                          + "'");
                }

                if (!additionalFieldDefinition.getAllowedValues().isEmpty()
                    && !additionalFieldDefinition
                        .getAllowedValues()
                        .contains(fieldValue.getValue())) {
                  result.addProblem(
                      "External identifier additional field '"
                          + additionalField
                          + "' value '"
                          + fieldValue.getValue()
                          + "' is not valid for the allowed values "
                          + String.join(", ", additionalFieldDefinition.getAllowedValues())
                          + " for scheme '"
                          + nonDefiningProperty.getIdentifierScheme()
                          + "'");
                }
              }
            }
          }
        }
        case REFERENCE_SET -> {
          ReferenceSetDefinition referenceSetDefinition =
              referenceSets.get(nonDefiningProperty.getIdentifierScheme());
          if (referenceSetDefinition == null) {
            result.addProblem(
                "Reference set scheme '"
                    + nonDefiningProperty.getIdentifierScheme()
                    + "' is not defined for "
                    + type
                    + " in model configuration");
          }
        }
        case NON_DEFINING_PROPERTY -> {
          NonDefiningPropertyDefinition nonDefiningPropertyDefinition =
              nonDefiningPropertiesMap.get(nonDefiningProperty.getIdentifierScheme());
          if (nonDefiningPropertyDefinition == null) {
            result.addProblem(
                "Non-defining property scheme '"
                    + nonDefiningProperty.getIdentifierScheme()
                    + "' is not defined for "
                    + type
                    + " in model configuration");
          } else {
            NonDefiningProperty property = (NonDefiningProperty) nonDefiningProperty;
            if (!nonDefiningPropertyDefinition
                .getDataType()
                .isValidValue(property.getValue(), property.getValueObject())) {
              result.addProblem(
                  "Non-defining property value '"
                      + property.getValue()
                      + "' is not valid for scheme '"
                      + nonDefiningProperty.getIdentifierScheme()
                      + "'");
            }
          }
        }
      }
    }
  }

  protected <T extends ProductDetails> void validateTypeParameters(
      PackageDetails<T> packageDetails, ValidationResult result) {

    Set<ProductType> supportedProductTypes = getSupportedProductTypes();
    final String supportedProductTypeDisplayList =
        String.join(
            ", ",
            supportedProductTypes.stream().map(ProductType::toString).collect(Collectors.toSet()));
    if (!supportedProductTypes.isEmpty()
        && !supportedProductTypes.contains(packageDetails.getVariant())) {
      result.addProblem(
          "Package variant '"
              + packageDetails.getVariant()
              + "' does not match supported variants: "
              + supportedProductTypeDisplayList);
    }
    Set<ProductTemplate> supportedProductTemplates = getSupportedProductTemplates();
    final String supportedProductTemplateDisplayList =
        String.join(
            ", ",
            supportedProductTemplates.stream()
                .map(ProductTemplate::toString)
                .collect(Collectors.toSet()));
    packageDetails
        .getContainedPackages()
        .forEach(
            p -> {
              validateTypeParameters(p.getPackageDetails(), result);
            });
    packageDetails
        .getContainedProducts()
        .forEach(
            p -> {
              if (supportedProductTemplates.isEmpty()
                  && p.getProductDetails().getProductType() != null) {
                result.addProblem(
                    "Product type '"
                        + p.getProductDetails().getProductType()
                        + "' not supported for package variant '"
                        + supportedProductTypeDisplayList
                        + "', supported types are: "
                        + supportedProductTemplateDisplayList);
              } else if (p.getProductDetails().getProductType() == null
                  && !supportedProductTemplates.isEmpty()) {
                result.addProblem(
                    "Product type must be populated for package variant '"
                        + supportedProductTypeDisplayList
                        + "', supported types are: "
                        + supportedProductTemplateDisplayList);
              } else if (p.getProductDetails().getProductType() != null
                  && !supportedProductTemplates.contains(p.getProductDetails().getProductType())) {
                result.addProblem(
                    "Product type '"
                        + p.getProductDetails().getProductType()
                        + "' not supported for package variant '"
                        + supportedProductTypeDisplayList
                        + "', supported types are: "
                        + supportedProductTemplateDisplayList);
              }
            });
  }
}
