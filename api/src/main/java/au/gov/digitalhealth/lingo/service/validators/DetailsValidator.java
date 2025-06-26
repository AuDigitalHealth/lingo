package au.gov.digitalhealth.lingo.service.validators;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.gov.digitalhealth.lingo.configuration.model.ExternalIdentifierDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningPropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ReferenceSetDefinition;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.Quantity;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DetailsValidator {

  protected static void validateNumeratorDenominatorSet(
      @Valid Quantity strengthNumerator, @Valid Quantity strengthDenominator, String typeName) {
    if (strengthNumerator == null
        || strengthNumerator.getValue() == null
        || BigDecimal.ZERO.equals(strengthNumerator.getValue())) {
      throw new ProductAtomicDataValidationProblem(
          "Medication product details must have a "
              + typeName
              + " strength numerator value greater than zero");
    }
    if (strengthNumerator.getUnit() == null) {
      throw new ProductAtomicDataValidationProblem(
          "Medication product details must have a "
              + typeName
              + " strength numerator unit defined");
    }
    if (strengthDenominator == null
        || strengthDenominator.getValue() == null
        || BigDecimal.ZERO.equals(strengthDenominator.getValue())) {
      throw new ProductAtomicDataValidationProblem(
          "Medication product details must have a "
              + typeName
              + " strength denominator value greater than zero");
    }
    if (strengthDenominator.getUnit() == null) {
      throw new ProductAtomicDataValidationProblem(
          "Medication product details must have a "
              + typeName
              + " strength denominator unit defined");
    }
  }

  protected static void validateStrengthNotPopulated(
      @Valid Quantity strengthNumerator, @Valid Quantity strengthDenominator, String strengthType) {
    if (strengthNumerator != null
        && (strengthNumerator.getValue() != null || strengthNumerator.getUnit() != null)) {
      throw new ProductAtomicDataValidationProblem(
          "Medication product details must not have a "
              + strengthType
              + " strength numerator defined when unit of presentation exists");
    }
    if (strengthDenominator != null
        && (strengthDenominator.getValue() != null || strengthDenominator.getUnit() != null)) {
      throw new ProductAtomicDataValidationProblem(
          "Medication product details must not have a "
              + strengthType
              + " strength denominator defined when unit of presentation exists");
    }
  }

  protected static void validatePopulatedConcept(SnowstormConceptMini conceptMini, String message) {
    if (DetailsValidator.isUnpopulated(conceptMini)) {
      throw new ProductAtomicDataValidationProblem(message);
    }
  }

  protected static void validateConceptNotSet(SnowstormConceptMini conceptMini, String message) {
    if (DetailsValidator.isPopulated(conceptMini)) {
      throw new ProductAtomicDataValidationProblem(message);
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

  protected static void validateQuantityNotZero(Quantity productQuantity, String message) {
    if (productQuantity.getValue() == null || BigDecimal.ZERO.equals(productQuantity.getValue())) {
      throw new ProductAtomicDataValidationProblem(message);
    }
  }

  protected void validateNonDefiningProperties(
      List<@Valid NonDefiningBase> nonDefiningProperties,
      ProductPackageType type,
      ModelConfiguration modelConfiguration) {
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
            throw new ProductAtomicDataValidationProblem(
                "External identifier scheme '"
                    + nonDefiningProperty.getIdentifierScheme()
                    + "' is not defined for "
                    + type
                    + " in model configuration");
          }
          ExternalIdentifier externalIdentifier = (ExternalIdentifier) nonDefiningProperty;
          if (!externalIdentifierDefinition
              .getDataType()
              .isValidValue(externalIdentifier.getValue(), externalIdentifier.getValueObject())) {
            throw new ProductAtomicDataValidationProblem(
                "External identifier value '"
                    + externalIdentifier.getValue()
                    + "' is not valid for scheme '"
                    + nonDefiningProperty.getIdentifierScheme()
                    + "'");
          }
        }
        case REFERENCE_SET -> {
          ReferenceSetDefinition referenceSetDefinition =
              referenceSets.get(nonDefiningProperty.getIdentifierScheme());
          if (referenceSetDefinition == null) {
            throw new ProductAtomicDataValidationProblem(
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
            throw new ProductAtomicDataValidationProblem(
                "Non-defining property scheme '"
                    + nonDefiningProperty.getIdentifierScheme()
                    + "' is not defined for "
                    + type
                    + " in model configuration");
          }
          NonDefiningProperty property = (NonDefiningProperty) nonDefiningProperty;
          if (!nonDefiningPropertyDefinition
              .getDataType()
              .isValidValue(property.getValue(), property.getValueObject())) {
            throw new ProductAtomicDataValidationProblem(
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
