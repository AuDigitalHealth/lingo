///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { FieldErrors } from 'react-hook-form';
import {
  BrandPackSizeCreationDetails,
  DevicePackageDetails,
  DeviceProductQuantity,
  Ingredient,
  MedicationPackageDetails,
  MedicationPackageQuantity,
  MedicationProductQuantity,
  Quantity,
} from './product.ts';
import {
  isValidConcept,
  UnitMgId,
  UnitMLId,
} from '../utils/helpers/conceptUtils.ts';
import {
  WARNING_BOSS_VALUE_NOT_ALIGNED,
  WARNING_INVALID_COMBO_STRENGTH_SIZE_AND_TOTALQTY,
  WARNING_PRODUCTSIZE_UNIT_NOT_ALIGNED,
  WARNING_TOTALQTY_UNIT_NOT_ALIGNED,
} from './productValidations.ts';
import { FieldBindings } from './FieldBindings.ts';
import { generateEclFromBinding } from '../utils/helpers/EclUtils.ts';
import { Concept, Product } from './concept.ts';
import * as yup from 'yup';
import { showErrors, snowstormErrorHandler } from './ErrorHandler.ts';
import { ServiceStatus } from './applicationConfig.ts';
import ConceptService from '../api/ConceptService.ts';

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

export const parseDeviceProductErrors = (
  productErrors: FieldErrors<DeviceProductQuantity>[],
) => {
  const result: string[] = [];
  productErrors.forEach(function (
    productError: FieldErrors<DeviceProductQuantity>,
  ) {
    if (productError?.productDetails && productError?.productDetails?.root) {
      result.push(
        `${productError?.productDetails?.root?.type}` +
          `: ${productError?.productDetails?.root?.message}`,
      );
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
export const parseDeviceErrors = (
  errors: FieldErrors<DevicePackageDetails>,
) => {
  let finalErrors: string[] = [];
  if (errors && errors.containedProducts) {
    finalErrors = parseDeviceProductErrors(
      errors?.containedProducts as FieldErrors<DeviceProductQuantity>[],
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

export const findWarningsForBrandPackSizes = async (
  brandPackSizeCreationDetails: BrandPackSizeCreationDetails,
  branch: string,
  fieldBindings: FieldBindings,
): Promise<string[]> => {
  brandPackSizeCreationDetails;
  branch;
  fieldBindings;
  return Promise.resolve([]);
};

const findAllWarningsFromProducts = async (
  containedProducts: MedicationProductQuantity[],
  branch: string,
  fieldBindings: FieldBindings,
  packageIndex?: number,
): Promise<string[]> => {
  const warningPromises = containedProducts.map(async (product, index) => {
    const ingredientsArray = product.productDetails
      ?.activeIngredients as Ingredient[];
    const messages: string[] = [];

    if (
      product.productDetails?.quantity &&
      product.productDetails?.quantity.unit &&
      product.productDetails?.quantity.unit.conceptId !== UnitMgId &&
      product.productDetails?.quantity.unit.conceptId !== UnitMLId
    ) {
      messages.push(
        packageIndex !== undefined
          ? `Pack size unit is not mg or mL in containedPackages[${packageIndex}].packageDetails.containedProducts[${index}], it is recommended you use a standardised unit\n`
          : `Pack size unit is not mg or mL in containedProducts[${index}].productDetails, it is recommended you use a standardised unit\n`,
      );
    }

    const ingredientWarnings = ingredientsArray.map(async (ingredient, i) => {
      const message: string[] = [];
      let messageIdentifier = '';
      let warningFound = false;

      const validBoss = await validBossSelection(
        ingredient,
        branch,
        fieldBindings,
      );

      if (!validBoss) {
        message.push(`${WARNING_BOSS_VALUE_NOT_ALIGNED}`);
        warningFound = true;
      }
      if (
        validComoOfProductIngredient(
          ingredient,
          product.productDetails?.quantity,
          fieldBindings,
        ) === 'probably invalid'
      ) {
        message.push(`${WARNING_INVALID_COMBO_STRENGTH_SIZE_AND_TOTALQTY}`);
        warningFound = true;
      }
      if (
        !unitMatchesProductSizeAndConcentration(
          ingredient,
          product.productDetails?.quantity,
        )
      ) {
        message.push(`${WARNING_PRODUCTSIZE_UNIT_NOT_ALIGNED}`);
        warningFound = true;
      }
      if (!unitMatchesTotalQtyAndConcentration(ingredient)) {
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
        return message.join() + messageIdentifier;
      }

      return '';
    });

    const ingredientMessages = await Promise.all(ingredientWarnings);
    messages.push(...ingredientMessages.filter(msg => msg !== ''));

    return messages;
  });

  const allMessages = await Promise.all(warningPromises);
  return allMessages.flat();
};

/**
 * Return 3 values, valid(true), invalid(false), probably invalid(null)
 * @param ingredient
 * @param qty
 */
export const validComoOfProductIngredient = (
  ingredient: Ingredient,
  qty: Quantity | null | undefined,
  fieldBindings: FieldBindings,
): string => {
  const excludedSubstances = fieldBindings
    ? (
        fieldBindings.bindingsMap.get(
          'product.validation.exclude.substances',
        ) as string
      ).split(',')
    : [];
  const productSize = qty && qty.value ? qty.value : null;
  const productSizeUnit = qty && qty.unit ? qty.unit : null;
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
  if (
    productSize &&
    !concentration &&
    ingredient.activeIngredient?.id &&
    excludedSubstances.includes(ingredient.activeIngredient?.id)
  ) {
    return valid;
  } else if (productSize && concentration && totalQuantity) {
    return valid;
  } else if (productSize) {
    if (
      concentration &&
      !unitMatchesProductSizeAndConcentration(ingredient, qty)
    ) {
      return valid;
    } else if (
      productSizeUnit &&
      !(
        productSizeUnit.conceptId === UnitMgId ||
        productSizeUnit.conceptId === UnitMLId
      )
    ) {
      return valid;
    } else {
      return invalid;
    }
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
      const res = await ConceptService.searchConceptInOntoFallbackToSnowstorm(
        generatedEcl,
        branch,
      );
      if (
        res.length === 1 &&
        res[0].conceptId === ingredient.basisOfStrengthSubstance?.conceptId
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

export function validateConceptExistence(
  concept: Concept | null | undefined,
  branch: string,
  context: yup.TestContext,
  activeConceptIds: string[],
) {
  if (
    concept &&
    concept.conceptId &&
    activeConceptIds &&
    activeConceptIds.length > 0 &&
    !activeConceptIds.includes(concept.conceptId)
  ) {
    return context.createError({
      message: 'Concept does not exist or inactive',
      path: context.path,
    });
  }
  return true;
}
export async function findAllActiveConcepts(
  medicationPackageDetails: MedicationPackageDetails,
  branch: string,
) {
  const conceptIds = extractAllConcepts(medicationPackageDetails)
    .filter(c => c.conceptId)
    .map(c => c.conceptId as string);
  return ConceptService.getFilteredConceptIdsByBatches(
    [...new Set(conceptIds.sort())],
    branch,
  );
}

function extractAllConcepts(obj: any): Concept[] {
  const result: Concept[] = [];

  function recurse(o: any) {
    if (o && o !== undefined && o !== null) {
      if (typeof o === 'object' && o !== null) {
        // Check if the object is a custom-defined type (based on your criteria)
        if (isConceptType(o)) {
          result.push(o);
        }
        for (const key in o) {
          // eslint-disable-next-line
          if (o.hasOwnProperty(key)) {
            // eslint-disable-next-line
            recurse(o[key]);
          }
        }
      }
    }
  }

  recurse(obj);
  return result;
}

function isConceptType(obj: any): obj is Concept {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof obj.conceptId === 'string' &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof obj.id === 'string'
  );
}

/**
 * Validate the existence of given product summary nodes in snowstorm
 * Generate error if any invalid concept found
 * @param products
 */
export async function validateProductSummaryNodes(
  products: Product[],
  branch: string,
  serviceStatus: ServiceStatus | undefined,
): Promise<void | ReturnType<typeof showErrors>> {
  // Extract concept IDs from products that are not new concepts
  const conceptIdsToBeChecked = products
    .filter(p => !p.newConcept)
    .map(p => p.conceptId);

  // Get distinct concept IDs
  const distinctConceptIds = [...new Set(conceptIdsToBeChecked)];

  if (distinctConceptIds.length > 0) {
    try {
      const resultConceptIds =
        await ConceptService.getFilteredConceptIdsByBatches(
          distinctConceptIds,
          branch,
        );
      // Identify missing concept IDs
      const missingIds = distinctConceptIds.filter(
        item => !resultConceptIds.includes(item),
      );
      if (missingIds && missingIds.length > 0) {
        // Create error message for missing concepts
        const message = [
          ...new Set(
            products
              .filter(p => missingIds.includes(p.conceptId))
              .map(p => `<${p.concept?.pt?.term} ${p.conceptId}>`),
          ),
        ];

        // Show errors if any missing concepts
        return showErrors([
          `One or more concepts do not exist or are inactive: ${message.join(', ')}`,
        ]);
      }
    } catch (error) {
      // Handle errors
      return snowstormErrorHandler(
        error,
        'validateProductSummaryNodes',
        serviceStatus,
      );
    }
  }

  return undefined;
}
function replaceAll(
  originalString: string,
  searchString: string,
  replaceWith: string,
) {
  return originalString.replace(new RegExp(searchString, 'g'), replaceWith);
}
export function roundToSigFigs(num: number, sigFigs: number) {
  if (num === 0) return 0;

  // Separate the integer and decimal parts
  const integerPart = Math.trunc(num);
  const decimalPart = Math.abs(num) - Math.abs(integerPart);

  if (decimalPart === 0) return num;

  // Count significant figures in the decimal part
  const log10 = Math.log10(decimalPart);
  const scale = Math.pow(10, sigFigs - 1 - Math.floor(log10));

  const roundedDecimalPart = Math.round(decimalPart * scale) / scale;

  // Combine the integer part and the rounded decimal part
  const roundedNum =
    integerPart + (num < 0 ? -roundedDecimalPart : roundedDecimalPart);

  return roundedNum;
}
