import { useQuery, useQueryClient } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService';
import { useEffect, useMemo, useState } from 'react';
import {
  snowstormErrorHandler,
  unavailableErrorHandler,
} from '../../../types/ErrorHandler.ts';
import { useServiceStatus } from '../useServiceStatus.tsx';

import { FieldBindings } from '../../../types/FieldBindings.ts';
import {
  emptySnowstormResponse,
  isSctIds,
} from '../../../utils/helpers/conceptUtils.ts';
import OntoserverService from '../../../api/OntoserverService.ts';
import { ConceptSearchResult } from '../../../pages/products/components/SearchProduct.tsx';
import { isValueSetExpansionContains } from '../../../types/predicates/isValueSetExpansionContains.ts';
import { generateEclFromBinding } from '../../../utils/helpers/EclUtils.ts';
import { Concept, ConceptResponse } from '../../../types/concept.ts';
import type { ValueSet } from 'fhir/r4';
import { convertFromValueSetExpansionContainsListToSnowstormConceptMiniList } from '../../../utils/helpers/getValueSetExpansionContainsPt.ts';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore.ts';
import {
  PUBLISHED_CONCEPTS,
  UNPUBLISHED_CONCEPTS,
} from '../../../utils/statics/responses.ts';
import { ServiceStatus } from '../../../types/applicationConfig.ts';
import { AxiosError } from 'axios';
import { parseSearchTermsSctId } from '../../../utils/helpers/commonUtils.ts';

export function useSearchConceptOntoserver(
  providedEcl: string,
  searchTerm: string | undefined,
  searchFilter: string | undefined,
  allData?: ConceptSearchResult[],
  showDefaultOptions?: boolean,
) {
  const { applicationConfig } = useApplicationConfigStore();

  const shouldCall = () => {
    const validConfig =
      applicationConfig?.fhirServerBaseUrl !== undefined &&
      applicationConfig.fhirServerExtension !== undefined;

    const validSearch =
      searchTerm !== undefined &&
      providedEcl !== undefined &&
      providedEcl !== 'undefined' &&
      searchTerm?.length > 2 &&
      !(allData && checkConceptSearchResultAlreadyExists(allData, searchTerm));

    return validConfig && (showDefaultOptions || validSearch);
  };

  const { isLoading, data, error, isFetching } = useQuery<ValueSet, AxiosError>(
    {
      queryKey: [`onto-concept-${searchTerm}-${providedEcl}`],
      queryFn: () => {
        if (searchFilter === 'Term') {
          return OntoserverService.searchConcept(
            applicationConfig.fhirServerBaseUrl,
            applicationConfig.fhirServerExtension,
            providedEcl,
            applicationConfig.fhirRequestCount,
            searchTerm,
          );
        } else if (
          searchFilter === 'Sct Id' &&
          isSctIds(parseSearchTermsSctId(searchTerm))
        ) {
          const terms = parseSearchTermsSctId(searchTerm);
          return OntoserverService.searchConceptByIds(
            applicationConfig.fhirServerBaseUrl,
            applicationConfig.fhirServerExtension,
            terms,
            providedEcl,
          );
        } else if (searchFilter === 'Artg Id') {
          return OntoserverService.searchByArtgid(
            applicationConfig.fhirServerBaseUrl,
            applicationConfig.fhirServerExtension,
            searchTerm,
            providedEcl,
          );
        } else if (
          searchFilter === undefined &&
          providedEcl !== undefined &&
          providedEcl !== 'undefined'
        ) {
          return OntoserverService.searchConcept(
            applicationConfig.fhirServerBaseUrl,
            applicationConfig.fhirServerExtension,
            providedEcl,
            applicationConfig.fhirRequestCount,
            searchTerm,
          );
        } else {
          // If none of the conditions are met, throw an error
          throw new Error('Invalid search parameters');
        }
      },
      staleTime: 20 * (60 * 1000),
      enabled: shouldCall(),
    },
  );

  return { isLoading, data, error, isFetching };
}

