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
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.Ingredient;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.NutritionalProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductQuantity;
import au.gov.digitalhealth.lingo.product.details.VaccineProductDetails;
import au.gov.digitalhealth.lingo.service.SnowstormClient;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
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

  @Override
  public void validatePackageDetails(
      PackageDetails<MedicationProductDetails> packageDetails, String branch) {

    validateNonDefiningProperties(
        packageDetails.getNonDefiningProperties(),
        ProductPackageType.PACKAGE,
        models.getModelConfiguration(branch));

    if (!packageDetails.getContainedPackages().isEmpty()) {
      throw new ProductAtomicDataValidationProblem(
          "Medication packages cannot contain other packages");
    }
    if (packageDetails.getContainedProducts().isEmpty()) {
      throw new ProductAtomicDataValidationProblem(
          "Medication packages must contain at least one product");
    }
    validateConceptNotSet(
        packageDetails.getContainerType(),
        "Medication packages cannot have a container type defined");
    validateConceptNotSet(
        packageDetails.getProductName(), "Medication packages cannot have a product name defined");

    for (ProductQuantity<MedicationProductDetails> productQuantity :
        packageDetails.getContainedProducts()) {
      validatePopulatedConcept(
          productQuantity.getUnit(), "Medication product quantity must have a unit defined");
      validateQuantityNotZero(
          productQuantity, "Medication product quantity must have a value greater than zero");
      if (UNIT_OF_PRESENTATION.getValue().equals(productQuantity.getUnit().getConceptId())
          && !productQuantity.getValue().equals(BigDecimal.ONE)) {
        throw new ProductAtomicDataValidationProblem(
            "Medication product quantity must be one if unit is 'unit of presentation'");
      }
      validateProductDetails(productQuantity.getProductDetails(), branch);
    }
  }

  private void validateProductDetails(
      @NotNull @Valid MedicationProductDetails productDetails, String branch) {
    // validate non-defining properties
    validateNonDefiningProperties(
        productDetails.getNonDefiningProperties(),
        ProductPackageType.PRODUCT,
        models.getModelConfiguration(branch));

    //  container type and device type must not be populated.
    validateConceptNotSet(
        productDetails.getContainerType(),
        "Medication product details cannot have a container type defined");
    validateConceptNotSet(
        productDetails.getDeviceType(),
        "Medication product details cannot have a device type defined");
    // Generic form must be populated.
    validatePopulatedConcept(
        productDetails.getGenericForm(),
        "Medication product details must have a generic form defined");
    // Specific form can only be set if generic form is set.
    if (isPopulated(productDetails.getSpecificForm())
        && isUnpopulated(productDetails.getGenericForm())) {
      throw new ProductAtomicDataValidationProblem(
          "Medication product details cannot have a specific form defined without a generic form");
    }
    // Product name must be populated.
    validatePopulatedConcept(
        productDetails.getProductName(),
        "Medication product details must have a product name defined");
    // if quantity is set, it must have a unit and a value greater than zero.
    if (productDetails.getQuantity() != null) {
      validatePopulatedConcept(
          productDetails.getQuantity().getUnit(),
          "Medication product details quantity must have a unit defined");
      validateQuantityNotZero(
          productDetails.getQuantity(),
          "Medication product details quantity must have a value greater than zero");
    }

    final boolean unitOfPresentationExists = productDetails.getUnitOfPresentation() != null;
    for (Ingredient ingredient : productDetails.getActiveIngredients()) {

      if (unitOfPresentationExists && productDetails instanceof VaccineProductDetails) {
        validateQuantityNotZero(
            productDetails.getQuantity(),
            "Vaccine unit of presentation quantity and unit must be set if the unit of presentation is set");
      }

      validateIngredient(
          branch,
          ingredient,
          unitOfPresentationExists,
          productDetails instanceof NutritionalProductDetails,
          productDetails instanceof VaccineProductDetails);
    }
  }

  private void validateIngredient(
      String branch,
      Ingredient ingredient,
      boolean unitOfPresentationExists,
      boolean nutritionalProduct,
      boolean vaccine) {

    if (nutritionalProduct) {
      validateConceptNotSet(
          ingredient.getActiveIngredient(),
          "Medication product details must NOT have an active ingredient defined if primitive concept details are set");
      validateConceptNotSet(
          ingredient.getRefinedActiveIngredient(),
          "Medication product details must NOT have an refined ingredient defined if primitive concept details are set");
      validateConceptNotSet(
          ingredient.getPreciseIngredient(),
          "Medication product details must NOT have an precise ingredient defined if primitive concept details are set");
      validateConceptNotSet(
          ingredient.getBasisOfStrengthSubstance(),
          "Medication product details must NOT have an BoSS ingredient defined if primitive concept details are set");
    } else {
      // active ingredient must not be null.
      validatePopulatedConcept(
          ingredient.getActiveIngredient(),
          "Medication product details must have an active ingredient defined");
      // refined active ingredient must be set.
      validatePopulatedConcept(
          ingredient.getRefinedActiveIngredient(),
          "Medication product details must have an refined ingredient defined");
      // precise ingredient must be set
      validatePopulatedConcept(
          ingredient.getPreciseIngredient(),
          "Medication product details must have an precise ingredient defined");

      // if one of the concentration strength numerator or presentation strength numerator is set
      // BoSS
      // must be set.
      if (((ingredient.getConcentrationStrengthNumerator() != null
                  && ingredient.getConcentrationStrengthNumerator().getValue() != null)
              || (ingredient.getPresentationStrengthNumerator() != null
                  && ingredient.getPresentationStrengthNumerator().getValue() != null))
          && ingredient.getBasisOfStrengthSubstance() == null) {
        throw new ProductAtomicDataValidationProblem(
            "Medication product details must have a basis of strength substance defined when concentration strength or presentation strength numerator is set");
      }
    }

    if (vaccine) {
      if (unitOfPresentationExists) {
        // vaccines there is either presentation strength numerator and denominator value or a unit
        // of presentation and size
        validateStrengthNotPopulated(
            ingredient.getPresentationStrengthNumerator(),
            ingredient.getPresentationStrengthDenominator(),
            "presentation");
        // concentration strength numerator and denominator value and unit must be set and value
        // must be non-zero.
        validateStrengthNotPopulated(
            ingredient.getConcentrationStrengthNumerator(),
            ingredient.getConcentrationStrengthDenominator(),
            "concentration");
      } else {
        // if unit of presentation exists, presentation strength numerator and denominator value and
        // unit must be set and value must be non-zero.
        validateNumeratorDenominatorSet(
            ingredient.getPresentationStrengthNumerator(),
            ingredient.getPresentationStrengthDenominator(),
            "presentation");
        // concentration strength numerator and denominator value and unit must not be set
        validateStrengthNotPopulated(
            ingredient.getConcentrationStrengthNumerator(),
            ingredient.getConcentrationStrengthDenominator(),
            "concentration");
      }
    } else if (nutritionalProduct) {
      validateStrengthNotPopulated(
          ingredient.getPresentationStrengthNumerator(),
          ingredient.getPresentationStrengthDenominator(),
          "presentation");
      validateStrengthNotPopulated(
          ingredient.getConcentrationStrengthNumerator(),
          ingredient.getConcentrationStrengthDenominator(),
          "concentration");
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
              "presentation");
          // concentration strength numerator and denominator value and unit must not be set
          validateStrengthNotPopulated(
              ingredient.getConcentrationStrengthNumerator(),
              ingredient.getConcentrationStrengthDenominator(),
              "concentration");
        } else {
          // if presentation strength isn't set with unit of presentation, then no strength should
          // be set
          validateStrengthNotPopulated(
              ingredient.getPresentationStrengthNumerator(),
              ingredient.getPresentationStrengthDenominator(),
              "presentation");
          // concentration strength numerator and denominator value and unit must not be set
          validateStrengthNotPopulated(
              ingredient.getConcentrationStrengthNumerator(),
              ingredient.getConcentrationStrengthDenominator(),
              "concentration");
        }
      } else {
        // if unit of presentation does not exist, presentation strength numerator and denominator
        // value and unit must not be set.
        validateStrengthNotPopulated(
            ingredient.getPresentationStrengthNumerator(),
            ingredient.getPresentationStrengthDenominator(),
            "presentation");
        // concentration strength numerator and denominator value and unit must be set and value
        // must
        // be non-zero.
        validateNumeratorDenominatorSet(
            ingredient.getConcentrationStrengthNumerator(),
            ingredient.getConcentrationStrengthDenominator(),
            "concentration");
      }
    }

    // validate that total quantity is not populated
    if (ingredient.getTotalQuantity() != null) {
      throw new ProductAtomicDataValidationProblem(
          "Medication product details must not have a total quantity defined for an ingredient, use presentation numerator and denominator instead");
    }

    if (ingredient.getConcentrationStrength() != null) {
      throw new ProductAtomicDataValidationProblem(
          "Medication product details must not have a concentration strength ratio defined for an ingredient, use numerator and denominator instead");
    }
  }
}
