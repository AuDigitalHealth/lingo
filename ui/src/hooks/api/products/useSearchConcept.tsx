import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService';
import { useEffect } from 'react';
import {
  snowstormErrorHandler,
  unavailableErrorHandler,
} from '../../../types/ErrorHandler.ts';
import { useServiceStatus } from '../useServiceStatus.tsx';
import { parseSearchTermsSctId } from '../../../components/ConceptSearchSidebar.tsx';

export function useSearchConcept(
  searchFilter: string | undefined,
  searchTerm: string,
  checkItemAlreadyExists: ((search: string) => boolean) | boolean,
  branch: string,
  providedEcl: string,
) {
  const { serviceStatus } = useServiceStatus();

  const shouldCall = () => {
    const validSearch =
      searchTerm !== undefined &&
      searchTerm.length > 2 &&
      !checkExists(checkItemAlreadyExists, searchTerm);

    if (!serviceStatus?.snowstorm.running && validSearch) {
      unavailableErrorHandler('search', 'Snowstorm');
    }
    const call = serviceStatus?.snowstorm.running !== undefined && validSearch;
    return call;
  };

  const { isLoading, data, error } = useQuery(
    [`concept-${searchTerm}-${branch}-${providedEcl}`],
    () => {
      if (searchFilter === 'Term') {
        console.log(providedEcl);
        return ConceptService.searchConcept(searchTerm, branch, providedEcl);
      } else if (searchFilter === 'Sct Id') {
        const terms = parseSearchTermsSctId(searchTerm);
        console.log(terms);
        return ConceptService.searchConceptByIds(terms, branch, providedEcl);
      } else {
        return ConceptService.searchConceptByArtgId(
          searchTerm,
          branch,
          providedEcl,
        );
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
  return { isLoading, data, error };
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

export function useSearchConceptByList(searchTerms: string[], branch: string) {
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
    [`concept-${searchTerms}-${branch}`],
    () => {
      return ConceptService.searchConceptsByIdsList(searchTerms, branch);
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