export function useSearchConcept(
  searchFilter: string | undefined,
  searchTerm: string,
  checkItemAlreadyExists: ((search: string) => boolean) | boolean,
  branch: string,
  providedEcl: string,
  allData?: ConceptSearchResult[],
) {
  const { serviceStatus } = useServiceStatus();

  const shouldCall = () => {
    const validSearch =
      searchTerm !== undefined &&
      searchTerm.length > 2 &&
      (allData
        ? !checkConceptSearchResultAlreadyExists(allData, searchTerm)
        : !checkExists(checkItemAlreadyExists, searchTerm));

    if (!serviceStatus?.snowstorm.running && validSearch) {
      unavailableErrorHandler('search', 'Snowstorm');
    }
    const call = serviceStatus?.snowstorm.running !== undefined && validSearch;

    return call;
  };

  const { isLoading, data, error, isFetching } = useQuery({
    queryKey: [`concept-${searchTerm}-${branch}-${providedEcl}`],
    queryFn: () => {
      if (searchFilter === 'Term') {
        return ConceptService.searchConcept(
          encodeURIComponent(searchTerm),
          branch,
          providedEcl,
        );
      } else if (
        searchFilter === 'Sct Id' &&
        isSctIds(parseSearchTermsSctId(searchTerm))
      ) {
        const terms = parseSearchTermsSctId(searchTerm);
        return ConceptService.searchUnpublishedConceptByIds(
          terms,
          branch,
          providedEcl,
        );
      } else if (searchFilter === 'Artg Id') {
        return ConceptService.searchConceptByArtgId(
          searchTerm,
          branch,
          providedEcl,
        );
      } else {
        return emptySnowstormResponse;
      }
    },
    staleTime: 20 * (60 * 1000),
    enabled: shouldCall(),
  });

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error, serviceStatus]);

  return { isLoading, data, error, isFetching };
}

function checkExists(
  checkItemAlreadyExists: ((search: string) => boolean) | boolean,
  string: string,
): boolean {
  if (typeof checkItemAlreadyExists === 'function') {
    // If checkItemAlreadyExists is a function, call it and return the result
    return checkItemAlreadyExists(string);
  } else {
    // If checkItemAlreadyExists is a boolean value, return it directly
    return checkItemAlreadyExists;
  }
}

export function useSearchConceptOntoServerByUrl(
  searchTerm: string | undefined,
  url: string | undefined,
  showDefaultOptions?: boolean,
) {
  const { applicationConfig } = useApplicationConfigStore();

  const shouldCall = () => {
    const validConfig =
      applicationConfig?.fhirServerBaseUrl !== undefined &&
      applicationConfig.fhirServerExtension !== undefined;

    const validSearch = searchTerm !== undefined && searchTerm.length > 2;

    return validConfig && (showDefaultOptions || validSearch);
  };

  const { isLoading, data, error, isFetching } = useQuery<ValueSet, AxiosError>(
    {
      queryKey: [`onto-concept-url-${searchTerm}`],
      queryFn: () => {
        return OntoserverService.searchConceptByUrl(
          applicationConfig.fhirServerBaseUrl,
          url,
          applicationConfig.fhirRequestCount,
          searchTerm,
        );
      },
      staleTime: 20 * (60 * 1000),
      enabled: shouldCall(),
    },
  );

  return { isLoading, data, error, isFetching };
}

export function useSearchConceptBySctIdList(
  searchTerms: string[],
  branch: string,
  fieldBindings: FieldBindings,
): UseCombineSearchResultsType {
  const { serviceStatus } = useServiceStatus();

  const conceptsSearchTerms = searchTerms.join(' OR ');
  let ecl = generateEclFromBinding(fieldBindings, 'product.search.ctpp');

  const eclSplit = ecl.split('[values]');
  ecl = eclSplit.join(conceptsSearchTerms);

  const encodedEcl = encodeURIComponent(ecl);

  // const ontoShouldCall = (searchTerms: string[]) => {
  //   const validSearch = searchTerms !== undefined && searchTerms.length > 0;
  //
  //   return validSearch;
  // };

  const {
    isLoading: ontoLoading,
    data: ontoData,
    error: ontoError,
    isFetching: ontoFetching,
  } = useSearchConceptOntoserver(
    encodedEcl,
    undefined,
    undefined,
    undefined,
    undefined,
  );

  const shouldCall = () => {
    const validSearch = searchTerms !== undefined && searchTerms.length > 0;

    if (!serviceStatus?.snowstorm.running && validSearch) {
      unavailableErrorHandler('search', 'Snowstorm');
    }
    const call = serviceStatus?.snowstorm.running !== undefined && validSearch;
    return call;
  };

  const { isLoading, data, error, isFetching } = useQuery<
    ConceptResponse,
    AxiosError
  >({
    queryKey: [`concept-${searchTerms.toLocaleString()}-${branch}`],
    queryFn: () => {
      return ConceptService.searchUnPublishedCtppsByIds(
        searchTerms,
        branch,
        fieldBindings,
      );
    },

    staleTime: 20 * (60 * 1000),
    enabled: shouldCall(),
  });

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error, serviceStatus]);
  return useCombineSearchResults(
    isLoading,
    isFetching,
    data,
    error,
    ontoLoading,
    ontoFetching,
    ontoData,
    ontoError,
  );
  // return { isLoading, data, error, fetchStatus };
}

