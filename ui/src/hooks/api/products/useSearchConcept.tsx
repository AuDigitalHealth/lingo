import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService';
import { useEffect, useState } from 'react';
import {
  snowstormErrorHandler,
  unavailableErrorHandler,
} from '../../../types/ErrorHandler.ts';
import { useServiceStatus } from '../useServiceStatus.tsx';
import { parseSearchTermsSctId } from '../../../components/ConceptSearchSidebar.tsx';
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

export function useSearchConceptOntoserver(
  providedEcl: string,
  searchTerm: string | undefined,
  searchFilter: string | undefined,
  allData?: ConceptSearchResult[],
  showDefaultOptions?: boolean,
  shouldCallProp?: () => boolean,
) {
  const { applicationConfig } = useApplicationConfigStore();

  const shouldCall = () => {
    if (shouldCallProp !== undefined) {
      return shouldCallProp();
    }

    const validConfig =
      applicationConfig?.fhirServerBaseUrl !== undefined &&
      applicationConfig.fhirServerExtension !== undefined;

    const validSearch =
      searchTerm !== undefined &&
      searchTerm.length > 2 &&
      !(allData && checkConceptSearchResultAlreadyExists(allData, searchTerm));

    return validConfig && (showDefaultOptions || validSearch);
  };

  const { isLoading, data, error, isFetching } = useQuery(
    [`onto-concept-${searchTerm}-${providedEcl}`],
    () => {
      if (searchFilter === 'Term') {
        return OntoserverService.searchConcept(
          applicationConfig.fhirServerBaseUrl as string,
          applicationConfig.fhirServerExtension as string,
          providedEcl,
          searchTerm,
        );
      } else if (
        searchFilter === 'Sct Id' &&
        isSctIds(parseSearchTermsSctId(searchTerm))
      ) {
        const terms = parseSearchTermsSctId(searchTerm);
        return OntoserverService.searchConceptByIds(
          applicationConfig.fhirServerBaseUrl as string,
          applicationConfig.fhirServerExtension as string,
          terms,
          providedEcl,
        );
      } else if (searchFilter === 'Artg Id') {
        return OntoserverService.searchByArtgid(
          applicationConfig.fhirServerBaseUrl as string,
          applicationConfig.fhirServerExtension as string,
          searchTerm,
          providedEcl,
        );
      } else if (searchFilter === undefined) {
        return OntoserverService.searchConcept(
          applicationConfig.fhirServerBaseUrl as string,
          applicationConfig.fhirServerExtension as string,
          providedEcl,
          searchTerm,
        );
      }
    },
    {
      cacheTime: 20 * (60 * 1000),
      staleTime: 20 * (60 * 1000),
      enabled: shouldCall(),
    },
  );

  // useEffect(() => {
  //   if (error) {
  //     snowstormErrorHandler(error, 'Search Failed', serviceStatus);
  //   }
  // }, [error, serviceStatus]);

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

  const { isLoading, data, error, isFetching } = useQuery(
    [`concept-${searchTerm}-${branch}-${providedEcl}`],
    () => {
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
        console.log('ecl onto');
        console.log(providedEcl);
        const terms = parseSearchTermsSctId(searchTerm);
        return ConceptService.searchConceptByIds(terms, branch, providedEcl);
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
    {
      cacheTime: 0,
      staleTime: 20 * (60 * 1000),
      enabled: shouldCall(),
    },
  );

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

export function useSearchConceptByList(
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

  const ontoShouldCall = (searchTerms: string[]) => {
    const validSearch = searchTerms !== undefined && searchTerms.length > 0;

    return validSearch;
  };

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
    () => ontoShouldCall(searchTerms),
  );

  const shouldCall = () => {
    const validSearch = searchTerms !== undefined && searchTerms.length > 0;

    if (!serviceStatus?.snowstorm.running && validSearch) {
      unavailableErrorHandler('search', 'Snowstorm');
    }
    const call = serviceStatus?.snowstorm.running !== undefined && validSearch;
    return call;
  };

  const { isLoading, data, error, isFetching } = useQuery(
    [`concept-${searchTerms.toLocaleString()}-${branch}`],
    () => {
      return ConceptService.searchConceptsByIdsList(
        searchTerms,
        branch,
        fieldBindings,
      );
    },
    {
      cacheTime: 0,
      staleTime: 20 * (60 * 1000),
      enabled: shouldCall(),
    },
  );

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

  const { isLoading, data, error, isFetching } = useQuery(
    [`concept-${searchTerm}-${branch}}`],
    () => {
      return ConceptService.searchConcept(searchTerm, branch, providedEcl);
    },
    {
      cacheTime: 0,
      staleTime: 20 * (60 * 1000),
      enabled: shouldCall(),
    },
  );

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

export function useSearchConceptById(
  id: string | null | undefined,
  branch: string,
) {
  const { serviceStatus } = useServiceStatus();

  const { isLoading, data, error } = useQuery(
    [`concept-${id}`],
    () => {
      return ConceptService.searchConceptById(id as string, branch);
    },
    {
      cacheTime: 0,
      staleTime: 20 * (60 * 1000),
      enabled:
        id !== undefined &&
        branch !== undefined &&
        serviceStatus?.snowstorm.running,
    },
  );

  return { isLoading, data, error };
}

interface UseCombineSearchResultsType {
  snowstormIsLoading: boolean;
  snowstormIsFetching: boolean;
  snowstormData: ConceptResponse | undefined;
  snowstormError: unknown;
  ontoData: ValueSet | undefined;
  ontoLoading: boolean;
  ontoFetching: boolean;
  ontoError: unknown;
  allData: ConceptSearchResult[];
}

const useCombineSearchResults = (
  snowstormIsLoading: boolean,
  snowstormIsFetching: boolean,
  snowstormData: ConceptResponse | undefined,
  snowstormError: unknown,
  ontoLoading: boolean,
  ontoFetching: boolean,
  ontoData: ValueSet | undefined,
  ontoError: unknown,
): UseCombineSearchResultsType => {
  const [ontoResults, setOntoResults] = useState<Concept[]>([]);

  const [allData, setAllData] = useState<ConceptSearchResult[]>([]);

  useEffect(() => {
    const tempOntoData =
      ontoData?.expansion?.contains !== undefined
        ? convertFromValueSetExpansionContainsListToSnowstormConceptMiniList(
            ontoData.expansion.contains,
          )
        : ([] as Concept[]);

    setOntoResults(tempOntoData);
  }, [ontoData]);

  useEffect(() => {
    if (ontoResults || snowstormData) {
      let tempAllData: ConceptSearchResult[] = [];
      if (ontoResults) {
        tempAllData = [
          ...ontoResults.map(item => ({
            ...item,
            type: 'OntoResponse',
          })),
        ];
      }
      if (snowstormData) {
        const tempArr = snowstormData?.items.map(item => ({
          ...item,
          type: 'SnowstormResponse',
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
