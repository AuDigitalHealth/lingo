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

import * as yup from 'yup';
import {
  BrandPackSizeCreationDetails,
  BrandWithIdentifiers,
  DevicePackageDetails,
  DeviceProductDetails,
  DeviceProductQuantity,
  ExternalIdentifier,
  Ingredient,
  MedicationPackageDetails,
  MedicationPackageQuantity,
  MedicationProductDetails,
  MedicationProductQuantity,
  ProductBrands,
  ProductPackSizes,
  Quantity,
  BigDecimal,
  SnowstormConceptMini,
  ProductUpdateRequest,
  ProductExternalRequesterUpdateRequest,
  ProductDescriptionUpdateRequest,
} from './product.ts';
import {
  Acceptability,
  Concept,
  DefinitionType,
  Description,
  Product,
  Term,
} from './concept.ts';
import {
  isEmptyObjectByValue,
  isUnitEach,
  isValidConcept,
} from '../utils/helpers/conceptUtils.ts';
import {
  calculateConcentrationStrength,
  validateConceptExistence,
  validComoOfProductIngredient,
} from './productValidationUtils.ts';
import { BulkAddExternalRequestorRequest } from './tickets/ticket.ts';
import { FieldBindings } from './FieldBindings.ts';
import { Decimal } from 'decimal.js';
import { CaseSignificance } from './concept.ts';

export const containerTypeIsMissing = 'Container type is a required field';

export const oiiRequired =
  'Other Identifying Information is a required field and should not be empty';

export const packSizeIsMissing = 'Pack size is a required field';

export const deviceTypeIsMissing = 'Device type is a required field';

const specificDeviceTypeAndNew =
  'Both Specific type and new specific name must not be populated ';
const otherParentConceptMissing =
  'The inclusion of the other parent concept is required when entering a new specific device name.';
const invalidNewSpecificDeviceName =
  'Please provide a name more than 2 characters';
const specificDeviceTypeAndNewMissing =
  'Neither the specific type nor the new specific name are present';

const specificDeviceTypeContradictsNewSpecificType =
  'When selecting a specific device type, refrain from completing fields New specific device and Other parent concept.';

const rule1 = 'One of Form, Container, or Device must be populated';
const rule1a = 'Both Device type and container must not be populated ';

const rule2 = 'If Container is populated, Form must be populated';

const rule3 = 'If Form is populated, Device must not be populated';

const rule4 = 'If Device is populated, Container must not be populated';
const rule5a = 'Value is required';
const rule5b = 'Unit is required';
const rule6 = 'Value must be a positive whole number.';
export const rule7ValueNotAlignWith = (
  totalQty: number,
  unitSize: number,
  concentrationStrngth: Decimal,
  expectedConcentration: Decimal,
) =>
  `The Unit Strength, Concentration Strength, and Unit Size values are not aligned. (Concentration Strength = Unit Strength / Unit Size). Given Unit strength = ${totalQty}, Unit size = ${unitSize} and Concentration Strength = ${concentrationStrngth.absoluteValue().toString()}, the  expected Concentration Strength is: ${expectedConcentration.absoluteValue().toString()}`;

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
export const PACK_SIZE_THRESHOLD = 2 * 20000000.0;

const PACKSIZE_EXCEEDS_THRESHOLD = `The pack size must not exceed the ${PACK_SIZE_THRESHOLD} limit`;

export const WARNING_INVALID_COMBO_STRENGTH_SIZE_AND_TOTALQTY =
  'Invalid combination for Unit size, Concentration strength and Unit Strength';

export const WARNING_PRODUCTSIZE_UNIT_NOT_ALIGNED =
  'The Unit Size Unit should match the Concentration Strength Unit denominator unit';

export const WARNING_TOTALQTY_UNIT_NOT_ALIGNED =
  'The Total Quantity Unit should match the Concentration Strength Unit numerator unit';

export const WARNING_BOSS_VALUE_NOT_ALIGNED =
  'Has active ingredient and the BoSS are not related to each other';

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

