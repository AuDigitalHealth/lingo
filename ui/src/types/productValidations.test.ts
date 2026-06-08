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