export function useSearchConceptByArtgIdList(
  searchTerms: string,
  branch: string,
  fieldBindings: FieldBindings,
): UseCombineSearchResultsType {
  const { serviceStatus } = useServiceStatus();

  const ecl = generateEclFromBinding(fieldBindings, 'product.search');
  const encodedEcl = encodeURIComponent(ecl);
  const {
    isLoading: ontoLoading,
    data: ontoData,
    error: ontoError,
    isFetching: ontoFetching,
  } = useSearchConceptOntoserver(
    encodedEcl,
    searchTerms,
    'Artg Id',
    undefined,
    undefined,
  );

  const shouldCall = () => {
    const validSearch = searchTerms !== undefined && searchTerms.length > 0;

    if (!serviceStatus?.snowstorm.running && validSearch) {
      unavailableErrorHandler('search', 'Snowstorm');
    }
    const call = serviceStatus?.snowstorm.running !== undefined && validSearch;
    return call;
  };

  const { isLoading, data, error, isFetching } = useQuery<
    ConceptResponse,
    AxiosError
  >({
    queryKey: [`concept-artgid-${searchTerms}-${branch}`],
    queryFn: () => {
      return ConceptService.searchConceptByArtgId(
        searchTerms,
        branch,
        encodedEcl,
      );
    },

    staleTime: 20 * (60 * 1000),
    enabled: shouldCall(),
  });

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error, serviceStatus]);
  return useCombineSearchResults(
    isLoading,
    isFetching,
    data,
    error,
    ontoLoading,
    ontoFetching,
    ontoData,
    ontoError,
  );
  // return { isLoading, data, error, fetchStatus };
}

export function useSearchConceptByTerm(
  searchTerm: string,
  branch: string,
  providedEcl: string,
): UseCombineSearchResultsType {
  const { serviceStatus } = useServiceStatus();

  const {
    isLoading: ontoLoading,
    data: ontoData,
    error: ontoError,
    isFetching: ontoFetching,
  } = useSearchConceptOntoserver(providedEcl, searchTerm, undefined);

  const shouldCall = () => {
    const validSearch = searchTerm !== undefined && searchTerm.length > 2;

    if (!serviceStatus?.snowstorm.running && validSearch) {
      unavailableErrorHandler('search', 'Snowstorm');
    }
    const call = serviceStatus?.snowstorm.running !== undefined && validSearch;
    return call;
  };

  const { isLoading, data, error, isFetching } = useQuery<
    ConceptResponse,
    AxiosError
  >({
    queryKey: [`concept-${searchTerm}-${branch}}`],
    queryFn: () => {
      return ConceptService.searchConcept(searchTerm, branch, providedEcl);
    },
    staleTime: 20 * (60 * 1000),
    enabled: shouldCall(),
  });

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error, serviceStatus]);

  return useCombineSearchResults(
    isLoading,
    isFetching,
    data,
    error,
    ontoLoading,
    ontoFetching,
    ontoData,
    ontoError,
  );
}

export function useSearchConceptById(
  id: string | null | undefined,
  branch: string,
) {
  const { serviceStatus } = useServiceStatus();
  const { isLoading, data, error } = useQuery({
    queryKey: [`concept-${id}-${branch}`],
    queryFn: () => {
      return ConceptService.searchConceptById(id as string, branch);
    },

    staleTime: 20 * (60 * 1000),
    enabled:
      id !== undefined &&
      branch !== undefined &&
      serviceStatus?.snowstorm.running,
  });

  return { isLoading, data, error };
}

/**
 * Using progressive caching strategy
 * @param ids
 * @param branch
 */

