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

import { Description } from './concept.ts';
import { productUpdateValidationSchema } from './productValidations.ts';

const DUPLICATE_MESSAGE =
  'Another active description with the same term, type and language already exists on this concept.';

const SYNONYM_TYPE_ID = '900000000000013009';

function description(overrides: Partial<Description>): Description {
  return {
    active: true,
    moduleId: '11000168105',
    released: true,
    term: 'placeholder',
    conceptId: '111000168105',
    typeId: SYNONYM_TYPE_ID,
    type: 'SYNONYM',
    lang: 'en',
    acceptabilityMap: {},
    caseSignificance: 'CASE_INSENSITIVE',
    ...overrides,
  } as Description;
}

async function collectErrors(descriptions: Description[]): Promise<string[]> {
  try {
    await productUpdateValidationSchema.validate(
      {
        ticketId: 1,
        conceptId: '111000168105',
        descriptionUpdate: { descriptions },
      },
      { abortEarly: false },
    );
    return [];
  } catch (error) {
    return (error as { errors?: string[] }).errors ?? [];
  }
}

describe('productUpdateValidationSchema - no-duplicate-active-term', () => {
  it('rejects two active descriptions with the same term, type and language', async () => {
    const errors = await collectErrors([
      description({ descriptionId: '1', term: 'Foo 5 mg' }),
      description({ descriptionId: '2', term: 'Foo 5 mg' }),
    ]);

    expect(errors).toContain(DUPLICATE_MESSAGE);
  });

  it('allows active descriptions with distinct terms', async () => {
    const errors = await collectErrors([
      description({ descriptionId: '1', term: 'Foo 5 mg' }),
      description({ descriptionId: '2', term: 'Foo 10 mg' }),
    ]);

    expect(errors).not.toContain(DUPLICATE_MESSAGE);
  });

  it('does not flag a matching term on an inactive description', async () => {
    const errors = await collectErrors([
      description({ descriptionId: '1', term: 'Foo 5 mg', active: true }),
      description({ descriptionId: '2', term: 'Foo 5 mg', active: false }),
    ]);

    expect(errors).not.toContain(DUPLICATE_MESSAGE);
  });
});
