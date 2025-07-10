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
  ProductBrands,
  ProductPackSizes,
  BigDecimal,
  SnowstormConceptMini,
  ProductUpdateRequest,
  ProductExternalRequesterUpdateRequest,
  ProductDescriptionUpdateRequest,
} from './product.ts';
import { Product } from './concept.ts';
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

                    const productDescriptionUpdateRequest = context.from?.[2]
                      .value as ProductDescriptionUpdateRequest;

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

                    if (!thisDescription.active) {
                      const activeSynonyms =
                        productDescriptionUpdateRequest.descriptions.filter(
                          desc => {
                            return (
                              desc.type === 'SYNONYM' && desc.active === true
                            );
                          },
                        );
                      if (activeSynonyms.length === 0) {
                        const firstLanguage = Object.keys(
                          filteredAcceptability,
                        )[Object.keys(filteredAcceptability).length - 1];
                        const errPath = `${context.path}.${firstLanguage}`;
                        return context.createError({
                          message: 'There must be at least one active synonym',
                          path: errPath,
                        });
                      }
                      return true;
                    }

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

export function uniqueFsnValidator(products: Product[]): boolean {
  if (!products) return true; // Handle undefined or null cases
  const fieldSet = new Set<string>();
  for (const product of products) {
    let fsn = '';
    if (product.concept) {
      fsn = product.concept.fsn ? product.concept.fsn.term : '';
    } else if (product.newConceptDetails) {
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
