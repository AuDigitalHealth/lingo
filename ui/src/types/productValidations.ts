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
import { Concept, Term } from './concept.ts';
import { UnitEachId } from '../utils/helpers/conceptUtils.ts';

export const brandNameIsMissing = 'Brand name is a required field';

export const doseFormIsMissing = 'Generic dose form is a required field';
export const containerTypeIsMissing = 'Container type is a required field';
export const packageQty = 'Quantity must be a whole, positive integer';

export const packSize = 'Pack size must be a number';
export const packSizePositiveWhole = 'Pack size must be a +ve whole number';
export const unitIsRequired = 'Unit is a required field';

export const unitSizeIsRequired = 'Unit size is missing';

export const activeIngredientIsRequired = 'Active ingredient is missing';
export const totalQuantityStrengthIsRequired = 'Unit strength is missing';
export const concentrationStrengthIsRequired =
  'Concentration strength is missing';
export const unitMustBeEach = "Unit must be 'Each'";

export const activeIngStrengthNumberOfFields =
  'Either 0, 1 or 3 must be populated';
export const activeIngStrengthUnitMisMatching = 'Invalid units selection';
export const activeIngStrengthCalculationWrong =
  'The Total Quantity, Concentration Strength, and Pack Size values are not aligned.';

export const oiiRequired =
  'Other Identifying Information is a required fields and should not be empty';

const ingredients = yup.array().of(
  yup
    .object<Ingredient>({
      activeIngredient: yup
        .object<Concept>()
        .required(activeIngredientIsRequired),
      concentrationStrength: yup
        .object<Quantity>({
          value: yup
            .number()
            .nullable()
            .transform((_, val: number | null) =>
              val === Number(val) ? val : null,
            )
            .when('unit', ([unit]) =>
              unit
                ? yup
                    .number()
                    .required(concentrationStrengthIsRequired)
                    .typeError(concentrationStrengthIsRequired)
                : yup
                    .number()
                    .nullable()
                    .transform((_, val: number | null) =>
                      val === Number(val) ? val : null,
                    ),
            ),
          unit: yup
            .object<Concept>()
            .test(
              'concentrationStrength.unit denominator should match with package.containedProduct.unit',
              '',
              function (value: Concept) {
                const containedProduct = this.from?.[4]
                  .value as MedicationProductQuantity;
                const medicationProductQtyUnit =
                  containedProduct.productDetails?.quantity?.unit;
                const packageProductUnit = containedProduct.unit;
                const ingredient = this.from?.[2].value as Ingredient;

                if (value && packageProductUnit && !medicationProductQtyUnit) {
                  const strengthDenominator = value.pt?.term.split('/')[1];
                  if (strengthDenominator !== packageProductUnit.pt?.term) {
                    return this.createError({
                      message: `Unit should be aligned with package product unit '${packageProductUnit.pt?.term}'`,
                    });
                  }
                } else if (!value && ingredient.concentrationStrength?.value) {
                  return this.createError({
                    message: unitIsRequired,
                  });
                }
                return true;
              },
            )
            .nullable(),
        })
        .nullable()
        .optional(),
      totalQuantity: yup
        .object<Quantity>({
          value: yup
            .number()
            // .required(totalQuantityStrengthIsRequired)
            // .positive(totalQuantityStrengthIsRequired)
            .typeError(totalQuantityStrengthIsRequired)
            .nullable()

            .transform((_, val: number | null) =>
              val === Number(val) ? val : null,
            )
            .when('unit', ([unit], schema) =>
              unit
                ? yup
                    .number()
                    .required(totalQuantityStrengthIsRequired)
                    .typeError(totalQuantityStrengthIsRequired)
                : yup
                    .number()
                    .nullable()
                    .transform((_, val: number | null) =>
                      val === Number(val) ? val : null,
                    ),
            ),
          unit: yup
            .object<Concept>()
            // .required(unitIsRequired)
            .nullable()
            .test(
              'totalQuantity.unit  should match with package.containedProduct.unit',
              '',
              function (value: Concept | null) {
                const containedProduct = this.from?.[4]
                  .value as MedicationProductQuantity;
                const medicationProductQtyUnit =
                  containedProduct.productDetails?.quantity?.unit;
                const packageProductUnit = containedProduct.unit;
                const ingredient = this.from?.[2].value as Ingredient;
                const strengthUnit = ingredient.concentrationStrength?.unit;

                if (
                  value &&
                  packageProductUnit &&
                  !medicationProductQtyUnit &&
                  !strengthUnit
                ) {
                  if (value.pt?.term !== packageProductUnit.pt?.term) {
                    return this.createError({
                      message: `Unit should be aligned with package product unit '${packageProductUnit.pt?.term}'`,
                    });
                  }
                } else if (!value && ingredient.totalQuantity?.value) {
                  return this.createError({
                    message: unitIsRequired,
                  });
                }
                return true;
              },
            ),
        })
        .optional(),
    })
    .test(
      'Validate quantity,total quantity and concentration strength',
      '',
      function (ingredient: Ingredient, context: yup.TestContext) {
        const containedProduct = this.from?.[2]
          .value as MedicationProductQuantity;
        const medicationProductQty = containedProduct.productDetails?.quantity;

        const ingTotalQty = ingredient.totalQuantity;
        const ingConcentrationStrength = ingredient.concentrationStrength;
        if (
          !medicationProductQty?.unit &&
          ingTotalQty?.unit &&
          ingConcentrationStrength?.unit
        ) {
          return this.createError({
            message:
              activeIngStrengthNumberOfFields + `(location: ${context.path})`,
            path: context.path,
          });
        } else if (
          !ingTotalQty?.unit &&
          medicationProductQty?.unit &&
          ingConcentrationStrength?.unit
        ) {
          return this.createError({
            message:
              activeIngStrengthNumberOfFields + `(location: ${context.path})`,
            path: context.path,
          });
        } else if (
          !ingConcentrationStrength?.unit &&
          medicationProductQty?.unit &&
          ingTotalQty?.unit
        ) {
          return this.createError({
            message:
              activeIngStrengthNumberOfFields + `(location: ${context.path})`,
            path: context.path,
          });
        } else if (
          medicationProductQty?.unit &&
          ingTotalQty?.unit &&
          ingConcentrationStrength?.unit
        ) {
          const concentrationStrengthUnit =
            ingConcentrationStrength?.unit.pt?.term.split('/') as string[];
          if (
            medicationProductQty.unit.pt?.term !==
              concentrationStrengthUnit[1] ||
            ingTotalQty.unit.pt?.term !== concentrationStrengthUnit[0]
          ) {
            return this.createError({
              message:
                activeIngStrengthUnitMisMatching +
                `(location: ${context.path})`,
              path: context.path,
            });
          }
          if (
            medicationProductQty.value * ingConcentrationStrength.value !==
            ingTotalQty.value
          ) {
            return this.createError({
              message:
                activeIngStrengthCalculationWrong +
                `(location: ${context.path})`,
              path: context.path,
            });
          }
        }
        return true;
      },
    ),
);

