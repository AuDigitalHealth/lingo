import * as yup from 'yup';
import {
  ExternalIdentifier,
  Ingredient,
  MedicationPackageDetails,
  MedicationPackageQuantity,
  MedicationProductDetails,
  MedicationProductQuantity,
  Quantity,
} from './product.ts';
import { Concept, Product, Term } from './concept.ts';
import {
  isEmptyObjectByValue,
  isUnitEach,
  isValidConcept,
} from '../utils/helpers/conceptUtils.ts';
import { validComoOfProductIngredient } from './productValidationUtils.ts';

export const containerTypeIsMissing = 'Container type is a required field';

export const oiiRequired =
  'Other Identifying Information is a required field and should not be empty';

const rule1 = 'One of Form, Container, or Device must be populated';
const rule1a = 'Both Device type and container must not be populated ';

const rule2 = 'If Container is populated, Form must be populated';

const rule3 = 'If Form is populated, Device must not be populated';

const rule4 = 'If Device is populated, Container must not be populated';
const rule5a = 'Value is required';
const rule5b = 'Unit is required';
const rule6 = 'Value must be a positive whole number.';
export const rule7ValueNotAlignWith =
  'The Unit Strength, Concentration Strength, and Unit Size values are not aligned.';

const rule8 =
  'If Container or Device type is populated for a product, then the Pack Size unit must be Each';
const rule9 =
  'If the Pack Size Unit is not Each, Product Size must not be populated.';
const rule10 = 'Value must be a whole, positive integer';
const rule11 = 'Container type is mandatory';
const rule15 = 'Brand name is mandatory';
const rule18 = 'Active ingredient is mandatory';
const rule19 =
  'If the contained product has a container, device, or a quantity, then the containing package must use Each';
const rule22 =
  'If BoSS is populated, Unit strength or concentration strength must be populated';

export const warning_IngStrengthNumberOfFields =
  'Invalid combination for Unit size, Concentration strength and Unit Strength';

export const warning_ProductSizeUnitMatchesConcentration =
  'The Unit Size Unit should match the Concentration Strength Unit denominator unit';

export const warning_TotalQtyUnitMatchesConcentration =
  'The Total Quantity Unit should match the Concentration Strength Unit numerator unit';
/**
 * Rule 1: One of Form, Container, or Device must be populated
 * Rule 2: If Container is populated, Form must be populated
 * Rule 3: If Form is populated, Device must not be populated
 * Rule 4: If Device is populated, Form and Container must not be populated
 * Rule 5: If a value is populated the corresponding unit must be populated, and vice versa. For example "5 mg" is OK, but 5 without a unit, or mg without a size is not.
 * Rule 6: Where a value has a unit of Each that value must be a positive whole number.
 * Rule 7: If Product Size, Concentration Strength, and Total Quantity are populated, their values should not contradict each other. For example the following must be true
 *        Product Size * Concentration Strength = Total Quantity
 *        Total Quantity / Product Size = Concentration Strength
 *        (Rule 7 should be Warning) Not the error
 *
 * Rule 8: If Container or Device type is populated for a product, then the Pack Size unit must be Each
 * Rule 9: If the Pack Size Unit is not Each (currently mg and mL are the only other values), Product Size must not be populated.
 * Rule 10: All packages must have a pack size populated (mandatory)
 * Rule 11: Container type at the pack level (as opposed to product level) is mandatory.
 * Rule 12: A pack containing other packs must have a Pack Size Unit of Each
 * Rule 13: Where a pack contains other packs, the number of contained packs is mandatory and must be a positive integer.
 * Rule 14: The container type for all multipacks is Pack, this must be defaulted and not editable by users.
 * Rule 15: Brand name is mandatory for both Packs and contained Products.
 * Rule 16: Generic dose form is mandatory. // Invalid Rule
 * Rule 17: When a specific dose form is set, it must be a subtype of the selected generic dose form. //Handled by drop down control
 * Rule 18: Active ingredient is mandatory
 * Rule 19: If the contained product has a container, device, or a quantity, then the containing package must use Each and a whole number size to represent containing this product
 * Rule 20: Precise ingredient can only be specified if active ingredient is specified  //Handled by drop down control
 * Rule 21: BoSS can only be specified if active ingredient is specified
 * Rule 22: If BoSS is populated, total quantity or concentration strength must be populated
 * Rule 23: Product name must be populated on both products and containing packages
 */

const ingredients = yup.array().of(
  yup
    .object<Ingredient>({
      activeIngredient: yup.object<Concept>().required(rule18),
      concentrationStrength: yup
        .object<Quantity>({
          value: yup
            .number()
            .nullable()
            .transform((_, val: number | null) =>
              val === Number(val) ? val : null,
            )
            .when('unit', ([unit]) => validateRule5And6(unit as Concept)),
          unit: yup
            .object<Concept>()
            .test('validate rule 5', validateRule5b)
            .nullable(),
        })
        .nullable()
        .optional(),
      totalQuantity: yup
        .object<Quantity>({
          value: yup
            .number()
            .when('unit', ([unit]) => validateRule5And6(unit as Concept)),
          unit: yup
            .object<Concept>()
            .test('validate rule 5', validateRule5b)
            .nullable(),
        })
        .optional(),
      basisOfStrengthSubstance: yup
        .object<Concept>()
        .nullable()
        .test('validate rule 22', validateRule22),
    })
    .test('Validate rule 7', '', validateRule7),
);

