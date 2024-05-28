import type { ValueSetExpansionContains } from 'fhir/r4';

export function getValueSetExpansionContainsPt(
  valueSet: ValueSetExpansionContains,
) {
  return valueSet.display;
}
