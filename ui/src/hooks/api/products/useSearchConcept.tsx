import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService';
import { isSctId } from '../../../utils/helpers/conceptUtils';
import { useEffect } from 'react';
import {
  snowstormErrorHandler,
  unavailableErrorHandler,
} from '../../../types/ErrorHandler.ts';
import { useServiceStatus } from '../useServiceStatus.tsx';

export function useSearchConcept(
  searchFilter: string | undefined,
  searchTerm: string,
  checkItemAlreadyExists: (search: string) => boolean,
  branch: string,
  providedEcl: string,
) {
  const { serviceStatus } = useServiceStatus();

  const shouldCall = () => {
    const validSearch =
      searchTerm !== undefined &&
      searchTerm.length > 2 &&
      !checkItemAlreadyExists(searchTerm);

    if (!serviceStatus?.snowstorm.running && validSearch) {
      unavailableErrorHandler('search', 'Snowstorm');
    }
    return serviceStatus?.snowstorm.running && validSearch;
  };

  const { isLoading, data, error } = useQuery(
    [`concept-${searchTerm}-${branch}-${providedEcl}`],
    () => {
      if (searchFilter === 'Term') {
        return ConceptService.searchConcept(searchTerm, branch, providedEcl);
      } else if (searchFilter === 'Sct Id' && isSctId(searchTerm)) {
        return ConceptService.searchConceptByIds(
          [searchTerm],
          branch,
          providedEcl,
        );
      } else if (searchFilter === 'Artg Id') {
        return ConceptService.searchConceptByArtgId(searchTerm, branch);
      } else {
        return [];
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
  }, [error]);
  return { isLoading, data, error };
}
