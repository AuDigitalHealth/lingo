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
  NonDefiningPropertyType,
  Quantity,
} from './product.ts';
import { isNewConcept } from '../utils/helpers/conceptUtils.ts';

import { FieldBindings } from './FieldBindings.ts';

import { Description, Product } from './concept.ts';

import { showErrors, snowstormErrorHandler } from './ErrorHandler.ts';
import { ServiceStatus } from './applicationConfig.ts';
import ConceptService from '../api/ConceptService.ts';
import useAuthoringStore from '../stores/AuthoringStore.ts';

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
 * True for a long form (extension) SCTID. The two digits before the check digit are the partition
 * identifier; the first of them is '1' when the identifier carries a namespace and '0' for
 * international content. Only extension content can be present on one task branch and absent from
 * another, so international ids are not worth a lookup. Mirrors `isExtensionConceptId` in
 * ProductCreationService.
 */
function isExtensionConceptId(conceptId: string): boolean {
  return (
    conceptId.length >= 11 && conceptId.charAt(conceptId.length - 3) === '1'
  );
}

/**
 * Concept ids a product summary *references* without creating them itself, mapped to a
 * label for error reporting.
 *
 * These are the dependencies that a node-level check misses. A product saved against one
 * task and later replayed onto another carries its attribute targets verbatim in the saved
 * JSON — they were resolved against whichever branch was current when the field was filled
 * in, and are never re-resolved on load. If the target was authored on the original task and
 * has not been promoted, it simply does not exist on the new one, and the create writes a
 * relationship to a concept that isn't there.
 *
 * Two sources are collected:
 *
 * - `NON_DEFINING_PROPERTY` values (e.g. "Has marketing authorisation holder"), whose
 *   `valueObject` is a concept on the authoring branch. `EXTERNAL_IDENTIFIER` properties are
 *   deliberately excluded — their `valueObject` is a code in an external code system, so
 *   looking it up against Snowstorm would report a false missing dependency. Reference sets
 *   carry no value at all; the refset itself is metadata that always exists.
 * - Defining axiom targets of concepts about to be created.
 *
 * Targets satisfied by this same save are excluded: placeholder ids for not-yet-created
 * concepts are negative (and so fail the numeric test), and a reference to a sibling node
 * that this summary is creating is resolved by the create itself, not by the branch. So are
 * international identifiers, which cannot be present on one task branch and absent from another.
 */
export function collectReferencedConceptIds(
  products: Product[],
): Map<string, string> {
  // A node being created contributes two ids that a sibling may legitimately reference: the
  // negative placeholder it is keyed by in the form, and — when the author pinned one — the
  // specified concept id it will be created under. The latter is never copied onto
  // `product.conceptId`, so it has to be gathered from `newConceptDetails` separately, matching
  // the server-side check in ProductCreationService#collectReferencedConceptIds.
  const pendingIds = new Set<string>();
  products
    .filter(p => isNewConcept(p))
    .forEach(p => {
      pendingIds.add(p.conceptId);
      const specifiedConceptId = p.newConceptDetails?.specifiedConceptId;
      if (specifiedConceptId) {
        pendingIds.add(specifiedConceptId);
      }
    });

  const referenced = new Map<string, string>();

  const add = (conceptId: string | undefined | null, label?: string) => {
    if (
      !conceptId ||
      !/^\d+$/.test(conceptId) ||
      pendingIds.has(conceptId) ||
      !isExtensionConceptId(conceptId)
    ) {
      return;
    }
    if (!referenced.has(conceptId) || label) {
      referenced.set(conceptId, label ?? referenced.get(conceptId) ?? '');
    }
  };

  products.forEach(product => {
    product.nonDefiningProperties
      ?.filter(p => p.type === NonDefiningPropertyType.NON_DEFINING_PROPERTY)
      .forEach(p =>
        add(
          p.valueObject?.conceptId,
          `${p.title}: ${p.valueObject?.pt?.term ?? ''}`.trim(),
        ),
      );

    product.newConceptDetails?.axioms?.forEach(axiom =>
      axiom.relationships
        ?.filter(r => r.active && !r.concreteValue)
        .forEach(r => add(r.destinationId)),
    );
  });

  return referenced;
}

/**
 * Labels for concept-valued properties holding a term the user typed that never resolved to
 * a concept.
 *
 * When a typed term matches no option, the autocomplete commits it as a term with no
 * conceptId rather than discarding what was typed, so the search can be resumed. The field
 * flags itself, but that is advisory only — without this check the unresolved value reaches
 * the create and is written as a relationship with no target.
 */
export function collectUnresolvedReferences(products: Product[]): string[] {
  const unresolved = new Set<string>();

  products.forEach(product =>
    product.nonDefiningProperties
      ?.filter(p => p.type === NonDefiningPropertyType.NON_DEFINING_PROPERTY)
      .filter(p => p.valueObject && !p.valueObject.conceptId)
      .forEach(p =>
        unresolved.add(`<${p.title}: ${p.valueObject?.pt?.term ?? ''}>`),
      ),
  );

  return [...unresolved];
}

/**
 * Callers treat a truthy return from {@link validateProductSummaryNodes} as "blocked", and the
 * value they get is whatever key the snackbar layer handed back. That couples refusing the save to
 * the notification succeeding: if `enqueueSnackbar` ever returns nothing, a save with known-missing
 * dependencies would be waved through — the precise failure this validation exists to prevent.
 * Fall back to a sentinel so the block never depends on the snackbar. `closeSnackbar` on a key it
 * doesn't know is a no-op, so the callers' cleanup path stays safe.
 */
const VALIDATION_BLOCKED = 'product-validation-blocked';

