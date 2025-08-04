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

import static au.gov.digitalhealth.lingo.util.SnomedConstants.UNIT_OF_PRESENTATION;

import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import au.gov.digitalhealth.lingo.product.details.Ingredient;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.NutritionalProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductQuantity;
import au.gov.digitalhealth.lingo.product.details.ProductTemplate;
import au.gov.digitalhealth.lingo.product.details.Quantity;
import au.gov.digitalhealth.lingo.product.details.VaccineProductDetails;
import au.gov.digitalhealth.lingo.service.SnowstormClient;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Set;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;

@Service("NMPC-MedicationDetailsValidator")
@Log
public class NmpcMedicationDetailsValidator extends DetailsValidator
    implements MedicationDetailsValidator {
  Models models;
  SnowstormClient snowstormClient;
  FieldBindingConfiguration fieldBindingConfiguration;

  public NmpcMedicationDetailsValidator(
      Models models,
      SnowstormClient snowstormClient,
      FieldBindingConfiguration fieldBindingConfiguration) {
    this.models = models;
    this.snowstormClient = snowstormClient;
    this.fieldBindingConfiguration = fieldBindingConfiguration;
  }

  private static void validateQuantityPopulated(
      Quantity productDetails, String quantityName, ValidationResult result) {
    validatePopulatedConcept(
        productDetails.getUnit(), quantityName + " must have a unit defined", result);
    validateQuantityNotZero(
        productDetails, quantityName + " must have a value greater than zero", result);
  }

  @Override
  public ValidationResult validatePackageDetails(
      PackageDetails<MedicationProductDetails> packageDetails, String branch) {
    ValidationResult result = new ValidationResult();

    validateTypeParameters(packageDetails, result);

    validateNonDefiningProperties(
        packageDetails.getNonDefiningProperties(),
        ProductPackageType.PACKAGE,
        models.getModelConfiguration(branch),
        result);

    if (!packageDetails.getContainedPackages().isEmpty()) {
      result.addProblem("Packages cannot contain other packages");
    }
    if (packageDetails.getContainedProducts().isEmpty()) {
      result.addProblem("Packages must contain at least one product");
    }
    validateConceptNotSet(
        packageDetails.getContainerType(), "Packages cannot have a container type defined", result);
    validateConceptNotSet(
        packageDetails.getProductName(), "Packages cannot have a product name defined", result);

    for (ProductQuantity<MedicationProductDetails> productQuantity :
        packageDetails.getContainedProducts()) {
      validateQuantityPopulated(productQuantity, "Product quantity", result);
      if (UNIT_OF_PRESENTATION.getValue().equals(productQuantity.getUnit().getConceptId())
          && !productQuantity.getValue().equals(BigDecimal.ONE)) {
        result.addProblem("Product quantity must be one if unit is 'unit of presentation'");
      }
      validateProductDetails(productQuantity.getProductDetails(), branch, result);
    }

    return result;
  }

  private void validateProductDetails(
      @NotNull @Valid MedicationProductDetails productDetails,
      String branch,
      ValidationResult result) {
    // validate non-defining properties
    validateNonDefiningProperties(
        productDetails.getNonDefiningProperties(),
        ProductPackageType.PRODUCT,
        models.getModelConfiguration(branch),
        result);

    //  container type and device type must not be populated.
    validateConceptNotSet(
        productDetails.getContainerType(), "Product cannot have a container type defined", result);
    validateConceptNotSet(
        productDetails.getDeviceType(), "Product cannot have a device type defined", result);
    // Generic form must be populated.
    validatePopulatedConcept(
        productDetails.getGenericForm(), "Product must have a generic form defined", result);
    // Specific form can only be set if generic form is set.
    if (isPopulated(productDetails.getSpecificForm())
        && isUnpopulated(productDetails.getGenericForm())) {
      result.addProblem("Product cannot have a specific form defined without a generic form");
    }
    // Product name must be populated.
    validatePopulatedConcept(
        productDetails.getProductName(),
        "Product must have a product name (brand) defined",
        result);
    // if quantity is set, it must have a unit and a value greater than zero.
    if (productDetails.getQuantity() != null) {
      validateQuantityPopulated(productDetails.getQuantity(), "Product quantity", result);
    }

    final boolean nutritionalProduct = productDetails instanceof NutritionalProductDetails;

    if (productDetails instanceof NutritionalProductDetails nutritionalProductDetails) {
      validatePopulatedConcept(
          productDetails.getExistingMedicinalProduct(),
          "Nutritional product must have an existing medicinal product defined",
          result);
      if (nutritionalProductDetails.getNewGenericProductName() == null
          || nutritionalProductDetails.getNewGenericProductName().isBlank()) {
        validatePopulatedConcept(
            productDetails.getExistingClinicalDrug(),
            "Either existing clinical drug or new generic product name must be set for nutritional products",
            result);
      }
    } else {
      validateConceptNotSet(
          productDetails.getExistingMedicinalProduct(),
          "Only nutritional products can have an existing medicinal product defined",
          result);
      validateConceptNotSet(
          productDetails.getExistingClinicalDrug(),
          "Only nutritional products can have an existing clinical drug defined",
          result);
    }

    final boolean unitOfPresentationExists = productDetails.getUnitOfPresentation() != null;
    final boolean unitOfPresentationQuantityExists =
        productDetails.getQuantity() != null
            && productDetails.getQuantity().getValue() != null
            && productDetails.getQuantity().getUnit() != null;

    if (unitOfPresentationQuantityExists) {
      validateQuantityPopulated(
          productDetails.getQuantity(), "unit of presentation quantity", result);
    }

    for (Ingredient ingredient : productDetails.getActiveIngredients()) {

      final boolean vaccine = productDetails instanceof VaccineProductDetails;

      validateIngredient(
          branch,
          ingredient,
          unitOfPresentationExists,
          unitOfPresentationQuantityExists,
          nutritionalProduct,
          vaccine,
          result);
    }
  }

  private void validateIngredient(
      String branch,
      Ingredient ingredient,
      boolean unitOfPresentationExists,
      boolean unitOfPresentationQuantityExists,
      boolean nutritionalProduct,
      boolean vaccine,
      ValidationResult result) {

    if (nutritionalProduct) {
      validateConceptNotSet(
          ingredient.getActiveIngredient(),
          "Nutritional supplements cannot have active ingredients defined",
          result);
      validateConceptNotSet(
          ingredient.getRefinedActiveIngredient(),
          "Nutritional supplements cannot have refined ingredients defined",
          result);
      validateConceptNotSet(
          ingredient.getPreciseIngredient(),
          "Nutritional supplements cannot have precise ingredients",
          result);
      validateConceptNotSet(
          ingredient.getBasisOfStrengthSubstance(),
          "Nutritional supplements cannot have BoSS ingredients defined",
          result);
    } else {
      // active ingredient must not be null.
      validatePopulatedConcept(
          ingredient.getActiveIngredient(),
          "Product must have an active ingredient defined",
          result);

      // if one of the concentration strength numerator or presentation strength numerator is set
      // BoSS must be set.
      if ((ingredient.getConcentrationStrengthNumerator() != null
              && ingredient.getConcentrationStrengthNumerator().getValue() != null)
          || (ingredient.getPresentationStrengthNumerator() != null
              && ingredient.getPresentationStrengthNumerator().getValue() != null)) {

        // refined active ingredient must be set.
        validatePopulatedConcept(
            ingredient.getRefinedActiveIngredient(),
            "Product must have an refined ingredient defined when concentration strength or presentation strength is set",
            result);
        // precise ingredient must be set
        validatePopulatedConcept(
            ingredient.getPreciseIngredient(),
            "Product must have an precise ingredient defined when concentration strength or presentation strength is set",
            result);
        // boss ingredient must be set
        validatePopulatedConcept(
            ingredient.getBasisOfStrengthSubstance(),
            "Product must have a basis of strength substance defined when concentration strength or presentation strength is set",
            result);
      } else {
        // if concentration strength numerator and denominator is not set, then BoSS must not be set
        validateConceptNotSet(
            ingredient.getBasisOfStrengthSubstance(),
            "Product must not have a basis of strength substance defined when concentration strength and presentation strength is not set",
            result);
        // refined active ingredient must not be set.
        validateConceptNotSet(
            ingredient.getRefinedActiveIngredient(),
            "Product must not have a refined ingredient defined when concentration strength and presentation strength is not set",
            result);
        // precise ingredient must not be set
        validateConceptNotSet(
            ingredient.getPreciseIngredient(),
            "Product must not have a precise ingredient defined when concentration strength and presentation strength is not set",
            result);
      }
    }

    if (vaccine) {
      if (unitOfPresentationExists && unitOfPresentationQuantityExists) {
        // vaccines there is either presentation strength numerator and denominator value or a unit
        // of presentation and size
        validateStrengthNotPopulated(
            ingredient.getPresentationStrengthNumerator(),
            ingredient.getPresentationStrengthDenominator(),
            "presentation",
            "Vaccine",
            "when unit of presentation exists",
            result);
        // concentration strength numerator and denominator value and unit must be set and value
        // must be non-zero.
        validateStrengthNotPopulated(
            ingredient.getConcentrationStrengthNumerator(),
            ingredient.getConcentrationStrengthDenominator(),
            "concentration",
            "Vaccine",
            "when unit of presentation exists",
            result);

      } else if (unitOfPresentationExists) {
        // if unit of presentation exists, presentation strength numerator and denominator value and
        // unit must be set and value must be non-zero.
        validateNumeratorDenominatorSet(
            ingredient.getPresentationStrengthNumerator(),
            ingredient.getPresentationStrengthDenominator(),
            "presentation",
            "Vaccine",
            "when unit of presentation does not exists",
            result);
        // concentration strength numerator and denominator value and unit must not be set
        validateStrengthNotPopulated(
            ingredient.getConcentrationStrengthNumerator(),
            ingredient.getConcentrationStrengthDenominator(),
            "concentration",
            "Vaccine",
            "when unit of presentation does not exists",
            result);
      } else {
        result.addProblem("Vaccine must have a unit of presentation set");
      }
    } else if (nutritionalProduct) {
      validateStrengthNotPopulated(
          ingredient.getPresentationStrengthNumerator(),
          ingredient.getPresentationStrengthDenominator(),
          "presentation",
          "Nutritional product",
          "",
          result);
      validateStrengthNotPopulated(
          ingredient.getConcentrationStrengthNumerator(),
          ingredient.getConcentrationStrengthDenominator(),
          "concentration",
          "Nutritional product",
          "",
          result);
    } else {
      // if unit of presentation exists, presentation strength numerator and denominator value and
      // unit must be set and value must be non-zero.
      if (unitOfPresentationExists) {
        if (ingredient.getPresentationStrengthNumerator() != null
            && (ingredient.getPresentationStrengthNumerator().getValue() != null
                || ingredient.getPresentationStrengthNumerator().getUnit() != null)) {
          // if presentation strength numerator is set, then presentation strength denominator must
          // also be set.
          validateNumeratorDenominatorSet(
              ingredient.getPresentationStrengthNumerator(),
              ingredient.getPresentationStrengthDenominator(),
              "presentation",
              "Product",
              "when unit of presentation exists and presentation strength is partially set",
              result);
          // concentration strength numerator and denominator value and unit must not be set
          validateStrengthNotPopulated(
              ingredient.getConcentrationStrengthNumerator(),
              ingredient.getConcentrationStrengthDenominator(),
              "concentration",
              "Product",
              "when unit of presentation exists and presentation strength is partially set",
              result);
        } else {
          // if presentation strength isn't set with unit of presentation, then no strength should
          // be set
          validateStrengthNotPopulated(
              ingredient.getPresentationStrengthNumerator(),
              ingredient.getPresentationStrengthDenominator(),
              "presentation",
              "Product",
              "when unit of presentation exists",
              result);
          // concentration strength numerator and denominator value and unit must not be set
          validateStrengthNotPopulated(
              ingredient.getConcentrationStrengthNumerator(),
              ingredient.getConcentrationStrengthDenominator(),
              "concentration",
              "Product",
              "when unit of presentation exists",
              result);
        }
      } else {
        // if unit of presentation does not exist, presentation strength numerator and denominator
        // value and unit must not be set.
        validateStrengthNotPopulated(
            ingredient.getPresentationStrengthNumerator(),
            ingredient.getPresentationStrengthDenominator(),
            "presentation",
            "Product",
            "when unit of presentation does not exist",
            result);
        // concentration strength numerator and denominator value and unit must be set and value
        // must
        // be non-zero.
        validateNumeratorDenominatorSet(
            ingredient.getConcentrationStrengthNumerator(),
            ingredient.getConcentrationStrengthDenominator(),
            "concentration",
            "Product",
            "when unit of presentation does not exist",
            result);
      }
    }

    // validate that total quantity is not populated
    if (ingredient.getTotalQuantity() != null) {
      result.addProblem(
          "Product must not have a total quantity defined for an ingredient, use presentation numerator and denominator instead");
    }

    if (ingredient.getConcentrationStrength() != null) {
      result.addProblem(
          "Product must not have a concentration strength ratio defined for an ingredient, use numerator and denominator instead");
    }
  }

  @Override
  protected String getVariantName() {
    return "medication";
  }

  @Override
  protected Set<ProductTemplate> getSupportedProductTypes() {
    return Set.of(
        ProductTemplate.noStrength,
        ProductTemplate.concentrationStrength,
        ProductTemplate.presentationStrength,
        ProductTemplate.noIngredients);
  }
}
