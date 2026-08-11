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

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Product } from './concept.ts';
import { NonDefiningProperty, NonDefiningPropertyType } from './product.ts';
import {
  collectReferencedConceptIds,
  collectUnresolvedReferences,
  validateProductSummaryNodes,
} from './productValidationUtils.ts';
import useAuthoringStore from '../stores/AuthoringStore.ts';
import { showErrors } from './ErrorHandler.ts';

// Hoisted so the mock factory below (which vitest lifts above the imports) can close over it, and
// so tests drive the mock through this handle rather than reading the method back off the module
// object — the latter trips @typescript-eslint/unbound-method.
const mocks = vi.hoisted(() => ({
  getFilteredConceptIdsByBatches: vi.fn(),
}));

vi.mock('../api/ConceptService.ts', () => ({
  default: {
    getFilteredConceptIdsByBatches: mocks.getFilteredConceptIdsByBatches,
  },
}));

vi.mock('./ErrorHandler.ts', () => ({
  showErrors: vi.fn(() => 'errors-key'),
  snowstormErrorHandler: vi.fn(() => 'snowstorm-key'),
}));

// Extension (long form) SCTIDs — namespace 1000220. These are the identifiers that can exist on
// one task branch and be absent from another.
const MAH_TARGET = '968081000220105';
const EXTENSION_PARENT = '1025181000220103';

function mahProperty(
  overrides: Partial<NonDefiningProperty> = {},
): NonDefiningProperty {
  return {
    title: 'Has marketing authorisation holder',
    identifierScheme: 'mah',
    identifier: '680061000220102',
    relationshipType: 'ADDITIONAL_RELATIONSHIP',
    type: NonDefiningPropertyType.NON_DEFINING_PROPERTY,
    valueObject: {
      conceptId: MAH_TARGET,
      pt: { term: 'Sandoz', lang: 'en' },
    },
    ...overrides,
  } as NonDefiningProperty;
}

function node(overrides: Partial<Product> = {}): Product {
  return {
    conceptId: '-42',
    newConcept: true,
    concept: null,
    newConceptDetails: null,
    ...overrides,
  } as Product;
}

