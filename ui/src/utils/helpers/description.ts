import {
  CaseSignificance,
  DefinitionType,
  Description,
} from '../../types/concept';

export const createDefaultDescription = (
  conceptId: string | undefined,
  typeId: string,
  moduleId: string | undefined,
): Description => {
  return {
    active: true,
    moduleId: moduleId ? moduleId : '',
    released: false,
    descriptionId: undefined,
    term: '',
    conceptId: conceptId,
    typeId: typeId,
    acceptabilityMap: undefined,
    type: DefinitionType.SYNONYM,
    lang: 'en',
    caseSignificance: CaseSignificance.ENTIRE_TERM_CASE_SENSITIVE,
  };
};
