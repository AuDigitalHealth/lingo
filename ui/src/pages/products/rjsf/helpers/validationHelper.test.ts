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
import { cloneDeep } from 'lodash';
import { resetDiscriminators } from './validationHelper.ts';
import medicationSchema from './__fixtures__/nmpc-base-medication-schema.json';
import medicationUiSchema from './__fixtures__/nmpc-base-medication-ui-schema.json';

/**
 * A draft that is already normalised against the current schema: valid
 * variant/productType discriminator pair and type synced to variant.
 */
const normalisedDraft = () => ({
  variant: 'medication',
  containedProducts: [
    {
      productDetails: {
        type: 'medication',
        productType: 'presentationStrength',
        productName: { conceptId: '68000101', pt: { term: 'BigBrand' } },
        brandedProductName: 'BigBrand 5 mg film-coated tablets',
      },
    },
  ],
});

/** The CUST1737896 shape: stale productType saved under an older schema. */
const staleDraft = () => {
  const draft = normalisedDraft();
  draft.containedProducts[0].productDetails.productType = 'noIngredients';
  return draft;
};

describe('resetDiscriminators', () => {
  it('returns the input by reference when nothing needs resetting', () => {
    // The per-change fast path (#1932): change events that do not move a
    // discriminator (e.g. keystrokes) must not pay a cloneDeep of the whole
    // package details, and must keep object identity stable for React.
    const draft = normalisedDraft();
    const result = resetDiscriminators(
      medicationSchema,
      draft,
      medicationUiSchema,
    );

    expect(result).toBe(draft);
  });

  it('returns the input by reference after a keystroke-style text change', () => {
    const draft = normalisedDraft();
    draft.containedProducts[0].productDetails.brandedProductName =
      'BigBrand 5 mg film-coated tablets X';

    expect(
      resetDiscriminators(medicationSchema, draft, medicationUiSchema),
    ).toBe(draft);
  });

  it('coerces a stale productType discriminator without mutating the input', () => {
    const input = staleDraft();
    const inputSnapshot = cloneDeep(input);

    const result = resetDiscriminators(
      medicationSchema,
      input,
      medicationUiSchema,
    );

    expect(result).not.toBe(input);
    expect(result.containedProducts[0].productDetails.productType).toBe(
      'presentationStrength',
    );
    // untouched fields survive the reset
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      'BigBrand 5 mg film-coated tablets',
    );
    expect(input).toEqual(inputSnapshot);
  });

  it('re-syncs a productDetails type that diverged from the variant', () => {
    const input = normalisedDraft();
    input.containedProducts[0].productDetails.type = 'vaccine';

    const result = resetDiscriminators(
      medicationSchema,
      input,
      medicationUiSchema,
    );

    expect(result).not.toBe(input);
    expect(result.containedProducts[0].productDetails.type).toBe('medication');
  });

  it('seeds the default variant on empty form data', () => {
    const result = resetDiscriminators(
      medicationSchema,
      {},
      medicationUiSchema,
    );

    expect(result.variant).toBe('medication');
  });

  it('is idempotent: a second pass takes the fast path', () => {
    const first = resetDiscriminators(
      medicationSchema,
      staleDraft(),
      medicationUiSchema,
    );
    const second = resetDiscriminators(
      medicationSchema,
      first,
      medicationUiSchema,
    );

    expect(second).toBe(first);
  });
});
