import { FieldErrors } from 'react-hook-form';
import {
  Ingredient,
  MedicationPackageDetails,
  MedicationPackageQuantity,
  MedicationProductQuantity,
  Quantity,
} from './product.ts';
import { isValidConcept } from '../utils/helpers/conceptUtils.ts';
import {
  warning_IngStrengthNumberOfFields,
  warning_ProductSizeUnitMatchesConcentration,
  warning_TotalQtyUnitMatchesConcentration,
} from './productValidations.ts';

export const parseIngErrors = (ingErrors: FieldErrors<Ingredient>[]) => {
  const result: string[] = [];
  ingErrors.forEach(function (ingError: FieldErrors) {
    if (ingError.root) {
      result.push(`${ingError.root.type}` + `: ${ingError.root.message}`);
    }
  });

  return result;
};

export const parseProductErrors = (
  productErrors: FieldErrors<MedicationProductQuantity>[],
) => {
  let result: string[] = [];
  productErrors.forEach(function (
    productError: FieldErrors<MedicationProductQuantity>,
  ) {
    if (productError?.productDetails && productError?.productDetails.root) {
      result.push(
        `${productError?.productDetails.root?.type}` +
          `: ${productError?.productDetails.root?.message}`,
      );
    }

    if (productError?.productDetails?.activeIngredients) {
      const ingErrors = parseIngErrors(
        productError?.productDetails
          ?.activeIngredients as FieldErrors<Ingredient>[],
      );
      if (ingErrors && ingErrors.length > 0) {
        result = result.concat(ingErrors);
      }
    }
  });
  return result;
};

export const parsePackageErrors = (
  packageErrors: FieldErrors<MedicationPackageQuantity>[],
) => {
  let result: string[] = [];
  packageErrors.forEach(function (
    packageError: FieldErrors<MedicationPackageQuantity>,
  ) {
    if (packageError?.packageDetails?.containedProducts) {
      const currentError = parseProductErrors(
        packageError?.packageDetails
          ?.containedProducts as FieldErrors<MedicationProductQuantity>[],
      );
      if (currentError && currentError.length > 0) {
        result = result.concat(currentError);
      }
    }
  });
  return result;
};

export const parseMedicationProductErrors = (
  errors: FieldErrors<MedicationPackageDetails>,
) => {
  let finalErrors: string[] = [];
  if (errors && errors.containedProducts) {
    finalErrors = parseProductErrors(
      errors?.containedProducts as FieldErrors<MedicationProductQuantity>[],
    );
    if (finalErrors.length < 1) {
      finalErrors = ['Please check the form'];
    }
  }
  if (errors && errors.containedPackages) {
    finalErrors = parsePackageErrors(
      errors.containedPackages as FieldErrors<MedicationPackageQuantity>[],
    );
    if (finalErrors.length < 1) {
      finalErrors = ['Please check the form'];
    }
  }

  return finalErrors;
};
export const findWarningsForMedicationProduct = (
  medicationPackageDetails: MedicationPackageDetails,
) => {
  const warnings = medicationPackageDetails?.containedProducts.reduce(function (
    ids: string[],
    product,
    index,
  ) {
    product.productDetails?.activeIngredients?.forEach(function (
      ingredient: Ingredient,
      ingIndex,
    ) {
      let warningFound = false;
      if (
        validComoOfProductIngredient(
          ingredient,
          product.productDetails?.quantity,
        ) === 'probably invalid'
      ) {
        ids.push(`${warning_IngStrengthNumberOfFields} '`);
        warningFound = true;
      }
      if (
        !unitMatchesProductSizeAndConcentration(
          ingredient,
          product.productDetails?.quantity,
        )
      ) {
        ids.push(`${warning_ProductSizeUnitMatchesConcentration} '`);
        warningFound = true;
      }
      if (!unitMatchesTotalQtyAndConcentration(ingredient)) {
        ids.push(`${warning_TotalQtyUnitMatchesConcentration} '`);
        warningFound = true;
      }
      if (warningFound) {
        ids.push(
          ` on containedProducts[${index}].productDetails.activeIngredients[${ingIndex}] '`,
        );
      }
    });

    return ids;
  }, []);
  return warnings;
};

/**
 * Return 3 values, valid(true), invalid(false), probably invalid(null)
 * @param ingredient
 * @param qty
 */
export const validComoOfProductIngredient = (
  ingredient: Ingredient,
  qty: Quantity | null | undefined,
): string => {
  const productSize = qty && qty.value ? qty.value : null;
  const concentration =
    ingredient.concentrationStrength && ingredient.concentrationStrength.value
      ? ingredient.concentrationStrength.value
      : null;
  const totalQuantity =
    ingredient.totalQuantity && ingredient.totalQuantity.value
      ? ingredient.totalQuantity.value
      : null;
  const valid = 'valid';
  const invalid = 'invalid';
  const probablyInvalid = 'probably invalid';
  if (productSize && concentration && totalQuantity) {
    return valid;
  } else if (productSize && concentration && !totalQuantity) {
    return probablyInvalid;
  } else if (!productSize && concentration && !totalQuantity) {
    return valid;
  } else if (!productSize && !concentration && totalQuantity) {
    return valid;
  } else if (!productSize && !concentration && !totalQuantity) {
    return valid;
  }

  return invalid;
};

const unitMatchesProductSizeAndConcentration = (
  ingredient: Ingredient,
  qty: Quantity | null | undefined,
) => {
  if (
    ingredient.concentrationStrength &&
    isValidConcept(ingredient.concentrationStrength.unit) &&
    qty &&
    isValidConcept(qty.unit)
  ) {
    const strengthDenominator =
      ingredient.concentrationStrength.unit?.pt?.term.split('/')[1];
    if (strengthDenominator !== qty.unit?.pt?.term) {
      return false;
    }
  }
  return true;
};
const unitMatchesTotalQtyAndConcentration = (ingredient: Ingredient) => {
  if (
    ingredient.concentrationStrength &&
    isValidConcept(ingredient.concentrationStrength.unit) &&
    ingredient.totalQuantity &&
    isValidConcept(ingredient.totalQuantity.unit)
  ) {
    const strengthNumerator =
      ingredient.concentrationStrength.unit?.pt?.term.split('/')[0];
    if (strengthNumerator !== ingredient.totalQuantity.unit?.pt?.term) {
      return false;
    }
  }
  return true;
};
export function isNumeric(value: string) {
  return /^\d+$/.test(value);
}
