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

import {
  BrandPackSizeCreationDetails,
  Ingredient,
  Quantity,
} from './product.ts';
import { isNewConcept } from '../utils/helpers/conceptUtils.ts';

import { FieldBindings } from './FieldBindings.ts';

import { Product } from './concept.ts';

import { showErrors, snowstormErrorHandler } from './ErrorHandler.ts';
import { ServiceStatus } from './applicationConfig.ts';
import ConceptService from '../api/ConceptService.ts';

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
    .filter(p => !isNewConcept(p))
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

export function replaceAllWithWhiteSpace(regex: RegExp, inputValue: string) {
  if (regex === null) {
    return inputValue;
  }
  regex = new RegExp(
    /[\r\n\t\f\v\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+/,
    'g',
  );
  if (regex && inputValue) {
    const returnVal = inputValue.replace(regex, '');
    return returnVal;
  }
  return inputValue;
}