export function useSearchConceptByIds(
  ids: string[] | undefined,
  branch: string,
) {
  const { serviceStatus } = useServiceStatus();
  const queryClient = useQueryClient();

  // Deduplicate and sort the ids
  const distinctIds = useMemo(() => [...new Set(ids || [])].sort(), [ids]);

  const { cachedDataMap, missedIds } = useMemo(() => {
    const dataMap: Record<string, Concept | undefined> = {};
    const missedIdsList: string[] = [];

    distinctIds.forEach(id => {
      const cachedData = queryClient.getQueryData<Concept>(
        generateCacheKey(id, branch),
      );
      if (cachedData) {
        dataMap[id] = cachedData;
      } else {
        missedIdsList.push(id);
      }
    });

    return { cachedDataMap: dataMap, missedIds: missedIdsList };
  }, [distinctIds, queryClient, branch]);

  // Fetch missed IDs in a single API call
  const { data: fetchedData } = useQuery({
    queryKey: ['concept-list', branch, missedIds],
    queryFn: async () => {
      if (missedIds.length > 0) {
        const result = await ConceptService.searchConceptsByIds(
          missedIds,
          branch,
        );
        result.forEach(concept => {
          queryClient.setQueryData<Concept>(
            generateCacheKey(concept.id as string, branch),
            concept,
          );
        });
        return result;
      }
      return [];
    },
    staleTime: 60 * (60 * 1000), //1 hour
    enabled:
      missedIds.length > 0 &&
      !!branch &&
      (serviceStatus as ServiceStatus)?.snowstorm.running,
  });

  // Combine cached data with newly fetched data
  const combinedData = distinctIds
    .map(
      id =>
        cachedDataMap[id] || fetchedData?.find(concept => concept.id === id),
    )
    .filter((concept): concept is Concept => concept !== undefined);

  const isLoading = !fetchedData && missedIds.length > 0;
  const isError = fetchedData === undefined && missedIds.length > 0;
  const error = isError ? new Error('Failed to fetch missed concepts') : null;

  return {
    isConceptLoading: isLoading,
    isError,
    error,
    conceptData: combinedData,
  };
}

interface UseCombineSearchResultsType {
  snowstormIsLoading: boolean;
  snowstormIsFetching: boolean;
  snowstormData: ConceptResponse | undefined;
  snowstormError: AxiosError | null;
  ontoData: ValueSet | undefined;
  ontoLoading: boolean;
  ontoFetching: boolean;
  ontoError: AxiosError | null;
  allData: ConceptSearchResult[];
}

const useCombineSearchResults = (
  snowstormIsLoading: boolean,
  snowstormIsFetching: boolean,
  snowstormData: ConceptResponse | undefined,
  snowstormError: AxiosError | null,
  ontoLoading: boolean,
  ontoFetching: boolean,
  ontoData: ValueSet | undefined,
  ontoError: AxiosError | null,
): UseCombineSearchResultsType => {
  const [ontoResults, setOntoResults] = useState<Concept[]>([]);
  const { applicationConfig } = useApplicationConfigStore();
  const [allData, setAllData] = useState<ConceptSearchResult[]>([]);

  useEffect(() => {
    const tempOntoData =
      ontoData?.expansion?.contains !== undefined
        ? convertFromValueSetExpansionContainsListToSnowstormConceptMiniList(
            ontoData.expansion.contains,
            applicationConfig.fhirPreferredForLanguage,
          )
        : ([] as Concept[]);

    setOntoResults(tempOntoData);
  }, [ontoData, applicationConfig.fhirPreferredForLanguage]);

  useEffect(() => {
    if (ontoResults || snowstormData) {
      let tempAllData: ConceptSearchResult[] = [];
      if (ontoResults) {
        tempAllData = [
          ...ontoResults.map(item => ({
            ...item,
            type: PUBLISHED_CONCEPTS,
          })),
        ];
      }
      if (snowstormData) {
        const tempArr = snowstormData?.items.map(item => ({
          ...item,
          type: UNPUBLISHED_CONCEPTS,
        }));
        tempAllData.push(...tempArr);
      }
      setAllData(tempAllData);
    }
  }, [ontoResults, snowstormData]);

  return {
    snowstormIsLoading: snowstormIsLoading,
    snowstormIsFetching: snowstormIsFetching,
    snowstormData: snowstormData,
    snowstormError: snowstormError,
    ontoData: ontoData,
    ontoLoading: ontoLoading,
    ontoFetching: ontoFetching,
    ontoError: ontoError,
    allData: allData,
  };
};

const checkConceptSearchResultAlreadyExists = (
  allData: ConceptSearchResult[],
  str: string,
) => {
  const result = allData.filter(concept => {
    if (isValueSetExpansionContains(concept)) {
      return (
        str.includes(concept.code as string) ||
        str.includes(concept.display as string)
      );
    } else {
      return (
        str.includes(concept.conceptId as string) ||
        str.includes(concept.pt?.term as string) ||
        str.includes(concept.fsn?.term as string)
      );
    }
  });
  return result.length > 0 ? true : false;
};

const generateCacheKey = (id: string, branch: string) =>
  [`concept-${branch}`, id] as const;
