package au.gov.digitalhealth.lingo.service.validators;

import static au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType.PACKAGE;
import static au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType.PRODUCT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.UNIT_MG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.UNIT_ML;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.UNIT_OF_PRESENTATION;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getIdAndFsnTerm;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ExternalIdentifierDefinition;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.Ingredient;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.PackageQuantity;
import au.gov.digitalhealth.lingo.product.details.ProductQuantity;
import au.gov.digitalhealth.lingo.product.details.Quantity;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.service.SnowstormClient;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import au.gov.digitalhealth.lingo.util.ValidationUtil;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;

@Service("AMT-MedicationDetailsValidator")
@Log
public class AmtMedicationDetailsValidator implements MedicationDetailsValidator {
  Models models;
  SnowstormClient snowstormClient;
  FieldBindingConfiguration fieldBindingConfiguration;

  public AmtMedicationDetailsValidator(
      Models models,
      SnowstormClient snowstormClient,
      FieldBindingConfiguration fieldBindingConfiguration) {
    this.models = models;
    this.snowstormClient = snowstormClient;
    this.fieldBindingConfiguration = fieldBindingConfiguration;
  }

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

  public static BigDecimal calculateConcentrationStrength(
      BigDecimal totalQty, BigDecimal productSize) {
    BigDecimal result =
        totalQty
            .divide(productSize, new MathContext(10, RoundingMode.HALF_UP))
            .stripTrailingZeros();

    // Check if the decimal part is greater than 0.999
    if ((result.remainder(BigDecimal.ONE).compareTo(new BigDecimal("0.999")) >= 0
            && isWithinRoundingPercentage(result, 0, "0.01"))
        || result.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) == 0) {

      // Round to a whole number
      result = result.setScale(0, RoundingMode.HALF_UP).stripTrailingZeros();
    } else {
      BigDecimal rounded = result.setScale(6, RoundingMode.HALF_UP).stripTrailingZeros();

      if (isWithinRoundingPercentage(result, 6, "0.01")) {
        result = rounded;
      } else {
        throw new ProductAtomicDataValidationProblem(
            "Result of "
                + totalQty
                + "/"
                + productSize
                + " = "
                + result
                + " which cannot be rounded to 6 decimal places within 1%.");
      }
    }

