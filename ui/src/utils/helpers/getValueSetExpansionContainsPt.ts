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

import type { ValueSetExpansionContains } from 'fhir/r4';
import { Concept, Term } from '../../types/concept';

export function convertFromValueSetExpansionContainsListToSnowstormConceptMiniList(
  valueSet: ValueSetExpansionContains[],
  preferredForLanguage: string,
): Concept[] {
  return valueSet.map(value => {
    return convertFromValueSetExpansionContainsToSnowstormConceptMini(
      value,
      preferredForLanguage,
    );
  });
}

export function convertFromValueSetExpansionContainsToSnowstormConceptMini(
  valueSet: ValueSetExpansionContains,
  preferredForLanguage: string,
): Concept {
  return {
    id: valueSet.code,
    idAndFsnTerm: `${valueSet.code} | ${generateFsnFromValueSetExpansionContains(valueSet).term}`,
    conceptId: valueSet.code,
    moduleId: '',
    effectiveTime: '',
    fsn: generateFsnFromValueSetExpansionContains(valueSet),
    pt: generatePtFromValueSetExpansionContains(valueSet, preferredForLanguage),
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
  preferredForLanguage: string,
): Term {
  const pt = valueSet.designation?.find(designation => {
    return (
      designation.use?.code === 'preferredForLanguage' &&
      designation.language === preferredForLanguage
    );
  });
  return {
    term: pt?.value ? pt.value : valueSet.display ? valueSet.display : '',
    lang: pt?.language ? pt.language : 'en',
  };
}
