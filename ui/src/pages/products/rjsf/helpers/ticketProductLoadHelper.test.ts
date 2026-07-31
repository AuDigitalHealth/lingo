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

import { describe, expect, it } from 'vitest';
import {
  normaliseBrandedProductNameSuggestion,
  normaliseLoadedPackageDetails,
  seedBrandedProductNamePrefill,
} from './ticketProductLoadHelper.ts';
import medicationSchema from './__fixtures__/nmpc-base-medication-schema.json';
import medicationUiSchema from './__fixtures__/nmpc-base-medication-ui-schema.json';

const SUGGESTION = 'Linagliptin Clonmel 5 mg film-coated tablets';

/**
 * Shape of the CUST1737896 prod draft (ticket product 746 on NMPC-008035): a robot-created
 * medication draft saved before the current schema, carrying the now-invalid
 * variant=medication + productType=noIngredients combination and no brandedProductName.
 */
const staleDraft = () => ({
  variant: 'medication',
  containedProducts: [
    {
      productDetails: {
        type: 'medication',
        productType: 'noIngredients',
        productName: { conceptId: null, pt: { term: SUGGESTION } },
      },
    },
  ],
});

const currentDraft = () => {
  const draft = staleDraft();
  draft.containedProducts[0].productDetails.productType =
    'presentationStrength';
  return draft;
};

const suggested = (value: string = SUGGESTION, index = 0) => ({
  status: 'suggested' as const,
  value,
  index,
});

describe('seedBrandedProductNamePrefill', () => {
  it('seeds an empty brandedProductName from the ticket suggestion', () => {
    const input = currentDraft();
    const result = seedBrandedProductNamePrefill(input, suggested());

    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      SUGGESTION,
    );
    // input must not be mutated
    expect(input.containedProducts[0].productDetails).not.toHaveProperty(
      'brandedProductName',
    );
  });

  it('does not overwrite an existing brandedProductName', () => {
    const input = currentDraft() as any;
    input.containedProducts[0].productDetails.brandedProductName = 'Existing';

    const result = seedBrandedProductNamePrefill(input, suggested());

    expect(result).toBe(input);
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      'Existing',
    );
  });

  it('is a no-op when there is no suggestion', () => {
    const input = currentDraft();
    expect(seedBrandedProductNamePrefill(input, { status: 'none' })).toBe(
      input,
    );
    expect(
      seedBrandedProductNamePrefill(input, { status: 'empty', index: 0 }),
    ).toBe(input);
  });

  it('is a no-op for a blank suggestion', () => {
    const input = currentDraft();
    expect(seedBrandedProductNamePrefill(input, suggested(' '))).toBe(input);
    expect(seedBrandedProductNamePrefill(input, suggested(''))).toBe(input);
  });

  it('seeds only the contained product at the prefill index', () => {
    const input = currentDraft() as any;
    input.containedProducts.push({
      productDetails: {
        type: 'medication',
        productType: 'presentationStrength',
      },
    });

    const result = seedBrandedProductNamePrefill(
      input,
      suggested(SUGGESTION, 1),
    );

    expect(result.containedProducts[0].productDetails).not.toHaveProperty(
      'brandedProductName',
    );
    expect(result.containedProducts[1].productDetails.brandedProductName).toBe(
      SUGGESTION,
    );
  });

  it('tolerates a draft without contained products', () => {
    const input = { variant: 'medication' };
    expect(seedBrandedProductNamePrefill(input, suggested())).toBe(input);
  });
});

describe('normaliseLoadedPackageDetails', () => {
  it('coerces a stale productType discriminator to a valid option before mount', () => {
    // variant=medication no longer allows noIngredients; loading it raw makes the first
    // form change flip the oneOf branch mid-session (the CUST1737896 render storm).
    const result = normaliseLoadedPackageDetails(
      medicationSchema,
      medicationUiSchema,
      staleDraft(),
      { status: 'none' },
    );

    expect(result.containedProducts[0].productDetails.productType).toBe(
      'presentationStrength',
    );
  });

  it('leaves a valid productType discriminator alone', () => {
    const result = normaliseLoadedPackageDetails(
      medicationSchema,
      medicationUiSchema,
      currentDraft(),
      { status: 'none' },
    );

    expect(result.containedProducts[0].productDetails.productType).toBe(
      'presentationStrength',
    );
    expect(result.containedProducts[0].productDetails.productName.pt.term).toBe(
      SUGGESTION,
    );
  });

  it('normalises the discriminator and seeds the suggestion together', () => {
    const result = normaliseLoadedPackageDetails(
      medicationSchema,
      medicationUiSchema,
      staleDraft(),
      suggested(),
    );

    expect(result.containedProducts[0].productDetails.productType).toBe(
      'presentationStrength',
    );
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      SUGGESTION,
    );
  });

  it('still seeds when schema or uiSchema are not yet available', () => {
    const result = normaliseLoadedPackageDetails(
      undefined,
      undefined,
      staleDraft(),
      suggested(),
    );

    expect(result.containedProducts[0].productDetails.productType).toBe(
      'noIngredients',
    );
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      SUGGESTION,
    );
  });
});

describe('normaliseBrandedProductNameSuggestion', () => {
  it('passes a real name through', () => {
    expect(normaliseBrandedProductNameSuggestion(SUGGESTION)).toBe(SUGGESTION);
  });

  it('maps blank and missing values to null', () => {
    // The backend can (and historically did) answer 200 with an empty string; treating it as
    // a real suggestion produced a silent dead state: no seed and no helper hint (CUST1737896).
    expect(normaliseBrandedProductNameSuggestion('')).toBeNull();
    expect(normaliseBrandedProductNameSuggestion('   ')).toBeNull();
    expect(normaliseBrandedProductNameSuggestion(null)).toBeNull();
    expect(normaliseBrandedProductNameSuggestion(undefined)).toBeNull();
  });
});
