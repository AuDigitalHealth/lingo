import axios from 'axios';

import type { ValueSet, Parameters, CapabilityStatement } from 'fhir/r4';
import { appendIdsToEcl } from '../utils/helpers/EclUtils';
import { Status } from '../types/applicationConfig';

const OntoserverService = {
  handleErrors: () => {
    throw new Error('invalid Ontoserver response');
  },

  async searchConcept(
    baseUrl: string | undefined,
    extension: string | undefined,
    providedEcl: string,
    count: string,
    filter?: string,
  ): Promise<ValueSet> {
    let encodedFilter = '';
    if (filter) {
      encodedFilter = encodeURIComponent(filter);
    }

    const response = await axios.get(
      `${baseUrl}/ValueSet/$expand?url=http://snomed.info/${extension}?fhir_vs=ecl/${providedEcl}${filter ? '&filter=' + encodedFilter : ''}&includeDesignations=true&count=${count}`,
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
  async getServiceStatus(baseUrl: string | undefined): Promise<Status> {
    const url = `${baseUrl}/metadata`;
    const response = await axios.get(url);
    if (response.status != 200) {
      this.handleErrors();
    }
    const typedRes = response.data as CapabilityStatement;
    return {
      running: typedRes.status === 'active',
      version: typedRes.version,
    } as Status;
  },
};

export default OntoserverService;