const containedProductsArray = yup.array().of(
  yup.object<MedicationProductQuantity>({
    productDetails: yup
      .object<MedicationProductDetails>({
        productName: yup.object<Concept>().required(rule15).defined(rule15),
        otherIdentifyingInformation: yup.string().trim().required(oiiRequired),
        quantity: yup //Product size
          .object<Quantity>({
            value: yup
              .number()
              .nullable()
              .transform((_, val: number | null) =>
                val === Number(val) ? val : null,
              )
              .when('unit', ([unit]) => validateRule5And6(unit as Concept)),
            unit: yup
              .object<Concept>()
              .test('validate rule 5', validateRule5b)
              .test('validate rule 9', validateRule9)
              .optional()
              .nullable(),
          })
          .nullable(),
        activeIngredients: ingredients,
        containerType: yup
          .object<Concept>()
          .test('validate rule 4', validateRule4)
          .nullable(),
        genericForm: yup
          .object<Concept>()
          .nullable()
          .when('containerType', ([containerType]) =>
            containerType
              ? yup.object<Concept>().required(rule2)
              : yup.object<Concept>().nullable(),
          ),
        deviceType: yup
          .object<Concept>()
          .test('validate rule 3', '', validateRule3)
          .nullable(),
      })
      .required()
      .test(
        'Validate Rule 1', //Rule 1: One of Form, Container, or Device must be populated
        '',
        validateRule1,
      )
      .test(
        'Validate Rule 1a', //Rule 1: One of Form, Container, or Device must be populated
        '',
        validateRule1a,
      ),
    unit: yup
      .object<Concept>()
      .test('validate rule 5', validateRule5bPackSize)
      .test('validate rule 9', validateRule8)
      .test('validate rule 19', validateRule19)
      .nullable(),
    value: yup
      .number()
      .when('unit', ([unit]) => validateRule5And6(unit as Concept)),
  }),
);

function validateRule1(
  medicationProductDetails: MedicationProductDetails,
  context: yup.TestContext,
) {
  if (
    !medicationProductDetails.genericForm &&
    !medicationProductDetails.containerType &&
    !medicationProductDetails.deviceType
  ) {
    return context.createError({
      message: rule1 + `(location: ${context.path})`,
      path: context.path,
    });
  }
  return true;
}

function validateRule3(deviceType: Concept, context: yup.TestContext) {
  const productDetails = context.from?.[1].value as MedicationProductDetails;
  if (deviceType && productDetails.genericForm) {
    return context.createError({
      message: rule3,
      path: context.path,
    });
  }
  return true;
}

function validateRule4(value: Concept, context: yup.TestContext) {
  const productDetails = context.from?.[1].value as MedicationProductDetails;
  if (value && productDetails.deviceType) {
    return context.createError({
      message: rule4,
      path: context.path,
    });
  }
  return true;
}

function validateRule5And6(unit: Concept) {
  return unit
    ? validateRule6(unit)
    : yup
        .number()
        .nullable()
        .transform((_, val: number | null) =>
          val === Number(val) ? val : null,
        );
}
function validateRule6(unit: Concept) {
  return unit && unit.pt?.term === 'Each'
    ? yup
        .number()
        .positive(rule6)
        .integer(rule6)
        .required(rule6)
        .typeError(rule6)
    : yup.number().required(rule5a).typeError(rule5a);
}
function validateRule7(ingredient: Ingredient, context: yup.TestContext) {
  const containedProduct = context.from?.[2].value as MedicationProductQuantity;

  const productSize =
    containedProduct.productDetails?.quantity &&
    containedProduct.productDetails?.quantity.value
      ? containedProduct.productDetails?.quantity.value
      : null;
  const concentration =
    ingredient.concentrationStrength && ingredient.concentrationStrength.value
      ? ingredient.concentrationStrength.value
      : null;
  const totalQuantity =
    ingredient.totalQuantity && ingredient.totalQuantity.value
      ? ingredient.totalQuantity.value
      : null;

  if (productSize && concentration && totalQuantity) {
    if (productSize * concentration !== totalQuantity) {
      return context.createError({
        message: rule7ValueNotAlignWith + `(location: ${context.path})`,
        path: context.path,
      });
    }
  } else {
    if (
      validComoOfProductIngredient(
        ingredient,
        containedProduct.productDetails?.quantity,
      ) === 'invalid'
    ) {
      return context.createError({
        message:
          warning_IngStrengthNumberOfFields + `(location: ${context.path})`,
        path: context.path,
      });
    }
  }
  return true;
}

