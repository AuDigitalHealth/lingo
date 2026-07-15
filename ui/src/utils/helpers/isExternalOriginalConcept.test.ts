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
import { isExternalOriginalConcept } from './conceptUtils';
import { Product } from '../../types/concept';

function productFixture(overrides: {
  externalConcept?: boolean;
  referencedByOtherProducts?: boolean;
  hasOriginalNode?: boolean;
}): Product {
  const base: Partial<Product> = {
    label: 'VMP',
    displayName: 'Virtual Medicinal Product',
    concept: null,
    newConceptDetails: null,
    conceptOptions: [],
    newConcept: false,
    conceptId: '-1',
    newInTask: false,
    newInProject: false,
    propertyUpdate: false,
    statedFormChanged: null,
    inferredFormChanged: null,
    hasUnknownCodes: null,
    originalNode:
      overrides.hasOriginalNode === false
        ? null
        : ({
            conceptId: '1296676008',
            node: null,
            inactivationReason: null,
            referencedByOtherProducts:
              overrides.referencedByOtherProducts ?? false,
            externalConcept: overrides.externalConcept ?? false,
          } as unknown as Product['originalNode']),
  };
  return base as Product;
}

describe('isExternalOriginalConcept', () => {
  it('returns truthy when externalConcept is true and not referenced by other products', () => {
    expect(
      isExternalOriginalConcept(productFixture({ externalConcept: true })),
    ).toBeTruthy();
  });

  it('returns falsy when externalConcept is false', () => {
    expect(
      isExternalOriginalConcept(productFixture({ externalConcept: false })),
    ).toBeFalsy();
  });

  it('returns falsy when external but also referenced by other products', () => {
    // referencedByOtherProducts dominates — the original concept is left untouched in this case
    // so the replace-without-retire path must not fire.
    expect(
      isExternalOriginalConcept(
        productFixture({
          externalConcept: true,
          referencedByOtherProducts: true,
        }),
      ),
    ).toBeFalsy();
  });

  it('returns falsy when there is no originalNode', () => {
    expect(
      isExternalOriginalConcept(productFixture({ hasOriginalNode: false })),
    ).toBeFalsy();
  });
});
