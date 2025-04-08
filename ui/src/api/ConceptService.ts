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
  BrowserConcept,
  Concept,
  ConceptResponse,
  ConceptResponseForIds,
  ConceptSearchResponse,
} from '../types/concept.ts';
import {
  emptySnowstormResponse,
  filterByActiveConcepts,
  mapToConceptIds,
} from '../utils/helpers/conceptUtils.ts';
import {
  appendIdsToEcl,
  generateEclFromBinding,
} from '../utils/helpers/EclUtils.ts';
import useApplicationConfigStore from '../stores/ApplicationConfigStore.ts';
import { FieldBindings } from '../types/FieldBindings.ts';
import { api } from './api.ts';
import OntoserverService from './OntoserverService.ts';
import { convertFromValueSetExpansionContainsListToSnowstormConceptMiniList } from '../utils/helpers/getValueSetExpansionContainsPt.ts';

const ConceptService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid concept response');
  },

  async searchConcept(
    str: string,
    branch: string,
    providedEcl: string,
    useOldConcepts?: boolean,
  ): Promise<ConceptResponse> {
    let concepts: Concept[] = [];

    const url = `/snowstorm/${branch}/concepts?term=${str}&statedEcl=${providedEcl}&termActive=true${useOldConcepts ? '' : '&isPublished=false'}`;
    const response = await api.get(url, {
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptResponse = response.data as ConceptResponse;
    concepts = conceptResponse.items;
    const uniqueConcepts = filterByActiveConcepts(concepts);
    conceptResponse.items = uniqueConcepts;
    return conceptResponse;
  },
  async searchConceptNoEcl(
    str: string,
    branch: string,
    useOldConcepts?: boolean,
  ): Promise<ConceptResponse> {
    let concepts: Concept[] = [];

    const url = `/snowstorm/${branch}/concepts?term=${str}&termActive=true${useOldConcepts ? '' : '&isPublished=false'}`;
    const response = await api.get(url, {
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptResponse = response.data as ConceptResponse;
    concepts = conceptResponse.items;
    const uniqueConcepts = filterByActiveConcepts(concepts);
    conceptResponse.items = uniqueConcepts;
    return conceptResponse;
  },
  async searchConceptByEcl(
    ecl: string,
    branch: string,
    limit?: number,
    term?: string,
    useOldConcepts?: boolean,
  ): Promise<ConceptResponse> {
    let concepts: Concept[] = [];
    if (!limit) {
      limit = 50;
    }
    let url = `/snowstorm/${branch}/concepts?statedEcl=${ecl}&termActive=true&limit=${limit}${useOldConcepts ? '' : '&isPublished=false'}`;
    if (term && term.length > 2) {
      url += `&term=${term}`;
    }
    const response = await api.get(
      // `/snowstorm/MAIN/concepts?term=${str}`,
      url,
      {
        headers: {
          'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
        },
      },
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptResponse = response.data as ConceptResponse;
    concepts = conceptResponse.items;
    const uniqueConcepts = filterByActiveConcepts(concepts);
    conceptResponse.items = uniqueConcepts;
    return conceptResponse;
  },

  async searchUnpublishedConceptByIds(
    id: string[],
    branch: string,
    providedEcl?: string,
  ): Promise<ConceptResponse> {
    if (providedEcl) {
      providedEcl = appendIdsToEcl(providedEcl, id);
    }
    const url = providedEcl
      ? `/snowstorm/${branch}/concepts?statedEcl=${providedEcl}&termActive=true&isPublished=false`
      : `/snowstorm/${branch}/concepts/${id[0]}`;
    const response = await api.get(url, {
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }

    if (providedEcl) {
      const conceptResponse = response.data as ConceptResponse;
      return conceptResponse;
    } else {
      const concept = response.data as Concept;
      const conceptResponse = createConceptResponse([concept]);
      return conceptResponse;
    }
  },

  async searchConceptById(id: string, branch: string): Promise<BrowserConcept> {
    const url = `/snowstorm/browser/${branch}/concepts/${id}`;
    const response = await api.get(url, {
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as BrowserConcept;
  },

  async searchConceptByIdNoEcl(id: string, branch: string): Promise<Concept[]> {
    const url = `/snowstorm/${branch}/concepts/${id[0]}`;
    const response = await api.get(url, {
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }

    const concepts = response.data as Concept;
    const uniqueConcepts = filterByActiveConcepts([concepts]);

    return uniqueConcepts;
  },
  async searchUnPublishedCtppsByIds(
    ids: string[],
    branch: string,
    fieldBindings: FieldBindings,
  ): Promise<ConceptResponse> {
    const conceptsSearchTerms = ids.join(' OR ');
    let ecl = generateEclFromBinding(fieldBindings, 'product.search.ctpp');

    const eclSplit = ecl.split('[values]');
    ecl = eclSplit.join(conceptsSearchTerms);

    const encodedEcl = encodeURIComponent(ecl);
    const url = `/snowstorm/${branch}/concepts?statedEcl=${encodedEcl}`;
    const response = await api.get(url, {
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as ConceptResponse;
  },
  async searchConceptsByIds(ids: string[], branch: string): Promise<Concept[]> {
    const idList = ids.join(',');
    const params: Record<string, string | number | boolean> = {
      conceptIds: idList,
      form: 'inferred',
      termActive: true,
    };
    const url = `/snowstorm/${branch}/concepts`;
    const response = await api.get(url, {
      params: params,
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptResponse = response.data as ConceptResponse;
    return conceptResponse.items;
  },
  /* Quicker for searching compared to id based*/
  async searchConceptIdsByIds(
    ids: string[],
    branch: string,
  ): Promise<ConceptResponseForIds> {
    const idList = ids.join(',');
    const url = `/snowstorm/${branch}/concepts?conceptIds=${idList}&returnIdOnly=true&termActive=true`;
    const response = await api.get(url, {
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptResponse = response.data as ConceptResponseForIds;
    return conceptResponse;
  },
  async searchConceptByArtgId(
    id: string,
    branch: string,
    providedEcl: string,
  ): Promise<ConceptResponse> {
    const searchBody = {
      additionalFields: {
        mapTarget: id, //need to change to schemeValue
      },
    };
    const response = await api.post(
      `/snowstorm/${branch}/members/search`,
      searchBody,
      {
        headers: {
          'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
        },
      },
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptSearchResponse = response.data as ConceptSearchResponse;
    const conceptIds = mapToConceptIds(conceptSearchResponse.items);
    if (conceptIds && conceptIds.length > 0) {
      return this.searchUnpublishedConceptByIds(
        conceptIds,
        branch,
        providedEcl,
      );
    }
    return emptySnowstormResponse;
  },

  // ECL refset tool
  async getEclConcepts(
    branch: string,
    ecl: string,
    options?: {
      limit?: number;
      offset?: number;
      term?: string;
      activeFilter?: boolean;
      termActive?: boolean;
    },
  ): Promise<ConceptResponse> {
    const { term, termActive, activeFilter } = options ?? {};
    let { limit, offset } = options ?? {};
    limit = limit || 50;
    offset = offset || 0;

    const url = `${useApplicationConfigStore.getState().applicationConfig?.snodineSnowstormProxy}/${branch}/concepts`;
    const params: Record<string, string | number | boolean | undefined> = {
      ecl: ecl,
      includeLeafFlag: false,
      form: 'inferred',
      offset,
      limit,
      activeFilter,
      termActive,
    };
    if (term && term.length > 2) {
      params.term = term;
    }

    const response = await api.get(url, {
      params: params,
      headers: {
        Accept: 'application/json',
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
      paramsSerializer: { encode: encodeURIComponent },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptResponse = response.data as ConceptResponse;
    return conceptResponse;
  },
  async getConceptById(id: string, branch: string): Promise<Concept> {
    const url = `/snowstorm/${branch}/concepts/${id}`;
    const response = await api.get(url, {
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    const concept = response.data as Concept;
    return concept;
  },
  async searchConceptIdsBulkFilters(
    branch: string,
    filters: {
      limit?: number;
      offset?: number;
      conceptIds?: string[];
      activeFilter?: boolean;
      searchAfter?: string;
      eclFilter?: string;
    },
  ): Promise<ConceptResponseForIds> {
    const url = `${useApplicationConfigStore.getState().applicationConfig?.snodineSnowstormProxy}/${branch}/concepts/search`;
    const response = await api.post(
      url,
      { ...filters, returnIdOnly: true },
      {
        headers: {
          'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
        },
      },
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as ConceptResponseForIds;
  },
  async searchConceptInOntoFallbackToSnowstorm(
    providedEcl: string,
    branch: string,
  ) {
    let results: Concept[] = [];
    const ontoData = await OntoserverService.searchConcept(
      useApplicationConfigStore.getState().applicationConfig?.fhirServerBaseUrl,
      useApplicationConfigStore.getState().applicationConfig
        ?.fhirServerExtension,
      providedEcl,
      useApplicationConfigStore.getState().applicationConfig?.fhirRequestCount,
      undefined,
    );
    if (ontoData) {
      results =
        ontoData.expansion?.contains !== undefined
          ? convertFromValueSetExpansionContainsListToSnowstormConceptMiniList(
              ontoData.expansion.contains,
              useApplicationConfigStore.getState().applicationConfig
                ?.fhirPreferredForLanguage,
            )
          : ([] as Concept[]);
    }
    if (results.length > 0) {
      return results;
    } else {
      const conceptResponse = await ConceptService.searchConceptByEcl(
        providedEcl,
        branch,
        undefined,
        undefined,
        true,
      );
      if (conceptResponse && conceptResponse.items) {
        results = conceptResponse.items;
      }
    }
    return results;
  },
  /*
   * Passing large set of concept ids for look up which internally create batches and invoke snowstorm*/
  async getFilteredConceptIdsByBatches(conceptIds: string[], branch: string) {
    const defaultBatchSize = 50;
    const batchSize =
      conceptIds.length > defaultBatchSize
        ? defaultBatchSize
        : conceptIds.length;

    const batches = [];
    for (let i = 0; i < conceptIds.length; i += batchSize) {
      const batch = conceptIds.slice(i, i + batchSize);
      batches.push(batch);
    }
    try {
      const fetchPromises = batches.map(
        async conceptIds =>
          await ConceptService.searchConceptIdsByIds(conceptIds, branch),
      );
      const results = await Promise.all(fetchPromises);
      const filteredConceptIds = results.flatMap(c => c.items);
      return filteredConceptIds;
    } catch (error) {
      console.error('One or more API calls failed:', error);
    }
    return [];
  },
};

const createConceptResponse = (concepts: Concept[]) => {
  const conceptResponse = {
    items: concepts,
    total: concepts.length,
    limit: concepts.length, // Assuming all items are returned at once
    offset: 0, // Assuming no pagination is applied
    searchAfter: '', // Provide appropriate values if needed
    searchAfterArray: [], // Provide appropriate values if needed
  };
  return conceptResponse;
};

export default ConceptService;