const ingredients = (
  branch: string,
  activeConceptIds: string[],
  fieldBindings: FieldBindings,
) => {
  return yup.array().of(
    yup
      .object<Ingredient>({
        activeIngredient: yup
          .object<Concept>()
          .required(rule18)
          .test('validate concept existence', (value, context) =>
            validateConceptExistence(value, branch, context, activeConceptIds),
          ),
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
              .test('validate concept existence', (value, context) =>
                validateConceptExistence(
                  value,
                  branch,
                  context,
                  activeConceptIds,
                ),
              )
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
              .test('validate concept existence', (value, context) =>
                validateConceptExistence(
                  value,
                  branch,
                  context,
                  activeConceptIds,
                ),
              )
              .nullable(),
          })
          .optional(),
        basisOfStrengthSubstance: yup
          .object<Concept>()
          .nullable()
          .test('validate rule 22', validateRule22)
          .test('validate concept existence', (value, context) =>
            validateConceptExistence(value, branch, context, activeConceptIds),
          ),
      })
      .test('Validate rule 7', '', (value, context) =>
        validateRule7(value, fieldBindings, context),
      ),
  );
};

const containedProductsArray = (
  branch: string,
  activeConceptIds: string[],
  fieldBindings: FieldBindings,
) => {
  return yup.array().of(
    yup.object<MedicationProductQuantity>({
      productDetails: yup
        .object<MedicationProductDetails>({
          productName: yup
            .object<Concept>()
            .required(rule15)
            .defined(rule15)
            .test('validate concept existence', (value, context) =>
              validateConceptExistence(
                value,
                branch,
                context,
                activeConceptIds,
              ),
            ),

          otherIdentifyingInformation: yup
            .string()
            .trim()
            .required(oiiRequired),
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
                .test('validate concept existence', (value, context) =>
                  validateConceptExistence(
                    value,
                    branch,
                    context,
                    activeConceptIds,
                  ),
                )
                .optional()
                .nullable(),
            })
            .nullable(),
          activeIngredients: ingredients(
            branch,
            activeConceptIds,
            fieldBindings,
          ),
          containerType: yup
            .object<Concept>()
            .test('validate rule 4', validateRule4)
            .test('validate concept existence', (value, context) =>
              validateConceptExistence(
                value,
                branch,
                context,
                activeConceptIds,
              ),
            )
            .nullable(),
          genericForm: yup
            .object<Concept>()
            .nullable()
            .when('containerType', ([containerType]) =>
              containerType
                ? yup.object<Concept>().required(rule2)
                : yup.object<Concept>().nullable(),
            )
            .test('validate concept existence', (value, context) =>
              validateConceptExistence(
                value,
                branch,
                context,
                activeConceptIds,
              ),
            ),
          deviceType: yup
            .object<Concept>()
            .test('validate rule 3', '', validateRule3)
            .test('validate concept existence', (value, context) =>
              validateConceptExistence(
                value,
                branch,
                context,
                activeConceptIds,
              ),
            )
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
        .test('validate concept existence', (value, context) =>
          validateConceptExistence(value, branch, context, activeConceptIds),
        )
        .nullable(),
      value: yup
        .number()
        .nullable()
        .transform((_, val: number | null) =>
          val === Number(val) ? val : null,
        )
        .when('unit', ([unit]) =>
          validateRule5And6ForPackSize(unit as Concept),
        ),
    }),
  );
};

