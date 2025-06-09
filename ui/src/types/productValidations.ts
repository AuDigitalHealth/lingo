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
} from './product.ts';
import { Product } from './concept.ts';
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
  yup.object({
    externalRequesterUpdate: yup
      .object({
        externalRequestors: yup.array(),
        ticketId: yup.number().required('Ticket ID is required'),
      })
      .notRequired(),

    descriptionUpdate: yup
      .object({
        ticketId: yup.number().required('Ticket ID is required'),
        descriptions: yup
          .array()
          .of(
            yup.object({
              active: yup.boolean().required(),
              moduleId: yup.string().required(),
              released: yup.boolean().required(),
              descriptionId: yup.string(),
              term: yup.string().required('Term is required'),
              conceptId: yup.string().required(),
              typeId: yup.string().required(),
              acceptabilityMap: yup
                .object()
                .test(
                  'atLeastOneKey',
                  'At least one acceptability entry is required',
                  value => {
                    return value !== undefined && Object.keys(value).length > 0;
                  },
                )
                .required(),
              type: yup
                .mixed<'FSN' | 'SYNONYM' | 'TEXT_DEFINITION'>()
                .oneOf(['FSN', 'SYNONYM', 'TEXT_DEFINITION'])
                .required(),
              lang: yup.string().required(),
              caseSignificance: yup
                .mixed<
                  | 'ENTIRE_TERM_CASE_SENSITIVE'
                  | 'CASE_INSENSITIVE'
                  | 'INITIAL_CHARACTER_CASE_INSENSITIVE'
                >()
                .oneOf([
                  'ENTIRE_TERM_CASE_SENSITIVE',
                  'CASE_INSENSITIVE',
                  'INITIAL_CHARACTER_CASE_INSENSITIVE',
                ])
                .required(),
            }),
          )
          .required('At least one description must be provided'),
      })
      .notRequired(), // Makes the entire descriptionUpdate field optional
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