const containedProductsArray = yup.array().of(
  yup.object<MedicationProductQuantity>({
    productDetails: yup
      .object<MedicationProductDetails>({
        productName: yup
          .object<Concept>()
          .required(brandNameIsMissing)
          .defined(brandNameIsMissing),
        genericForm: yup
          .object<Concept>()
          .required(doseFormIsMissing)
          .defined(doseFormIsMissing),
        otherIdentifyingInformation: yup.string().trim().required(oiiRequired),
        quantity: yup
          .object<Quantity>({
            value: yup
              .number()
              .nullable()
              .transform((_, val: number | null) =>
                val === Number(val) ? val : null,
              )
              .when('unit', ([unit]) =>
                unit
                  ? yup.number().required().typeError(unitSizeIsRequired)
                  : yup
                      .number()
                      .nullable()
                      .transform((_, val: number | null) =>
                        val === Number(val) ? val : null,
                      )
                      .typeError(unitSizeIsRequired),
              ),
            unit: yup
              .object<Concept>()
              .test(
                'test product quantity unit',
                '',
                function (unit: Concept | undefined) {
                  if (!unit) {
                    const quantity = this.from?.[1].value as Quantity;
                    if (quantity && quantity.value) {
                      return this.createError({ message: unitIsRequired });
                    }
                  }
                  return true;
                },
              )
              .optional()
              .nullable(),
          })
          .nullable(),
        activeIngredients: ingredients,
      })
      .required(),
    unit: yup
      .object<Concept>()
      .required(unitIsRequired)
      .test('Package unit test', '', function (value: Concept) {
        // const productDetails = context.parent[
        //   'productDetails'
        // ] as MedicationProductDetails;
        const productQty = this.from?.[1].value as MedicationProductQuantity;
        const productDetails = productQty.productDetails;
        if (value) {
          if (
            productDetails?.quantity?.unit ||
            productDetails?.containerType ||
            productDetails?.deviceType
          ) {
            if (value.conceptId !== UnitEachId) {
              return this.createError({ message: unitMustBeEach });
            }
          }
          return true;
        }
      }),
    value: yup
      .number()
      .required()
      .typeError(packSize)
      .when('unit', ([unit]) =>
        unit && (unit as Concept).conceptId === UnitEachId
          ? yup
              .number()
              .integer(packSizePositiveWhole)
              .positive(packSizePositiveWhole)
              .required()
              .typeError(packSizePositiveWhole)
          : yup.number().typeError(packSize),
      ),
  }),
);
export const medicationPackageDetailsObjectSchema: yup.ObjectSchema<MedicationPackageDetails> =
  yup.object({
    productName: yup
      .object<Concept>({
        pt: yup.object<Term>({
          term: yup.string().required(brandNameIsMissing).nonNullable(),
        }),
      })
      .required(brandNameIsMissing),
    // .required(brandNameIsMissing),

    containedProducts: containedProductsArray.required(brandNameIsMissing),
    containedPackages: yup
      .array()
      .of(
        yup.object<MedicationPackageQuantity>({
          packageDetails: yup
            .object<MedicationPackageDetails>({
              productName: yup
                .object<Concept>()
                .required(brandNameIsMissing)
                .defined(brandNameIsMissing),
              containerType: yup
                .object<Concept>()
                .defined(containerTypeIsMissing)
                .required(containerTypeIsMissing),

              containedProducts:
                containedProductsArray.required(brandNameIsMissing),
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
            .required(packageQty)
            .typeError(packageQty)
            .positive(packageQty)
            .integer(packageQty),
        }),
      )
      .required(),
    containerType: yup.object<Concept>().required(containerTypeIsMissing),
    externalIdentifiers: yup.array<ExternalIdentifier>(),
  });