const deviceProductArray = yup.array().of(
  yup.object<DeviceProductQuantity>({
    productDetails: yup
      .object<DeviceProductDetails>({
        productName: yup.object<Concept>().required(rule15).defined(rule15),
        otherIdentifyingInformation: yup.string().trim().optional(),
        newSpecificDeviceName: yup
          .string()
          .trim()
          .nullable()
          .test(
            'validate new specific device name',
            validateNewSpecificDeviceName,
          ),
        deviceType: yup
          .object<Concept>()
          .required(deviceTypeIsMissing)
          .defined(deviceTypeIsMissing),
        otherParentConcepts: yup.array().of(yup.object<Concept>()).nullable(),
        specificDeviceType: yup.object<Concept>().nullable(),
      })
      .test('validate product details', validateDeviceProductDetails)
      .required(),

    unit: yup
      .object<Concept>()
      .test('validate rule 5', validateRule5bPackSizeForDevice)
      .nullable(),
    value: yup
      .number()
      .nullable()
      .transform((_, val: number | null) => (val === Number(val) ? val : null))
      .when('unit', ([unit]) => validateRule5And6ForPackSize(unit as Concept)),
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
    ? validateRulePackSize(unit)
    : yup
        .number()
        .nullable()
        .transform((_, val: number | null) =>
          val === Number(val) ? val : null,
        );
}
function validateRule5And6ForPackSize(unit: Concept) {
  return unit
    ? validateRulePackSize(unit)
    : yup.number().required(packSizeIsMissing).typeError(packSizeIsMissing);
}
function validateRulePackSize(unit: Concept) {
  return unit && unit.pt?.term === 'Each'
    ? yup
        .number()
        .positive(rule6)
        .max(PACK_SIZE_THRESHOLD, PACKSIZE_EXCEEDS_THRESHOLD)
        .integer(rule6)
        .required(rule6)
        .typeError(rule6)
    : yup.number().required(rule5a).typeError(rule5a);
}
function validateRule7(
  ingredient: Ingredient,
  fieldBindings: FieldBindings,
  context: yup.TestContext,
) {
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
    const expectedConcentrationStrength = calculateConcentrationStrength(
      new Decimal(totalQuantity),
      new Decimal(productSize),
    );
    if (!expectedConcentrationStrength.equals(new Decimal(concentration))) {
      return context.createError({
        message:
          rule7ValueNotAlignWith(
            totalQuantity,
            productSize,
            new Decimal(concentration),
            expectedConcentrationStrength,
          ) + `. (location: ${context.path})`,
        path: context.path,
      });
    }
  } else {
    if (
      validComoOfProductIngredient(
        ingredient,
        containedProduct.productDetails?.quantity,
        fieldBindings,
      ) === 'invalid'
    ) {
      return context.createError({
        message:
          WARNING_INVALID_COMBO_STRENGTH_SIZE_AND_TOTALQTY +
          `(location: ${context.path})`,
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
function validateRule5bPackSize(
  unit: Concept,
  context: yup.TestContext,
  device?: boolean,
) {
  const qty = device
    ? (context.from?.[1].value as DeviceProductQuantity)
    : (context.from?.[1].value as MedicationProductQuantity);
  if (qty.value && !unit) {
    return context.createError({
      message: rule5b,
      path: context.path,
    });
  }
  return true;
}
function validateRule5bPackSizeForDevice(
  unit: Concept,
  context: yup.TestContext,
) {
  return validateRule5bPackSize(unit, context, true);
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
//TODO keep it if need in future
// function validateRule10(
//   value: number | null | undefined,
//   context: yup.TestContext,
// ) {
//   if (value === undefined || value === null) {
//     return context.createError({
//       message: packSizeIsMissing,
//       path: context.path,
//     });
//   }
//   return true;
// }

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

function validateNewSpecificDeviceName(
  newName: string | null | undefined,
  context: yup.TestContext,
) {
  const productDetails = context.from?.[0].value as DeviceProductDetails;
  if (newName && newName.trim().length < 3) {
    return context.createError({
      message: invalidNewSpecificDeviceName,
      path: context.path,
    });
  }

  if (newName && productDetails.specificDeviceType) {
    return context.createError({
      message: specificDeviceTypeAndNew,
      path: context.path,
    });
  }
  return true;
}

function validateDeviceProductDetails(
  deviceProductDetails: DeviceProductDetails,
  context: yup.TestContext,
) {
  if (deviceProductDetails && !deviceProductDetails.deviceType) {
    return context.createError({
      message: deviceTypeIsMissing,
      path: `${context.path}.deviceType`,
    });
  }
  if (
    deviceProductDetails &&
    !deviceProductDetails.newSpecificDeviceName &&
    !deviceProductDetails.specificDeviceType
  ) {
    return context.createError({
      message: specificDeviceTypeAndNewMissing,
      path: context.path,
    });
  } else if (
    deviceProductDetails &&
    deviceProductDetails.specificDeviceType &&
    (deviceProductDetails.newSpecificDeviceName ||
      (deviceProductDetails.otherParentConcepts &&
        deviceProductDetails.otherParentConcepts.length > 0))
  ) {
    if (deviceProductDetails.newSpecificDeviceName) {
      return context.createError({
        message: specificDeviceTypeContradictsNewSpecificType,
        path: `${context.path}.newSpecificDeviceName`,
      });
    }
    if (
      deviceProductDetails.otherParentConcepts &&
      deviceProductDetails.otherParentConcepts.length > 0
    ) {
      return context.createError({
        message: specificDeviceTypeContradictsNewSpecificType,
        path: `${context.path}.otherParentConcepts`,
      });
    }
  }
  if (
    deviceProductDetails &&
    deviceProductDetails.newSpecificDeviceName &&
    !(
      deviceProductDetails.otherParentConcepts &&
      deviceProductDetails.otherParentConcepts.length > 0
    )
  ) {
    return context.createError({
      message: otherParentConceptMissing,
      path: `${context.path}.otherParentConcepts`,
    });
  }
  return true;
}
export const medicationPackageDetailsObjectSchema = (
  branch: string,
  activeConceptIds: string[],
  fieldBindings: FieldBindings,
) => {
  const schema: yup.ObjectSchema<MedicationPackageDetails> = yup.object({
    productName: yup
      .object<Concept>({
        pt: yup.object<Term>({
          term: yup.string().required(rule15).nonNullable(),
        }),
      })
      .test('validate concept existence', (value, context) =>
        validateConceptExistence(value, branch, context, activeConceptIds),
      )
      .required(rule15),
    // .required(brandNameIsMissing),

    containedProducts: containedProductsArray(
      branch,
      activeConceptIds,
      fieldBindings,
    ).required(rule15),
    containedPackages: yup
      .array()
      .of(
        yup.object<MedicationPackageQuantity>({
          packageDetails: yup
            .object<MedicationPackageDetails>({
              productName: yup
                .object<Concept>()
                .required(rule15)
                .defined(rule15)
                .test('validate concept existence', (value, context) =>
                  validateConceptExistence(
                    value,
                    branch,
                    context,
                    activeConceptIds,
                  ),
                ),
              containerType: yup
                .object<Concept>()
                .defined(containerTypeIsMissing)
                .required(containerTypeIsMissing)
                .test('validate concept existence', (value, context) =>
                  validateConceptExistence(
                    value,
                    branch,
                    context,
                    activeConceptIds,
                  ),
                ),

              containedProducts: containedProductsArray(
                branch,
                activeConceptIds,
                fieldBindings,
              ).required(rule15),
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
    containerType: yup
      .object<Concept>()
      .required(rule11)
      .test('validate concept existence', (value, context) =>
        validateConceptExistence(value, branch, context, activeConceptIds),
      ),
    externalIdentifiers: yup.array<ExternalIdentifier>(),
    selectedConceptIdentifiers: yup.array().optional(),
  });
  return schema;
};

export const brandPackSizeCreationDetailsObjectSchema: yup.ObjectSchema<BrandPackSizeCreationDetails> =
  yup.object({
    productId: yup.string().required(),
    brands: yup
      .object<ProductBrands>({
        productId: yup.string().required(),
        brands: yup.object<Set<BrandWithIdentifiers>>().optional(),
      })
      .optional(),
    packSizes: yup
      .object<ProductPackSizes>({
        productId: yup.string().required(),
        unitOfMeasure: yup.object<SnowstormConceptMini>().optional(),
        packSizes: yup.object<Set<BigDecimal>>().optional(),
      })
      .optional(),
  });

export const bulkAddExternalRequestorSchema: yup.ObjectSchema<BulkAddExternalRequestorRequest> =
  yup.object({
    additionalFieldTypeName: yup
      .string()
      .required('Additional Field Type Name is required'),
    fieldValues: yup
      .array()
      .of(yup.string().required('Field value cannot be empty'))
      .required('Field Values are required')
      .min(1, 'At least one field value is required'),
    externalRequestors: yup
      .array()
      .of(yup.string().required('External Requestor cannot be empty'))
      .required('External Requestors are required')
      .min(1, 'At least one external requestor is required'),
  });

// Define the validation schema
export const productUpdateValidationSchema: yup.ObjectSchema<ProductUpdateRequest> =
  yup
    .object({
      externalRequesterUpdate: yup
        .object<ProductExternalRequesterUpdateRequest>({
          externalIdentifiers: yup
            .array<Description>()
            .of(
              yup.object({
                identifierScheme: yup.string().required(),
                identifierValue: yup.string().required(),
              }),
            )
            .required(),
        })
        .defined(),

      descriptionUpdate: yup.object<ProductDescriptionUpdateRequest>({
        descriptions: yup
          .array<Description>()
          .of(
            yup.object<Description>({
              active: yup.boolean().required(),
              moduleId: yup.string().required(),
              released: yup.boolean().required(),
              descriptionId: yup.string().optional(),
              term: yup
                .string()
                .required('Term cannot be blank')
                .test(
                  'Must not contain only a space character',
                  (value, context) => {
                    const isJustWhiteSpace = /^\s+$/.test(value);
                    if (isJustWhiteSpace) {
                      return context.createError({
                        message: 'Must not contain only white space characters',
                        path: context.path,
                      });
                    }
                    const startsWithWhiteSpace = /^\s/.test(value);
                    if (startsWithWhiteSpace) {
                      return context.createError({
                        message: 'Must not start with a whitespace character',
                        path: context.path,
                      });
                    }
                    return true;
                  },
                ),
              conceptId: yup.string().required(),
              typeId: yup.string().required(),
              acceptabilityMap: yup
                .object<Record<string, Acceptability>>()
                .test(
                  'Only One Preferred Synonym Per Language',
                  (value, context) => {
                    const thisDescription = context.from?.[1]
                      .value as Description;

                    if (!thisDescription.active) {
                      return true;
                    }

                    const thisAcceptability = value as Record<
                      string,
                      Acceptability
                    >;

                    // Filter out the key '900000000000508004' for the "not acceptable" check
                    const filteredAcceptability = Object.fromEntries(
                      Object.entries(thisAcceptability).filter(
                        ([key]) => key !== '900000000000508004',
                      ),
                    );

                    // Check if all remaining values are "NOT ACCEPTABLE"
                    const allNotAcceptable =
                      Object.keys(filteredAcceptability).length > 0 &&
                      Object.values(filteredAcceptability).every(
                        acceptability => acceptability === 'NOT ACCEPTABLE',
                      );

                    if (allNotAcceptable) {
                      // Use the last language key from the filtered acceptabilityMap for the error path
                      const firstLanguage = Object.keys(filteredAcceptability)[
                        Object.keys(filteredAcceptability).length - 1
                      ];
                      const errPath = `${context.path}.${firstLanguage}`;
                      return context.createError({
                        message:
                          "At least one term must not be 'NOT ACCEPTABLE'",
                        path: errPath,
                      });
                    }

                    const productDescriptionUpdateRequest = context.from?.[2]
                      .value as ProductDescriptionUpdateRequest;

                    if (
                      thisDescription.active &&
                      thisDescription.type === 'FSN'
                    ) {
                      const preferredCounter: Record<string, number> = {};
                      const descriptions =
                        productDescriptionUpdateRequest.descriptions;

                      descriptions.forEach(desc => {
                        if (
                          desc.type === 'FSN' &&
                          desc.active === true &&
                          desc.acceptabilityMap
                        ) {
                          Object.keys(desc.acceptabilityMap)
                            .filter(key => key !== '900000000000508004')
                            .forEach(key => {
                              if (desc.acceptabilityMap) {
                                if (!preferredCounter[key]) {
                                  preferredCounter[key] = 0;
                                }
                                if (
                                  desc.acceptabilityMap[key] === 'PREFERRED'
                                ) {
                                  preferredCounter[key] += 1;
                                }
                              }
                            });
                        }
                      });

                      let onlyOneFail = false;
                      let exactlyOneFail = false;
                      let errPath = '';

                      Object.entries(preferredCounter).forEach(
                        ([language, count]) => {
                          if (count > 1) {
                            onlyOneFail = true;
                            errPath = `${context.path}.${language}`;
                          }
                          if (count === 0) {
                            exactlyOneFail = true;
                            errPath = `${context.path}.${language}`;
                          }
                        },
                      );

                      if (onlyOneFail) {
                        return context.createError({
                          message: `Only one FSN can be preferred per language.`,
                          path: errPath,
                        });
                      }

                      if (exactlyOneFail) {
                        return context.createError({
                          message: `One FSN must be preferred for each language.`,
                          path: errPath,
                        });
                      }
                    }

                    const preferredCounter: Record<string, number> = {};
                    const descriptions =
                      productDescriptionUpdateRequest.descriptions;

                    descriptions.forEach(desc => {
                      if (
                        desc.type === 'SYNONYM' &&
                        desc.active === true &&
                        desc.acceptabilityMap
                      ) {
                        Object.keys(desc.acceptabilityMap)
                          .filter(key => key !== '900000000000508004') // Filter out the specific key
                          .forEach(key => {
                            if (desc.acceptabilityMap) {
                              if (!preferredCounter[key]) {
                                preferredCounter[key] = 0;
                              }
                              if (desc.acceptabilityMap[key] === 'PREFERRED') {
                                preferredCounter[key] += 1;
                              }
                            }
                          });
                      }
                    });

                    let onlyOneFail = false;
                    let exactlyOneFail = false;
                    let errPath = '';

                    Object.entries(preferredCounter).forEach(
                      ([language, count]) => {
                        if (count > 1) {
                          onlyOneFail = true;
                          errPath = `${context.path}.${language}`;
                        }
                        if (count === 0) {
                          exactlyOneFail = true;
                          errPath = `${context.path}.${language}`;
                        }
                      },
                    );

                    if (onlyOneFail) {
                      return context.createError({
                        message: `Only one synonym can be preferred per language.`,
                        path: errPath,
                      });
                    }

                    if (exactlyOneFail) {
                      return context.createError({
                        message: `One synonym must be preferred for each language.`,
                        path: errPath,
                      });
                    }

                    return true;
                  },
                )
                .optional(),
              type: yup
                .string()
                .test('Exactly One Active Fsn', (value, context) => {
                  // Get all descriptions from the form
                  const productDescriptionUpdateRequest = context.from?.[1]
                    .value as ProductDescriptionUpdateRequest;
                  const descriptions =
                    productDescriptionUpdateRequest.descriptions;

                  // Count active FSNs
                  let activeFsnCount = 0;
                  descriptions.forEach(desc => {
                    if (desc.type === DefinitionType.FSN && desc.active) {
                      activeFsnCount += 1;
                    }
                  });

                  // The current description we're validating
                  const thisDescription = context.from?.[0]
                    .value as Description;

                  // If this is an active FSN being changed to something else, check if it's the only FSN
                  if (
                    thisDescription.type !== DefinitionType.FSN &&
                    value === DefinitionType.FSN &&
                    thisDescription.active
                  ) {
                    // If we're adding a new FSN and there's already one, that's an error
                    if (activeFsnCount >= 1) {
                      return context.createError({
                        message: 'Can only be one active FSN',
                        path: context.path,
                      });
                    }
                  }
                  // If this is an FSN being deactivated, check that there's another active FSN
                  else if (
                    thisDescription.type === DefinitionType.FSN &&
                    !thisDescription.active
                  ) {
                    if (activeFsnCount === 0) {
                      return context.createError({
                        message: 'Must have at least one active FSN',
                        path: context.path,
                      });
                    }
                  }
                  // If this is the only FSN and it's active, make sure it remains FSN
                  else if (
                    thisDescription.type === DefinitionType.FSN &&
                    thisDescription.active
                  ) {
                    if (activeFsnCount === 1 && value !== DefinitionType.FSN) {
                      return context.createError({
                        message: 'Must have at least one active FSN',
                        path: context.path,
                      });
                    }
                  }

                  // If we're not changing anything FSN-related, still validate the global state
                  if (activeFsnCount > 1) {
                    return context.createError({
                      message: 'Can only be one active FSN',
                      path: context.path,
                    });
                  }

                  if (activeFsnCount === 0) {
                    return context.createError({
                      message: 'Must have at least one active FSN',
                      path: context.path,
                    });
                  }

                  return true;
                }),
              lang: yup.string().required(),
              caseSignificance: yup
                .string<CaseSignificance>()
                .oneOf(
                  [
                    CaseSignificance.ENTIRE_TERM_CASE_SENSITIVE,
                    CaseSignificance.CASE_INSENSITIVE,
                    CaseSignificance.INITIAL_CHARACTER_CASE_INSENSITIVE,
                  ],
                  'Invalid case significance value',
                )
                .required('Case significance is required'),
            }),
          )

          .required(),
      }),
    })
    .defined();

export const devicePackageDetailsObjectSchema: yup.ObjectSchema<DevicePackageDetails> =
  yup.object({
    productName: yup
      .object<Concept>({
        pt: yup.object<Term>({
          term: yup.string().required(rule15).nonNullable(),
        }),
      })
      .required(rule15),

    containedProducts: deviceProductArray.required(),
    containedPackages: yup.array().optional().nullable(),
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
