import {
  DefinitionStatus,
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
export function extractSemanticTag(input: string): string | null {
  // Use a regular expression to find substrings in the format "(xyz)"
  const matches = input.match(/\(.*?\)/g);

  // Return the last match, or null if no matches are found
  return matches ? matches[matches.length - 1] : null;
}
