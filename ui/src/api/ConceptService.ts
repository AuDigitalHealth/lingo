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
  BranchJobStatusEnum,
  BranchJobStatus,
  BrowserConcept,
  Concept,
  ConceptResponse,
  ConceptResponseForIds,
  ConceptSearchResponse,
  MergeError,
} from '../types/concept.ts';
import { IntegrityCheckResponse, Task } from '../types/task.ts';
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
import { AxiosResponse } from 'axios';
import TasksServices from './TasksService.ts';

const ConceptService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid concept response');
  },

  async searchConcept(
    str: string,
    branch: string,
    providedEcl: string,
    turnOffPublishParam?: boolean,
  ): Promise<ConceptResponse> {
    let concepts: Concept[] = [];

    const url = `/snowstorm/${encodeURIComponent(branch)}/concepts?term=${str}&statedEcl=${providedEcl}&termActive=true${turnOffPublishParam ? '' : '&isPublished=false'}`;
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
  async integrityCheck(branch: string): Promise<IntegrityCheckResponse> {
    const url = `/snowstorm/${branch}/integrity-check`;
    const response = await api.post(url);

    if (response.status !== 201) {
      this.handleErrors();
    }
    return response.data as IntegrityCheckResponse;
  },
  async mergeTask(
    // main/head branch
    headBranch: string,
    // task/feature branch
    taskBranch: string,
    task: Task,
  ): Promise<Task> {
    const requestPayload = {
      source: headBranch,
      target: taskBranch,
    };
    const url = `/snowstorm/merges`;
    const response = await api.post(url, requestPayload);

    if (response.status !== 201) {
      this.handleErrors();
    }

    // Extract location header to get the merge job URL
    const locationHeader = response.headers.location;
    if (!locationHeader) {
      throw new Error('No location header returned from merge request');
    }

    const mergePath = new URL(locationHeader).pathname;

    // Poll the merge progress until completion
    await this.pollMergeProgress(mergePath);

    // Once merge is complete, fetch and return the updated task
    const returnTask = await TasksServices.getTask(task?.projectKey, task?.key);
    return returnTask;
  },

  async pollMergeProgress(mergeUrl: string): Promise<void> {
    const cleanedUrl = mergeUrl.replace('snomed-ct/', '');
    const pollInterval = 5000;
    const maxAttempts = 120;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const progressResponse = await api.get(cleanedUrl);
        const mergeStatus = progressResponse.data as BranchJobStatus;

        if (mergeStatus.status === BranchJobStatusEnum.COMPLETED) {
          return;
        }

        if (mergeStatus.status === BranchJobStatusEnum.FAILED) {
          throw new MergeError(
            `Merge failed with status: ${mergeStatus.status}`,
            mergeStatus,
          );
        }

        await this.delay(pollInterval);
        attempts++;
      } catch (error) {
        // If it's already a MergeError, re-throw it
        if (error instanceof MergeError) {
          throw error;
        }

        if (attempts >= maxAttempts - 1) {
          throw new Error(
            `Merge polling timed out after ${(maxAttempts * pollInterval) / 1000} seconds`,
          );
        }
        await this.delay(pollInterval);
        attempts++;
      }
    }

    throw new Error(
      `Merge polling timed out after ${(maxAttempts * pollInterval) / 1000} seconds`,
    );
  },
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  async searchConceptNoEcl(
    str: string,
    branch: string,
    turnOffPublishParam?: boolean,
  ): Promise<ConceptResponse> {
    let concepts: Concept[] = [];

    const encodedString = encodeURIComponent(str);
    const url = `/snowstorm/${encodeURIComponent(branch)}/concepts?term=${encodedString}&termActive=true${turnOffPublishParam ? '' : '&isPublished=false'}`;
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
    turnOffPublishParam?: boolean,
  ): Promise<ConceptResponse> {
    let concepts: Concept[] = [];
    if (!limit) {
      limit = 50;
    }
    let url = `/snowstorm/${encodeURIComponent(branch)}/concepts?statedEcl=${ecl}&termActive=true&limit=${limit}${turnOffPublishParam ? '' : '&isPublished=false'}`;
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

  async searchConceptByIds(
    id: string[],
    branch: string,
    providedEcl?: string,
    turnOffPublishParam?: boolean,
  ): Promise<ConceptResponse> {
    if (providedEcl) {
      providedEcl = appendIdsToEcl(providedEcl, id);
    }
    const url = providedEcl
      ? `/snowstorm/${encodeURIComponent(branch)}/concepts?statedEcl=${providedEcl}&termActive=true${turnOffPublishParam ? '' : '&isPublished=false'}`
      : `/snowstorm/${encodeURIComponent(branch)}/concepts/${id[0]}`;
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
    const url = `/snowstorm/browser/${encodeURIComponent(branch)}/concepts/${id}`;
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
    const url = `/snowstorm/${encodeURIComponent(branch)}/concepts/${id[0]}`;
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
    const url = `/snowstorm/${encodeURIComponent(branch)}/concepts?statedEcl=${encodedEcl}`;
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
    const url = `/snowstorm/${encodeURIComponent(branch)}/concepts`;
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
  async searchConceptsByIdsPost(
    branch: string,
    filters: {
      limit?: number;
      offset?: number;
      conceptIds?: string[];
      activeFilter?: boolean;
      searchAfter?: string;
      eclFilter?: string;
    },
  ): Promise<Concept[]> {
    const url = `/snowstorm/${encodeURIComponent(branch)}/concepts/search`;
    const response = await api.post(
      url,
      { ...filters },
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
    return conceptResponse.items;
  },
  /* Quicker for searching compared to id based*/
  async searchConceptIdsByIds(
    ids: string[],
    branch: string,
  ): Promise<ConceptResponseForIds> {
    const idList = ids.join(',');
    const url = `/snowstorm/${encodeURIComponent(branch)}/concepts?conceptIds=${idList}&returnIdOnly=true&activeFilter=true`;
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
    turnOffPublishParam?: boolean,
  ): Promise<ConceptResponse> {
    const searchBody = {
      additionalFields: {
        mapTarget: id, //need to change to schemeValue
      },
    };
    const response = await api.post(
      `/snowstorm/${encodeURIComponent(branch)}/members/search`,
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
      return this.searchConceptByIds(
        conceptIds,
        branch,
        providedEcl,
        turnOffPublishParam,
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
      searchAfter?: string;
    },
  ): Promise<ConceptResponse> {
    const { term, termActive, activeFilter, searchAfter } = options ?? {};
    let { limit, offset } = options ?? {};
    limit = limit || 50;
    offset = offset || 0;

    const url = `${useApplicationConfigStore.getState().applicationConfig?.snodineSnowstormProxy}/${encodeURIComponent(branch)}/concepts`;
    const params: Record<string, string | number | boolean | undefined> = {
      ecl: ecl,
      includeLeafFlag: false,
      form: 'inferred',
      offset,
      limit,
      activeFilter,
      termActive,
      searchAfter,
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
    const url = `/snowstorm/${encodeURIComponent(branch)}/concepts/${id}`;
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
    const url = `${useApplicationConfigStore.getState().applicationConfig?.snodineSnowstormProxy}/${encodeURIComponent(branch)}/concepts/search`;
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