function validateRule5b(unit: Concept, context: yup.TestContext) {
  const qty = context.from?.[1].value as Quantity;
  if (qty.value && !unit) {
    return context.createError({
      message: rule5b,
      path: context.path,
    });
  }
  return true;
}
function validateRule5bPackSize(unit: Concept, context: yup.TestContext) {
  const qty = context.from?.[1].value as MedicationProductQuantity;
  if (qty.value && !unit) {
    return context.createError({
      message: rule5b,
      path: context.path,
    });
  }
  return true;
}
function validateRule8(unit: Concept, context: yup.TestContext) {
  const qty = context.from?.[1].value as MedicationProductQuantity;
  if (
    (qty.productDetails?.deviceType || qty.productDetails?.containerType) &&
    unit &&
    unit.pt?.term != 'Each'
  ) {
    return context.createError({
      message: rule8,
      path: context.path,
    });
  }
  return true;
}
function validateRule19(unit: Concept, context: yup.TestContext) {
  const qty = context.from?.[1].value as MedicationProductQuantity;
  if (
    (qty.productDetails?.deviceType ||
      qty.productDetails?.containerType ||
      qty.productDetails?.quantity?.value) &&
    unit &&
    unit.pt?.term != 'Each'
  ) {
    return context.createError({
      message: rule19,
      path: context.path,
    });
  }
  return true;
}
function validateRule9(unit: Concept, context: yup.TestContext) {
  const qty = context.from?.[3].value as MedicationProductQuantity;
  if (qty && !isUnitEach(qty.unit) && unit) {
    return context.createError({
      message: rule9,
      path: context.path,
    });
  }
  return true;
}

function validateRule22(boss: Concept | null, context: yup.TestContext) {
  const ingredient = context.from?.[1].value as Ingredient;
  if (
    isValidConcept(boss) &&
    !(
      !isEmptyObjectByValue(ingredient.totalQuantity) ||
      !isEmptyObjectByValue(ingredient.concentrationStrength)
    )
  ) {
    return context.createError({
      message: rule22,
      path: context.path,
    });
  }
  return true;
}
function validateRule1a(
  medicationProductDetails: MedicationProductDetails,
  context: yup.TestContext,
) {
  if (
    medicationProductDetails.containerType &&
    medicationProductDetails.deviceType
  ) {
    return context.createError({
      message: rule1a + `(location: ${context.path})`,
      path: context.path,
    });
  }
  return true;
}
export const medicationPackageDetailsObjectSchema: yup.ObjectSchema<MedicationPackageDetails> =
  yup.object({
    productName: yup
      .object<Concept>({
        pt: yup.object<Term>({
          term: yup.string().required(rule15).nonNullable(),
        }),
      })
      .required(rule15),
    // .required(brandNameIsMissing),

    containedProducts: containedProductsArray.required(rule15),
    containedPackages: yup
      .array()
      .of(
        yup.object<MedicationPackageQuantity>({
          packageDetails: yup
            .object<MedicationPackageDetails>({
              productName: yup
                .object<Concept>()
                .required(rule15)
                .defined(rule15),
              containerType: yup
                .object<Concept>()
                .defined(containerTypeIsMissing)
                .required(containerTypeIsMissing),

              containedProducts: containedProductsArray.required(rule15),
              quantity: yup.object<Quantity>({
                value: yup
                  .number()
                  .nullable()
                  .transform((_, val: number | null) =>
                    val === Number(val) ? val : null,
                  ),
              }),
            })
            .required(),
          value: yup
            .number()
            .required(rule10)
            .typeError(rule10)
            .positive(rule10)
            .integer(rule10),
        }),
      )
      .required(),
    containerType: yup.object<Concept>().required(rule11),
    externalIdentifiers: yup.array<ExternalIdentifier>(),
    selectedConceptIdentifiers: yup.array().optional(),
  });

export function uniqueFsnValidator(products: Product[]): boolean {
  if (!products) return true; // Handle undefined or null cases
  const fieldSet = new Set<string>();
  for (const product of products) {
    let fsn = '';
    if (product.concept) {
      fsn = product.concept.fsn ? product.concept.fsn.term : '';
    } else {
      fsn = product.newConceptDetails['fullySpecifiedName'];
    }

    if (fieldSet.has(fsn)) {
      return true; // Not unique
    }
    fieldSet.add(fsn);
  }
  return false; // All values in the specified field are unique
}

export function uniquePtValidator(products: Product[]): boolean {
  if (!products) return true; // Handle undefined or null cases
  const fieldSet = new Set<string>();
  for (const product of products) {
    let pt = '';
    if (product.concept) {
      pt = product.concept.pt ? product.concept.pt.term : '';
    } else {
      pt = product.newConceptDetails['preferredTerm'];
    }

    if (fieldSet.has(pt)) {
      return true; // Not unique
    }
    fieldSet.add(pt);
  }
  return false; // All values in the specified field are unique
}