describe('collectReferencedConceptIds', () => {
  it('collects a non-defining property target in the extension namespace', () => {
    // The reported failure: a marketing authorisation holder resolved against the task the
    // product was originally saved on, replayed verbatim onto a different task.
    const referenced = collectReferencedConceptIds([
      node({ nonDefiningProperties: [mahProperty()] }),
    ]);

    expect([...referenced.keys()]).toEqual([MAH_TARGET]);
    expect(referenced.get(MAH_TARGET)).toContain('Sandoz');
  });

  it('excludes external identifier properties, whose value is not a concept on this branch', () => {
    const referenced = collectReferencedConceptIds([
      node({
        nonDefiningProperties: [
          mahProperty({ type: NonDefiningPropertyType.EXTERNAL_IDENTIFIER }),
        ],
      }),
    ]);

    expect(referenced.size).toBe(0);
  });

  it('collects defining axiom targets of concepts being created', () => {
    const referenced = collectReferencedConceptIds([
      node({
        newConceptDetails: {
          axioms: [
            {
              relationships: [
                { active: true, destinationId: EXTENSION_PARENT },
                // Concrete values have no target.
                { active: true, concreteValue: { value: '10' } },
                // Inactive relationships are not written.
                { active: false, destinationId: '999991000220107' },
              ],
            },
          ],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      }),
    ]);

    expect([...referenced.keys()]).toEqual([EXTENSION_PARENT]);
  });

  it('excludes placeholder ids and siblings this same save is creating', () => {
    // A reference to a sibling node is satisfied by the create itself, not by the branch.
    const sibling = node({ conceptId: EXTENSION_PARENT, newConcept: true });
    const referencing = node({
      newConceptDetails: {
        axioms: [
          {
            relationships: [
              { active: true, destinationId: EXTENSION_PARENT },
              { active: true, destinationId: '-99' },
            ],
          },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    expect(collectReferencedConceptIds([sibling, referencing]).size).toBe(0);
  });

  it('excludes a sibling pinned to a specified concept id', () => {
    // specifiedConceptId is never copied onto product.conceptId — that stays the placeholder — so
    // it has to be gathered separately or a reference to a pinned sibling looks like a missing
    // dependency and blocks a valid save.
    const pinnedSibling = node({
      conceptId: '-99',
      newConcept: true,
      newConceptDetails: {
        specifiedConceptId: EXTENSION_PARENT,
        axioms: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    const referencing = node({
      nonDefiningProperties: [
        mahProperty({
          valueObject: {
            conceptId: EXTENSION_PARENT,
            pt: { term: 'x', lang: 'en' },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any),
      ],
    });

    expect(collectReferencedConceptIds([pinnedSibling, referencing]).size).toBe(
      0,
    );
  });

  it('excludes international targets, which cannot be missing from a task branch', () => {
    const referenced = collectReferencedConceptIds([
      node({
        nonDefiningProperties: [
          mahProperty({
            // Long form international id — exercises the partition digit, not just the length.
            valueObject: {
              conceptId: '900000000000207008',
              pt: { term: 'core module', lang: 'en' },
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any),
        ],
      }),
    ]);

    expect(referenced.size).toBe(0);
  });

  it('ignores a property whose value never resolved to a concept', () => {
    const referenced = collectReferencedConceptIds([
      node({
        nonDefiningProperties: [
          mahProperty({
            valueObject: {
              pt: { term: 'typed but never selected', lang: 'en' },
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any),
        ],
      }),
    ]);

    expect(referenced.size).toBe(0);
  });
});

describe('collectUnresolvedReferences', () => {
  it('reports a concept-valued property holding a term with no concept id', () => {
    // handleBlur commits typed text as a term with no conceptId so the search can be resumed.
    // Without this check the unresolved value reaches the create.
    const unresolved = collectUnresolvedReferences([
      node({
        nonDefiningProperties: [
          mahProperty({
            valueObject: { pt: { term: 'Sandoz GmbH', lang: 'en' } },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any),
        ],
      }),
    ]);

    expect(unresolved).toHaveLength(1);
    expect(unresolved[0]).toContain('Sandoz GmbH');
  });

  it('does not report a properly resolved value', () => {
    expect(
      collectUnresolvedReferences([
        node({ nonDefiningProperties: [mahProperty()] }),
      ]),
    ).toEqual([]);
  });
});

describe('validateProductSummaryNodes - missingConceptIds bookkeeping', () => {
  // An existing (non-new) node, so there is always something to look up.
  const existing = () =>
    node({
      conceptId: MAH_TARGET,
      newConcept: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      concept: { conceptId: MAH_TARGET, pt: { term: 'Sandoz' } } as any,
    });

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthoringStore.getState().setMissingConceptIds(['stale-from-last-run']);
  });

  it('records the ids the lookup reports as absent', async () => {
    mocks.getFilteredConceptIdsByBatches.mockResolvedValue([]);

    await validateProductSummaryNodes([existing()], 'MAIN/TASK', undefined);

    expect(useAuthoringStore.getState().missingConceptIds).toEqual([
      MAH_TARGET,
    ]);
  });

  it('clears stale ids when the lookup fails rather than leaving fields flagged', async () => {
    // Reachable now that getFilteredConceptIdsByBatches propagates instead of returning [].
    mocks.getFilteredConceptIdsByBatches.mockRejectedValue(
      new Error('snowstorm unavailable'),
    );

    await validateProductSummaryNodes([existing()], 'MAIN/TASK', undefined);

    expect(useAuthoringStore.getState().missingConceptIds).toEqual([]);
  });

  it('still blocks when the snackbar layer returns no key', async () => {
    // The callers treat a truthy return as "blocked". If that were the raw snackbar key, a
    // notification layer that returned nothing would wave through a save with known-missing
    // dependencies — exactly what this validation exists to stop.
    vi.mocked(showErrors).mockReturnValueOnce(
      undefined as unknown as ReturnType<typeof showErrors>,
    );
    mocks.getFilteredConceptIdsByBatches.mockResolvedValue([]);

    const result = await validateProductSummaryNodes(
      [existing()],
      'MAIN/TASK',
      undefined,
    );

    expect(result).toBeTruthy();
  });

  it('clears stale ids when everything resolves', async () => {
    mocks.getFilteredConceptIdsByBatches.mockResolvedValue([MAH_TARGET]);

    await validateProductSummaryNodes([existing()], 'MAIN/TASK', undefined);

    expect(useAuthoringStore.getState().missingConceptIds).toEqual([]);
  });
});
