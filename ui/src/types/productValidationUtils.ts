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
  WARNING_BOSS_VALUE_NOT_ALIGNED,
  WARNING_INVALID_COMBO_STRENGTH_SIZE_AND_TOTALQTY,
  WARNING_PRODUCTSIZE_UNIT_NOT_ALIGNED,
  WARNING_TOTALQTY_UNIT_NOT_ALIGNED,
} from './productValidations.ts';
import ConceptService from '../api/ConceptService.ts';
import { FieldBindings } from './FieldBindings.ts';
import { generateEclFromBinding } from '../utils/helpers/EclUtils.ts';

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
export const findWarningsForMedicationProduct = async (
  medicationPackageDetails: MedicationPackageDetails,
  branch: string,
  fieldBindings: FieldBindings,
): Promise<string[]> => {
  if (medicationPackageDetails.containedProducts.length > 0) {
    return findAllWarningsFromProducts(
      medicationPackageDetails.containedProducts,
      branch,
      fieldBindings,
    );
  } else if (medicationPackageDetails.containedPackages.length > 0) {
    const warningsPromises = medicationPackageDetails.containedPackages.map(
      (containedPackage, index) =>
        findAllWarningsFromProducts(
          containedPackage.packageDetails
            ?.containedProducts as MedicationProductQuantity[],
          branch,
          fieldBindings,
          index,
        ),
    );
    const warningsArrays = await Promise.all(warningsPromises);
    return warningsArrays.flat();
  }

  return [];
};

const findAllWarningsFromProducts = (
  containedProducts: MedicationProductQuantity[],
  branch: string,
  fieldBindings: FieldBindings,
  packageIndex?: number,
) => {
  return containedProducts.reduce(
    async (accPromise: Promise<string[]>, product, index) => {
      const ids = await accPromise;
      const ingredientsArray = product.productDetails
        ?.activeIngredients as Ingredient[];

      for (let i = 0; i < ingredientsArray.length; i++) {
        const message: string[] = [];
        let messageIdentifier = '';
        let warningFound = false;
        const validBoss = await validBossSelection(
          ingredientsArray[i],
          branch,
          fieldBindings,
        );
        if (!validBoss) {
          message.push(`${WARNING_BOSS_VALUE_NOT_ALIGNED}`);
          warningFound = true;
        }
        if (
          validComoOfProductIngredient(
            ingredientsArray[i],
            product.productDetails?.quantity,
          ) === 'probably invalid'
        ) {
          message.push(`${WARNING_INVALID_COMBO_STRENGTH_SIZE_AND_TOTALQTY}`);
          warningFound = true;
        }
        if (
          !unitMatchesProductSizeAndConcentration(
            ingredientsArray[i],
            product.productDetails?.quantity,
          )
        ) {
          message.push(`${WARNING_PRODUCTSIZE_UNIT_NOT_ALIGNED}`);
          warningFound = true;
        }
        if (!unitMatchesTotalQtyAndConcentration(ingredientsArray[i])) {
          message.push(`${WARNING_TOTALQTY_UNIT_NOT_ALIGNED}`);
          warningFound = true;
        }
        if (warningFound) {
          messageIdentifier =
            packageIndex !== undefined
              ? ` in containedPackages[${packageIndex}].packageDetails.containedProducts[${index}].productDetails.activeIngredients[${i}].\n`
              : ` in containedProducts[${index}].productDetails.activeIngredients[${i}].\n`;
        }
        if (message.length > 0) {
          ids.push(message.join() + messageIdentifier);
        }
      }

      return ids;
    },
    Promise.resolve([]),
  );
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
const validBossSelection = async (
  ingredient: Ingredient,
  branch: string,
  fieldBindings: FieldBindings,
): Promise<boolean> => {
  let validBoss = true;
  if (
    isValidConcept(ingredient.activeIngredient) &&
    isValidConcept(ingredient.basisOfStrengthSubstance)
  ) {
    const ecl = generateEclFromBinding(
      fieldBindings,
      'medicationProduct.activeIngredients.basisOfStrengthSubstance_validation',
    );
    let generatedEcl = replaceAll(
      ecl,
      '@boss',
      ingredient.basisOfStrengthSubstance?.conceptId as string,
    );
    generatedEcl = replaceAll(
      generatedEcl,
      '@iai',
      ingredient.activeIngredient?.conceptId as string,
    );
    try {
      const res = await ConceptService.searchConceptByEcl(generatedEcl, branch);
      if (
        res.items.length === 1 &&
        res.items[0].conceptId ===
          ingredient.basisOfStrengthSubstance?.conceptId
      ) {
        validBoss = true;
      } else {
        validBoss = false;
      }
    } catch (er) {
      validBoss = false;
    }
  }
  return validBoss;
};
function replaceAll(
  originalString: string,
  searchString: string,
  replaceWith: string,
) {
  return originalString.replace(new RegExp(searchString, 'g'), replaceWith);
}
