import {
  NonDefiningProperty,
  SnowstormConceptMini,
} from '../../../../types/product.ts';
import { isEqual } from 'lodash';

export const compareByConceptId = (
  a: SnowstormConceptMini | SnowstormConceptMini[] | null | undefined,
  b: SnowstormConceptMini | SnowstormConceptMini[] | null | undefined,
): boolean => {
  // Case 1: both null/undefined → equal
  if (!a && !b) return true;
  if (!a || !b) return false;

  // Case 2: both arrays → compare by conceptId values
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const aIds = a.map(item => item?.conceptId).sort();
    const bIds = b.map(item => item?.conceptId).sort();
    return isEqual(aIds, bIds);
  }

  // Case 3: one is array, the other is not → not equal
  if (Array.isArray(a) || Array.isArray(b)) {
    return false;
  }

  // Case 4: single concept comparison
  if (a.conceptId && b.conceptId) {
    return isEqual(a.conceptId, b.conceptId);
  }

  // Case 5: fallback deep equality (non-standard structure)
  return isEqual(a, b);
};
export const compareByValue = (
  a: any | any[] | null | undefined,
  b: any | any[] | null | undefined,
): boolean => {
  // Both nullish → considered equal
  if (a == null && b == null) return true;

  // One nullish, one not → not equal
  if (a == null || b == null) return false;

  // Both arrays → compare each element
  if (Array.isArray(a) && Array.isArray(b)) {
    // If lengths differ, not equal
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort((x, y) => String(x).localeCompare(String(y)));
    const sortedB = [...b].sort((x, y) => String(x).localeCompare(String(y)));

    // Compare each element deeply
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(sortedA[i], sortedB[i])) return false;
    }
    return true;
  }

  // One is array, one is not → not equal
  if (Array.isArray(a) || Array.isArray(b)) return false;

  // Default: deep equality
  return isEqual(a, b);
};
export const compareByValueAndAdditional = (
  a: NonDefiningProperty | NonDefiningProperty[] | null | undefined,
  b: NonDefiningProperty | NonDefiningProperty[] | null | undefined,
): boolean => {
  // Both nullish → considered equal
  if (a == null && b == null) return true;

  // One nullish, one not → not equal
  if (a == null || b == null) return false;

  // Both arrays → compare each element
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort((x, y) =>
      String(x.value).localeCompare(String(y.value)),
    );
    const sortedB = [...b].sort((x, y) =>
      String(x.value).localeCompare(String(y.value)),
    );
    for (let i = 0; i < a.length; i++) {
      if (!compareSingleValueWithAdditional(sortedA[i], sortedB[i]))
        return false;
    }
    return true;
  }

  // One is array, one is not → not equal
  if (Array.isArray(a) || Array.isArray(b)) return false;

  // Compare single objects
  return compareSingleValueWithAdditional(a, b);
};

// Helper to compare single ValueWithAdditional objects
const compareSingleValueWithAdditional = (
  a: NonDefiningProperty,
  b: NonDefiningProperty,
): boolean => {
  // Compare main value
  if (a.value !== b.value) return false;

  const aFields = a.additionalFields || {};
  const bFields = b.additionalFields || {};

  const aKeys = Object.keys(aFields);
  const bKeys = Object.keys(bFields);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bFields, key)) return false;

    const aVal = aFields[key];
    const bVal = bFields[key];

    // Compare simple value string
    if ((aVal.value || '') !== (bVal.value || '')) return false;

    // Compare conceptId if valueObject exists
    const aConceptId = aVal.valueObject?.conceptId;
    const bConceptId = bVal.valueObject?.conceptId;

    if ((aConceptId || '') !== (bConceptId || '')) return false;
  }

  return true;
};
