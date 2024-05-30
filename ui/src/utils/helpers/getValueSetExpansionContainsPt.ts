import type { ValueSetExpansionContains } from 'fhir/r4';
import { Concept, Term } from '../../types/concept';
export function getValueSetExpansionContainsPt(
  valueSet: ValueSetExpansionContains,
) {
  return valueSet.display;
}

export function convertFromValueSetExpansionContainsListToSnowstormConceptMiniList(
  valueSet: ValueSetExpansionContains[],
): Concept[] {
  return valueSet.map(value => {
    return convertFromValueSetExpansionContainsToSnowstormConceptMini(value);
  });
}
export function convertFromValueSetExpansionContainsToSnowstormConceptMini(
  valueSet: ValueSetExpansionContains,
): Concept {
  return {
    id: valueSet.code,
    idAndFsnTerm: `${valueSet.code} | ${generateFsnFromValueSetExpansionContains(valueSet).term}`,
    conceptId: valueSet.code,
    moduleId: '',
    effectiveTime: '',
    fsn: generateFsnFromValueSetExpansionContains(valueSet),
    pt: generatePtFromValueSetExpansionContains(valueSet),
  };
}

export function generateFsnFromValueSetExpansionContains(
  valueSet: ValueSetExpansionContains,
): Term {
  const fsn = valueSet.designation?.find(designation => {
    return designation.use?.code === '900000000000003001';
  });
  return {
    term: fsn?.value ? fsn.value : '',
    lang: fsn?.language ? fsn.language : '',
  };
}

export function generatePtFromValueSetExpansionContains(
  valueSet: ValueSetExpansionContains,
): Term {
  const pt = valueSet.designation?.find(designation => {
    return designation.use?.code === 'preferredForLanguage';
  });
  return {
    term: pt?.value ? pt.value : '',
    lang: pt?.language ? pt.language : '',
  };
}
