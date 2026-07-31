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

import { resetDiscriminators } from './validationHelper.ts';
import { BrandedProductNamePrefill } from '../widgets/BrandedProductNameWidget.tsx';

/**
 * A blank suggestion is no suggestion. The backend can answer 200 with an empty string;
 * treating that as a real suggestion puts the prefill state into 'suggested' with nothing
 * to seed, which renders neither the field value nor any helper hint (CUST1737896).
 */
export function normaliseBrandedProductNameSuggestion(
  value: unknown,
): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * Applies the ticket's branded-product-name suggestion directly to loaded package details,
 * so a draft opened from the ticket mounts with the field already populated instead of
 * relying on a post-mount widget write that queues behind the initial render.
 *
 * Pure: returns the input unchanged (same reference) when there is nothing to seed.
 */
export function seedBrandedProductNamePrefill(
  packageDetails: any,
  prefill: BrandedProductNamePrefill,
): any {
  const value =
    prefill?.status === 'suggested'
      ? normaliseBrandedProductNameSuggestion(prefill.value)
      : null;
  if (!value) {
    return packageDetails;
  }
  const index = prefill.index ?? 0;
  const products = packageDetails?.containedProducts;
  const details = Array.isArray(products)
    ? products[index]?.productDetails
    : undefined;
  if (!details || details.brandedProductName) {
    return packageDetails;
  }
  const newProducts = products.slice();
  newProducts[index] = {
    ...products[index],
    productDetails: { ...details, brandedProductName: value },
  };
  return { ...packageDetails, containedProducts: newProducts };
}

/**
 * Normalises ticket-product package details at load time: coerces stale oneOf
 * discriminators to currently-valid options (drafts saved under an older schema can carry
 * combinations like variant=medication + productType=noIngredients, whose mid-session
 * correction on the first form change triggers a full oneOf branch switch and re-render
 * storm — CUST1737896), then seeds the branded-product-name suggestion into the data.
 */
export function normaliseLoadedPackageDetails(
  schema: any,
  uiSchema: any,
  packageDetails: any,
  prefill: BrandedProductNamePrefill,
): any {
  const normalised =
    schema && uiSchema
      ? resetDiscriminators(schema, packageDetails, uiSchema)
      : packageDetails;
  return seedBrandedProductNamePrefill(normalised, prefill);
}
