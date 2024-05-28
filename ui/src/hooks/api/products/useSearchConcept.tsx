import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService';
import { useEffect } from 'react';
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

export function useSearchConceptOntoserver(
  providedEcl: string,
  searchTerm: string,
  searchFilter: string | undefined,
  allData?: ConceptSearchResult[],
) {
  const shouldCall = () => {
    const validSearch =
      searchTerm !== undefined &&
      searchTerm.length > 2 &&
      !(allData && checkConceptSearchResultAlreadyExists(allData, searchTerm));

    return validSearch;
  };

  const { isLoading, data, error, isFetching } = useQuery(
    [`onto-concept-${searchTerm}-${providedEcl}`],
    () => {
      // if (searchFilter === 'Term') {
      return OntoserverService.searchConcept(providedEcl, searchTerm);
      // } else if (
      //   searchFilter === 'Sct Id' &&
      //   isSctIds(parseSearchTermsSctId(searchTerm))
      // ) {
      //   const terms = parseSearchTermsSctId(searchTerm);
      //   return ConceptService.searchConceptByIds(terms, branch, providedEcl);
      // } else if (searchFilter === 'Artg Id') {
      //   return ConceptService.searchConceptByArtgId(
      //     searchTerm,
      //     branch,
      //     providedEcl,
      //   );
      // } else {
      //   return emptySnowstormResponse;
      // }
    },
    {
      cacheTime: 0,
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
) {
  const { serviceStatus } = useServiceStatus();

  const shouldCall = () => {
    const validSearch = searchTerms !== undefined && searchTerms.length > 0;

    if (!serviceStatus?.snowstorm.running && validSearch) {
      unavailableErrorHandler('search', 'Snowstorm');
    }
    const call = serviceStatus?.snowstorm.running !== undefined && validSearch;
    return call;
  };

  const { isLoading, data, error, fetchStatus } = useQuery(
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
  return { isLoading, data, error, fetchStatus };
}

export function useSearchConceptByTerm(
  searchTerm: string,
  branch: string,
  providedEcl: string,
) {
  const { serviceStatus } = useServiceStatus();

  const shouldCall = () => {
    const validSearch = searchTerm !== undefined && searchTerm.length > 2;

    if (!serviceStatus?.snowstorm.running && validSearch) {
      unavailableErrorHandler('search', 'Snowstorm');
    }
    const call = serviceStatus?.snowstorm.running !== undefined && validSearch;
    return call;
  };

  const { isLoading, data, error, fetchStatus } = useQuery(
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

  return { isLoading, data, error, fetchStatus };
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

const checkConceptSearchResultAlreadyExists = (
  allData: ConceptSearchResult[],
  str: string,
) => {
  const result = allData.filter(concept => {
    if (isValueSetExpansionContains(concept.data)) {
      return (
        str.includes(concept.data.code as string) ||
        str.includes(concept.data.display as string)
      );
    } else {
      return (
        str.includes(concept.data.conceptId as string) ||
        str.includes(concept.data.pt?.term as string) ||
        str.includes(concept.data.fsn?.term as string)
      );
    }
  });
  return result.length > 0 ? true : false;
};