    return result;
  }

  private static boolean isWithinRoundingPercentage(
      BigDecimal result, int newScale, String percentage) {
    BigDecimal rounded = result.setScale(newScale, RoundingMode.HALF_UP);
    BigDecimal changePercentage =
        rounded.subtract(result).abs().divide(result, 10, RoundingMode.HALF_UP);

    return changePercentage.compareTo(new BigDecimal(percentage)) <= 0;
  }

  private void validatePackageQuantity(PackageQuantity<MedicationProductDetails> packageQuantity) {
    // Leave the MRCM validation to the MRCM - the UI should already enforce this and the validation
    // in the MS will catch it. Validating here will just slow things down.

    // -- package quantity unit must be each and the quantitiy must be an integer
    ValidationUtil.validateQuantityValueIsOneIfUnitIsEach(packageQuantity);

    // validate that the package is only nested one deep
    if (packageQuantity.getPackageDetails().getContainedPackages() != null
        && !packageQuantity.getPackageDetails().getContainedPackages().isEmpty()) {
      throw new ProductAtomicDataValidationProblem(
          "A contained package must not contain further packages - nesting is only one level deep");
    }
  }

  private void validateProductDetails(MedicationProductDetails productDetails, String branch) {
    boolean genericFormPopulated = productDetails.getGenericForm() != null;
    boolean specificFormPopulated = productDetails.getSpecificForm() != null;
    boolean containerTypePopulated = productDetails.getContainerType() != null;
    boolean deviceTypePopulated = productDetails.getDeviceType() != null;

    // one of form, container or device must be populated
    if (!genericFormPopulated && !containerTypePopulated && !deviceTypePopulated) {
      throw new ProductAtomicDataValidationProblem(
          "One of form, container type or device type must be populated");
    }

    // specific dose form can only be populated if generic dose form is populated
    if (specificFormPopulated && !genericFormPopulated) {
      throw new ProductAtomicDataValidationProblem(
          "Specific form can only be populated if generic form is populated");
    }

    // If Container is populated, Form must be populated
    if (containerTypePopulated && !genericFormPopulated) {
      throw new ProductAtomicDataValidationProblem(
          "If container type is populated, form must be populated");
    }

    // If Form is populated, Device must not be populated
    if (genericFormPopulated && deviceTypePopulated) {
      throw new ProductAtomicDataValidationProblem(
          "If form is populated, device type must not be populated");
    }

    // If Device is populated, Form and Container must not be populated - already tested above

    // product name must be populated
    if (productDetails.getProductName() == null) {
      throw new ProductAtomicDataValidationProblem("Product name must be populated");
    }

    validateExternalIdentifiers(
        branch, PRODUCT, ExternalIdentifier.filter(productDetails.getNonDefiningProperties()));

    productDetails.getActiveIngredients().forEach(this::validateIngredient);
  }

  private void validateExternalIdentifiers(
      String branch,
      ProductPackageType product,
      Collection<@Valid ExternalIdentifier> externalIdentifiers) {
    Set<ExternalIdentifierDefinition> mandatoryExternalIdentifierDefinitions =
        models.getModelConfiguration(branch).getMappings().stream()
            .filter(ExternalIdentifierDefinition::isMandatory)
            .filter(mr -> mr.getLevel().equals(product))
            .collect(Collectors.toSet());

    // validate the external identifiers
    if (externalIdentifiers != null) {
      Map<String, ExternalIdentifierDefinition> mappingRefsets =
          models.getModelConfiguration(branch).getMappings().stream()
              .filter(mr -> mr.getLevel().equals(product))
              .collect(
                  Collectors.toMap(
                      ExternalIdentifierDefinition::getName,
                      Function.identity(),
                      (existing, replacement) -> {
                        throw new IllegalStateException(
                            "Duplicate key found for " + existing.getName());
                      }));

      Set<String> populatedSchemes =
          externalIdentifiers.stream()
              .map(ExternalIdentifier::getIdentifierScheme)
              .collect(Collectors.toSet());

      if (!populatedSchemes.containsAll(
          mandatoryExternalIdentifierDefinitions.stream()
              .map(ExternalIdentifierDefinition::getName)
              .collect(Collectors.toSet()))) {
        throw new ProductAtomicDataValidationProblem(
            "External identifiers for schemes "
                + mandatoryExternalIdentifierDefinitions.stream()
                    .map(ExternalIdentifierDefinition::getName)
                    .collect(Collectors.joining(", "))
                + " must be populated for this product");
      }

      externalIdentifiers.stream()
          .collect(Collectors.toMap(ExternalIdentifier::getIdentifierScheme, e -> 1, Integer::sum))
          .forEach(
              (key, value) -> {
                ExternalIdentifierDefinition refset = mappingRefsets.get(key);

                if (refset == null) {
                  throw new ProductAtomicDataValidationProblem(
                      "External identifier scheme " + key + " is not valid for this product");
                } else if (!refset.isMultiValued() && value > 1) {
                  throw new ProductAtomicDataValidationProblem(
                      "External identifier scheme " + key + " is not multi-valued");
                }
              });

      for (ExternalIdentifier externalIdentifier : externalIdentifiers) {
        validateExternalIdentifier(externalIdentifier, mappingRefsets);
      }
    } else if (!mandatoryExternalIdentifierDefinitions.isEmpty()) {
      throw new ProductAtomicDataValidationProblem(
          "External identifiers for schemes "
              + mandatoryExternalIdentifierDefinitions.stream()
                  .map(ExternalIdentifierDefinition::getTitle)
                  .collect(Collectors.joining(", "))
              + " must be populated for this product");
    }
  }

  private void validateIngredient(Ingredient ingredient) {
    boolean activeIngredientPopulated = ingredient.getActiveIngredient() != null;
    boolean preciseIngredientPopulated = ingredient.getPreciseIngredient() != null;
    boolean bossPopulated = ingredient.getBasisOfStrengthSubstance() != null;

    // BoSS is only populated if the active ingredient is populated
    if (!activeIngredientPopulated && bossPopulated) {
      throw new ProductAtomicDataValidationProblem(
          "Basis of strength substance can only be populated if active ingredient is populated");
    }

    // precise ingredient is only populated if active ingredient is populated
    if (!activeIngredientPopulated && preciseIngredientPopulated) {
      throw new ProductAtomicDataValidationProblem(
          "Precise ingredient can only be populated if active ingredient is populated");
    }

    // if BoSS is populated then total quantity or concentration strength must be populated
    boolean totalQuantityPopulated = ingredient.getTotalQuantity() != null;
    boolean concentrationStrengthPopulated = ingredient.getConcentrationStrength() != null;
    if (bossPopulated && !totalQuantityPopulated && !concentrationStrengthPopulated) {
      throw new ProductAtomicDataValidationProblem(
          "Basis of strength substance is populated but neither total quantity or concentration strength are populated");
    }

    // active ingredient is mandatory
    if (!activeIngredientPopulated) {
      throw new ProductAtomicDataValidationProblem("Active ingredient must be populated");
    }
  }

  public void validatePackageDetails(
      PackageDetails<MedicationProductDetails> packageDetails, String branch) {
    // Leave the MRCM validation to the MRCM - the UI should already enforce this and the validation
    // in the MS will catch it. Validating here will just slow things down.

    // validate the package details
    // - product name is a product name - MRCM?
    // - container type is a container type - MRCM?

    // product name must be populated
    if (packageDetails.getProductName() == null) {
      throw new ProductAtomicDataValidationProblem("Product name must be populated");
    }

    // container type is mandatory
    if (packageDetails.getContainerType() == null) {
      throw new ProductAtomicDataValidationProblem("Container type must be populated");
    }

    // if the package contains other packages it must use a unit of each for the contained packages
    if (packageDetails.getContainedPackages() != null
        && !packageDetails.getContainedPackages().isEmpty()
        && !packageDetails.getContainedPackages().stream()
            .allMatch(p -> p.getUnit().getConceptId().equals(UNIT_OF_PRESENTATION.getValue()))) {
      throw new ProductAtomicDataValidationProblem(
          "If the package contains other packages it must use a unit of 'each' for the contained packages");
    }

    // if the package contains other packages it must have a container type of "Pack"
    if (packageDetails.getContainedPackages() != null
        && !packageDetails.getContainedPackages().isEmpty()
        && !packageDetails
            .getContainerType()
            .getConceptId()
            .equals(SnomedConstants.PACK.getValue())) {
      throw new ProductAtomicDataValidationProblem(
          "If the package contains other packages it must have a container type of 'Pack'");
    }

    validateExternalIdentifiers(
        branch, PACKAGE, ExternalIdentifier.filter(packageDetails.getNonDefiningProperties()));

    for (ProductQuantity<MedicationProductDetails> productQuantity :
        packageDetails.getContainedProducts()) {
      validateProductQuantity(branch, productQuantity);
    }

    for (@Valid
    PackageQuantity<MedicationProductDetails> packageQuantity :
        packageDetails.getContainedPackages()) {
      validatePackageQuantity(packageQuantity);
    }
  }

  private void validateProductQuantity(
      String branch, ProductQuantity<MedicationProductDetails> productQuantity) {
    // Leave the MRCM validation to the MRCM - the UI should already enforce this and the validation
    // in the MS will catch it. Validating here will just slow things down.
    ValidationUtil.validateQuantityValueIsOneIfUnitIsEach(productQuantity);

    // if the contained product has a container/device type or a quantity then the unit must be
    // each and the quantity must be an integer
    MedicationProductDetails productDetails = productQuantity.getProductDetails();
    Quantity productDetailsQuantity = productDetails.getQuantity();
    if ((productDetails.getContainerType() != null
            || productDetails.getDeviceType() != null
            || productDetailsQuantity != null)
        && (!productQuantity.getUnit().getConceptId().equals(UNIT_OF_PRESENTATION.getValue())
            || !ValidationUtil.isIntegerValue(productQuantity.getValue()))) {
      throw new ProductAtomicDataValidationProblem(
          "Product quantity must be a positive whole number and unit each if a container type or device type are specified");
    }

    validateProductDetails(productDetails, branch);

    // -- for each ingredient
    // --- total quantity unit if present must not be composite
    // --- concentration strength if present must be composite unit
    for (Ingredient ingredient : productDetails.getActiveIngredients()) {
      boolean hasProductQuantity = productDetailsQuantity != null;
      boolean hasProductQuantityWithUnit =
          hasProductQuantity && productDetailsQuantity.getUnit() != null;
      boolean hasTotalQuantity = ingredient.getTotalQuantity() != null;
      boolean hasConcentrationStrength = ingredient.getConcentrationStrength() != null;
      if (hasTotalQuantity
          && snowstormClient.isCompositeUnit(branch, ingredient.getTotalQuantity().getUnit())) {
        throw new ProductAtomicDataValidationProblem(
            "Total quantity unit must not be composite. Ingredient was "
                + getIdAndFsnTerm(ingredient.getActiveIngredient())
                + " with unit "
                + getIdAndFsnTerm(ingredient.getTotalQuantity().getUnit()));
      }

      if (hasConcentrationStrength
          && !snowstormClient.isCompositeUnit(
              branch, ingredient.getConcentrationStrength().getUnit())) {
        throw new ProductAtomicDataValidationProblem(
            "Concentration strength unit must be composite. Ingredient was "
                + getIdAndFsnTerm(ingredient.getActiveIngredient())
                + " with unit "
                + getIdAndFsnTerm(ingredient.getConcentrationStrength().getUnit()));
      }

      // Total quantity and concentration strength must be present if the product quantity exists,
      // except under the following special conditions for legacy products:
      //  - either the product size unit is not in mg or ml,
      //  - or the concentration unit denominator does not match the product size unit,
      //  - or the ingredient is inert/excluded and therefore doesn't have a strength
      if (hasProductQuantityWithUnit && !(hasTotalQuantity && hasConcentrationStrength)) {
        boolean isUnitML =
            UNIT_ML.getValue().equals(productDetailsQuantity.getUnit().getConceptId());
        boolean isUnitMG =
            UNIT_MG.getValue().equals(productDetailsQuantity.getUnit().getConceptId());
        boolean isStrengthUnitMismatch =
            hasConcentrationStrength
                && ingredient.getConcentrationStrength().getUnit() != null
                && !isStrengthDenominatorMatchesQuantityUnit(
                    ingredient, productDetailsQuantity, branch);

        if (!isUnitML && !isUnitMG) {
          // Log a warning if the product quantity unit is not mg or mL
          log.warning(
              "Handling anomalous products, Product quantity unit is not mg or mL: "
                  + getIdAndFsnTerm(productDetailsQuantity.getUnit()));
        } else if (isStrengthUnitMismatch) {
          // Log a warning if the product quantity unit does not match the strength unit denominator
          log.warning(
              "Handling anomalous products, Product quantity unit does not match the strength unit denominator for ingredient: "
                  + getIdAndFsnTerm(ingredient.getActiveIngredient()));
        } else if (!fieldBindingConfiguration
            .getExcludedSubstances()
            .contains(ingredient.getActiveIngredient().getConceptId())) {
          // Invalid scenario user needs to provide the missing fields
          String missingFieldsMessage;
          if (!hasTotalQuantity && !hasConcentrationStrength) {
            missingFieldsMessage = "total quantity and concentration strength are not specified";
          } else if (!hasTotalQuantity) {
            missingFieldsMessage = "total quantity is not specified";
          } else {
            missingFieldsMessage = "concentration strength is not specified";
          }

          throw new ProductAtomicDataValidationProblem(
              String.format(
                  "Total quantity and concentration strength must be present if the product quantity exists for ingredient %s but %s",
                  getIdAndFsnTerm(ingredient.getActiveIngredient()), missingFieldsMessage));
        }

      } else if ((!hasProductQuantity || !hasProductQuantityWithUnit)
          && hasTotalQuantity
          && hasConcentrationStrength) {
        throw new ProductAtomicDataValidationProblem(
            "Total ingredient quantity and concentration strength specified for ingredient "
                + getIdAndFsnTerm(ingredient.getActiveIngredient())
                + " but product quantity not specified. "
                + "0, 1, or all 3 of these properties must be populated, populating 2 is not valid.");
      }

      // if pack size and concentration strength are populated
      if (hasProductQuantityWithUnit && hasConcentrationStrength) {
        // validate that the units line up
        Pair<SnowstormConceptMini, SnowstormConceptMini> numeratorAndDenominator =
            snowstormClient.getNumeratorAndDenominatorUnit(
                branch, ingredient.getConcentrationStrength().getUnit().getConceptId());

        // validate the product quantity unit matches the denominator of the concentration strength
        if (!productDetailsQuantity
            .getUnit()
            .getConceptId()
            .equals(numeratorAndDenominator.getSecond().getConceptId())) {
          log.warning(
              "Product quantity unit "
                  + getIdAndFsnTerm(productDetailsQuantity.getUnit())
                  + " does not match ingredient "
                  + getIdAndFsnTerm(ingredient.getActiveIngredient())
                  + " concetration strength denominator "
                  + getIdAndFsnTerm(numeratorAndDenominator.getSecond())
                  + " as expected");
        }

        // if the total quantity is also populated
        if (hasTotalQuantity) {
          // validate that the total quantity unit matches the numerator of the concentration
          // strength
          if (!ingredient
              .getTotalQuantity()
              .getUnit()
              .getConceptId()
              .equals(numeratorAndDenominator.getFirst().getConceptId())) {
            log.warning(
                "Ingredient "
                    + getIdAndFsnTerm(ingredient.getActiveIngredient())
                    + " total quantity unit "
                    + getIdAndFsnTerm(ingredient.getTotalQuantity().getUnit())
                    + " does not match the concetration strength numerator "
                    + getIdAndFsnTerm(numeratorAndDenominator.getFirst())
                    + " as expected");
          }

          // validate that the values calculate out correctly
          BigDecimal totalQuantity = ingredient.getTotalQuantity().getValue();
          BigDecimal concentration = ingredient.getConcentrationStrength().getValue();
          BigDecimal quantity = productDetailsQuantity.getValue();

          BigDecimal calculatedConcentrationStrength =
              calculateConcentrationStrength(totalQuantity, quantity);

          if (!concentration.stripTrailingZeros().equals(calculatedConcentrationStrength)) {
            throw new ProductAtomicDataValidationProblem(
                "Concentration strength "
                    + concentration
                    + " for ingredient "
                    + getIdAndFsnTerm(ingredient.getActiveIngredient())
                    + " does not match calculated value "
                    + calculatedConcentrationStrength
                    + " from the provided total quantity and product quantity");
          }
        }
      }
    }
  }

  private boolean isStrengthDenominatorMatchesQuantityUnit(
      Ingredient ingredient, Quantity productDetailsQuantity, String branch) {
    Pair<SnowstormConceptMini, SnowstormConceptMini> numeratorAndDenominator =
        snowstormClient.getNumeratorAndDenominatorUnit(
            branch, ingredient.getConcentrationStrength().getUnit().getConceptId());

    // validate the product quantity unit matches the denominator of the concentration strength
    return productDetailsQuantity
        .getUnit()
        .getConceptId()
        .equals(numeratorAndDenominator.getSecond().getConceptId());
  }
}
