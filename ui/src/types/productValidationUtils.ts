import { FieldErrors } from 'react-hook-form';
import {
  Ingredient,
  MedicationPackageDetails,
  MedicationPackageQuantity,
  MedicationProductQuantity,
} from './product.ts';
import { UnitPackId } from '../utils/helpers/conceptUtils.ts';

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
    if (
      product.productDetails?.containerType &&
      medicationPackageDetails.containerType?.conceptId !== UnitPackId
    ) {
      ids.push(
        `containedProducts[${index}] has container type, package.containerType should be 'Pack'`,
      );
    }
    return ids;
  }, []);
  return warnings;
};
