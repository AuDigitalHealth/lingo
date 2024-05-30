/* eslint-disable */
import type { ValueSetExpansionContains } from 'fhir/r4';

export function isValueSetExpansionContains(
  object: any,
): object is ValueSetExpansionContains {
  return (
    object &&
    object.system !== undefined &&
    typeof object.system === 'string' &&
    object.code !== undefined &&
    typeof object.code === 'string' &&
    object.display !== undefined &&
    typeof object.display === 'string' &&
    object.designation !== undefined &&
    Array.isArray(object.designation)
  );
}
