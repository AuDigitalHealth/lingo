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
  DefinitionStatus,
  Description,
  Product,
  Product7BoxBGColour,
} from '../../types/concept.ts';
import {
  getBulkAuthorBrandOptions,
  getBulkAuthorPackSizeOptions,
} from '../../hooks/api/tickets/useTicketProduct.tsx';
import { queryClient } from 'ecl-builder/lib/queryClient';
import {
  bulkAuthorBrands,
  bulkAuthorPackSizes,
} from '../../types/queryKeys.ts';
import { cloneDeep } from 'lodash';
export function isNameContainsKeywords(name: string, keywords: string[]) {
  return keywords.some(substring =>
    name.toLowerCase().includes(substring.toLowerCase()),
  );
}
export const getColorByDefinitionStatus = (
  product: Product,
  optionsIgnored: boolean,
  partialNameCheckKeywords: string[],
  nameGeneratorErrorKeywords: string[],
): string => {
  if (
    product.conceptOptions &&
    product.conceptOptions.length > 0 &&
    product.concept === null &&
    !optionsIgnored
  ) {
    return Product7BoxBGColour.INVALID;
  }
  if (
    product.conceptOptions &&
    product.conceptOptions.length > 0 &&
    product.concept === null &&
    optionsIgnored
  ) {
    return Product7BoxBGColour.NEW;
  }
  if (product.newConcept) {
    if (
      (product.fullySpecifiedName &&
        isNameContainsKeywords(
          product.fullySpecifiedName.trim(),
          nameGeneratorErrorKeywords,
        )) ||
      (product.preferredTerm &&
        isNameContainsKeywords(
          product.preferredTerm.trim(),
          nameGeneratorErrorKeywords,
        ))
    ) {
      return Product7BoxBGColour.INVALID;
    } else if (
      (product.fullySpecifiedName &&
        isNameContainsKeywords(
          product.fullySpecifiedName.trim(),
          partialNameCheckKeywords,
        )) ||
      (product.preferredTerm &&
        isNameContainsKeywords(
          product.preferredTerm.trim(),
          partialNameCheckKeywords,
        ))
    ) {
      return Product7BoxBGColour.INCOMPLETE;
    }
    return Product7BoxBGColour.NEW;
  }
  return product.concept?.definitionStatus === DefinitionStatus.Primitive
    ? Product7BoxBGColour.PRIMITIVE
    : Product7BoxBGColour.FULLY_DEFINED;
};
export const invalidateBulkActionQueriesById = (
  conceptId: string,
  branch: string,
) => {
  const bulkPackSizeQuery = getBulkAuthorPackSizeOptions(
    conceptId,
    branch,
  ).queryKey;
  void queryClient.invalidateQueries({ queryKey: bulkPackSizeQuery });
  const bulkBrandQuery = getBulkAuthorBrandOptions(conceptId, branch).queryKey;
  void queryClient.invalidateQueries({ queryKey: bulkBrandQuery });
};

export const invalidateBulkActionQueries = () => {
  void queryClient.invalidateQueries({
    queryKey: [bulkAuthorPackSizes],
    exact: false,
  });
  void queryClient.invalidateQueries({
    queryKey: [bulkAuthorBrands],
    exact: false,
  });
};
export const getProductViewUrl = () => {
  if (
    location &&
    location.pathname &&
    location.pathname.endsWith('/product/edit')
  ) {
    //handle from edit screen
    return location.pathname.replace('/product/edit', '/product/view');
  }
  return 'view';
};

export function extractSemanticTag(
  input: string | null | undefined,
): string | undefined {
  if (!input) {
    return undefined; // Or return null, or an empty string "" depending on your desired behavior
  }

  // Use a regular expression to find the last substring in the format "(xyz)" at the end of the string
  const match = input.match(/\([^()]+\)\s*$/); // Correct regex to include parentheses

  // Return the entire match (including the parentheses), or undefined if no match is found
  return match ? match[0] : undefined;
}

export const removeDescriptionSemanticTag = (desc: Description) => {
  const description = cloneDeep(desc);
  const containsSemanticTag = extractSemanticTag(description?.term)
    ?.trim()
    .toLocaleLowerCase();

  const escapedSemanticTag = containsSemanticTag
    ? containsSemanticTag.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    : undefined;

  const termWithoutTag =
    description?.term && escapedSemanticTag
      ? description.term
          .replace(new RegExp(`\\s*${escapedSemanticTag}\\s*$`, 'i'), '')
          .trim()
      : description?.term || '';

  description.term = termWithoutTag;
  return description;
};

export const removeSemanticTagFromTerm = (term: string | undefined) => {
  const containsSemanticTag = extractSemanticTag(term)
    ?.trim()
    .toLocaleLowerCase();

  const escapedSemanticTag = containsSemanticTag
    ? containsSemanticTag.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    : undefined;

  const termWithoutTag =
    term && escapedSemanticTag
      ? term
          .replace(new RegExp(`\\s*${escapedSemanticTag}\\s*$`, 'i'), '')
          .trim()
      : term || '';

  return termWithoutTag !== '' ? termWithoutTag : undefined;
};