function reportBlocking(messages: string[]): ReturnType<typeof showErrors> {
  try {
    // Joined into one message because showErrors renders the array via toString(), which would
    // run the sentences together.
    return showErrors([messages.join(' ')]) || VALIDATION_BLOCKED;
  } catch {
    // Whether the notification renders is not allowed to decide whether the save proceeds. The
    // enclosing try/catch is there to turn a failed Snowstorm lookup into an outage message; if it
    // also caught a throw from here it would convert "blocked" into "allowed" — silently letting
    // through the exact payload this validation exists to reject.
    return VALIDATION_BLOCKED;
  }
}

/**
 * Validate that every concept a product summary depends on exists on the authoring branch —
 * both the summary's own nodes and the concepts those nodes reference. Generates a blocking
 * error if any is absent.
 *
 * Node ids and referenced ids are resolved in the same batched lookup, so on a save that was
 * already checking node ids the references ride along for free. A product made entirely of new
 * concepts previously had no node ids to check and skipped the lookup altogether — for that case
 * (which includes the stale-reference scenario this guards against) it costs one id-only query.
 *
 * Missing ids are also recorded on the authoring store so the individual fields can flag
 * themselves without each performing its own lookup.
 */
export async function validateProductSummaryNodes(
  products: Product[],
  branch: string,
  serviceStatus: ServiceStatus | undefined,
): Promise<void | ReturnType<typeof showErrors>> {
  const setMissingConceptIds =
    useAuthoringStore.getState().setMissingConceptIds;

  // Cleared up front so that no path out of this function — including the lookup throwing — can
  // leave fields flagging ids resolved during an earlier validation, possibly of another product.
  // Only a lookup that actually completes gets to say which concepts are missing.
  setMissingConceptIds([]);

  // Extract concept IDs from products that are not new concepts
  const conceptIdsToBeChecked = products
    .filter(p => !isNewConcept(p))
    .map(p => p.conceptId);

  const referencedConceptIds = collectReferencedConceptIds(products);

  // Costs no lookup, so it is still reported when there is nothing to look up. If the lookup
  // itself fails the outage takes precedence — the save is blocked either way, and the user needs
  // to know the check could not run.
  const unresolvedReferences = collectUnresolvedReferences(products);
  const unresolvedError =
    unresolvedReferences.length > 0
      ? `One or more values were typed but never resolved to a concept: ` +
        `${unresolvedReferences.join(', ')}. Search for and select a valid option before saving.`
      : undefined;

  // Get distinct concept IDs
  const distinctConceptIds = [
    ...new Set([...conceptIdsToBeChecked, ...referencedConceptIds.keys()]),
  ];

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
      setMissingConceptIds(missingIds);

      const errors: string[] = [];
      if (unresolvedError) {
        errors.push(unresolvedError);
      }

      if (missingIds.length > 0) {
        // Create error message for missing concepts
        const nodeMessage = [
          ...new Set(
            products
              .filter(p => missingIds.includes(p.conceptId))
              .map(p => `<${p.concept?.pt?.term} ${p.conceptId}>`),
          ),
        ];

        // Referenced concepts are reported separately because the remediation differs:
        // the field holding the reference has to be searched and re-selected against this
        // branch, rather than the product itself being stale.
        const referenceMessage = [
          ...new Set(
            missingIds
              .filter(id => referencedConceptIds.has(id))
              .map(id => {
                const label = referencedConceptIds.get(id);
                return label ? `<${label} ${id}>` : `<${id}>`;
              }),
          ),
        ];

        if (nodeMessage.length > 0) {
          errors.push(
            `One or more concepts do not exist or are inactive: ${nodeMessage.join(', ')}`,
          );
        }
        if (referenceMessage.length > 0) {
          errors.push(
            `One or more referenced concepts do not exist or are inactive on this branch: ` +
              `${referenceMessage.join(', ')}. This usually means the product was authored ` +
              `against a different task — search for and re-select these values before saving.`,
          );
        }
      }

      // Show errors if any missing or unresolved concepts.
      if (errors.length > 0) {
        return reportBlocking(errors);
      }
    } catch (error) {
      // Handle errors
      return snowstormErrorHandler(
        error,
        'validateProductSummaryNodes',
        serviceStatus,
      );
    }
  } else if (unresolvedError) {
    // Nothing to look up, but a value was typed and never resolved — still a blocking problem.
    return reportBlocking([unresolvedError]);
  }

  return undefined;
}

export function cleanUpWhiteSpaceFromNodes(products: Product[]): Product[] {
  return products.map(product => {
    if (product.newConceptDetails) {
      const details = product.newConceptDetails;

      if (details.fullySpecifiedName) {
        details.fullySpecifiedName = normalizeWhitespace(
          details.fullySpecifiedName,
        );
      }
      if (details.fsn && details.fsn.term) {
        details.fsn.term = normalizeWhitespace(details.fsn.term);
      }

      if (details.preferredTerm) {
        details.preferredTerm = normalizeWhitespace(details.preferredTerm);
      }
      if (details.pt && details.pt.term) {
        details.pt.term = normalizeWhitespace(details.pt.term);
      }
      if (details.descriptions) {
        details.descriptions = cleanUpDescriptions(details.descriptions);
      }
    }
    return product;
  });
}
export function cleanUpDescriptions(
  descriptions: Description[],
): Description[] {
  return descriptions.map(desc => ({
    ...desc,
    term: normalizeWhitespace(desc.term) ?? desc.term,
  }));
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

export function normalizeWhitespace(str: string | undefined) {
  return str ? str.trim().replace(/\s+/g, ' ') : str;
}
