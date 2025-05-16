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

import axios from 'axios';

import type {CapabilityStatement, Parameters, ValueSet} from 'fhir/r4';
import {Bundle, CodeSystem} from 'fhir/r4';
import {appendIdsToEcl} from '../utils/helpers/EclUtils';
import {StatusWithEffectiveDate} from '../types/applicationConfig';

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
    return this.searchConceptByUrl(
      baseUrl,
      `http://snomed.info/${extension}?fhir_vs=ecl/${providedEcl}`,
      count,
      filter,
    );
  },
  async searchConceptByUrl(
    baseUrl: string | undefined,
    url: string | undefined,
    count: string,
    filter?: string,
  ): Promise<ValueSet> {
    let encodedFilter = '';
    if (filter) {
      encodedFilter = encodeURIComponent(filter);
    }

    const response = await axios.get(
      `${baseUrl}/ValueSet/$expand?url=${url}${filter ? '&filter=' + encodedFilter : ''}&includeDesignations=true&count=${count}`,
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
  async getServiceStatus(
    baseUrl: string | undefined,
    extension: string | undefined,
  ): Promise<StatusWithEffectiveDate> {
    const url = `${baseUrl}/metadata`;
    const response = await axios.get(url);
    if (response.status != 200) {
      this.handleErrors();
    }
    const typedRes = response.data as CapabilityStatement;

    const codeSystem = await this.getLatestCodeSystem(baseUrl, extension);
    return {
      running: typedRes.status === 'active',
      version: typedRes.version,
      effectiveDate: codeSystem?.version?.split('/').pop(),
    } as StatusWithEffectiveDate;
  },
  async getLatestCodeSystem(
    baseUrl: string | undefined,
    extension: string | undefined,
  ): Promise<CodeSystem | undefined> {
    const url = `${baseUrl}/CodeSystem?url=http://snomed.info/sct&_format=json `;
    const response = await axios.get(url);
    if (response.status != 200) {
      this.handleErrors();
    }
    const bundle = response.data as Bundle<CodeSystem>;
    const codeSystems = bundle?.entry
      ?.filter(entry => {
        return entry.resource?.version?.startsWith(
          `http://snomed.info/${extension}`,
        );
      })
      .sort((a, b) => {
        const dateA = a.resource?.version?.split('/').pop() || '';
        const dateB = b.resource?.version?.split('/').pop() || '';
        return dateB.localeCompare(dateA);
      });

    const mostRecentCodeSystem = codeSystems?.[0]?.resource;
    return mostRecentCodeSystem;
  },
};

export default OntoserverService;
