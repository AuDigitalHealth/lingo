import axios from 'axios';

import type { ValueSet, Parameters } from 'fhir/r4';
import { appendIdsToEcl } from '../utils/helpers/EclUtils';

const OntoserverService = {
  handleErrors: () => {
    throw new Error('invalid Ontoserver response');
  },

  async searchConcept(
    baseUrl: string | undefined,
    extension: string | undefined,
    providedEcl: string,
    filter?: string,
  ): Promise<ValueSet> {
    const response = await axios.get(
      `${baseUrl}/ValueSet/$expand?url=http://snomed.info/${extension}?fhir_vs=ecl/${providedEcl}${filter ? '&filter=' + filter : ''}&includeDesignations=true`,
    );

    const statusCode = response.status;

    if (statusCode !== 200) {
      this.handleErrors();
    }

    return response.data as ValueSet;
  },
  async searchConceptByIds(
    baseUrl: string | undefined,
    extension: string | undefined,
    id: string[],
    providedEcl?: string,
  ): Promise<ValueSet> {
    if (providedEcl) {
      providedEcl = appendIdsToEcl(providedEcl, id);
    }
    const url = providedEcl
      ? `${baseUrl}/ValueSet/$expand?url=http://snomed.info/${extension}?fhir_vs=ecl/${providedEcl}&includeDesignations=true`
      : `${baseUrl}/ValueSet/$expand?url=http://snomed.info/${extension}?fhir_vs=ecl/${providedEcl}&filter=${id[0]}&includeDesignations=true`;
    const response = await axios.get(url);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as ValueSet;
  },
  async searchByArtgid(
    baseUrl: string | undefined,
    extension: string | undefined,
    searchTerm?: string,
    providedEcl?: string,
  ): Promise<ValueSet> {
    const url = `${baseUrl}/ConceptMap/$translate?_format=json${searchTerm ? `&code=${searchTerm}` : ''}&system=https://www.tga.gov.au/australian-register-therapeutic-goods&target=http://snomed.info/sct&url=http://snomed.info/${extension}?fhir_cm=11000168105&reverse=true&includeDesignations=true`;

    const response = await axios.get(url);
    if (response.status != 200) {
      this.handleErrors();
    }

    const typedResponse = response.data as Parameters;
    const something = typedResponse.parameter?.filter(param => {
      return param.name === 'match';
    });

    const conceptParts = something?.flatMap(match =>
      match?.part?.filter(part => part.name === 'concept'),
    );
    console.log(conceptParts);

    const ids = conceptParts?.map(conceptPart => {
      return conceptPart?.valueCoding?.code;
    });

    return this.searchConceptByIds(
      baseUrl,
      extension,
      ids as string[],
      providedEcl,
    );
  },
};

const generateProvidedEcl = (
  ids: (string | undefined)[] | undefined,
  providedEcl: string | undefined,
) => {
  const andOr: string = ids?.map(id => id).join(' OR ') ?? '';
  const ecl = providedEcl + ' AND (' + andOr + ')';
  return ecl;
};

export default OntoserverService;
