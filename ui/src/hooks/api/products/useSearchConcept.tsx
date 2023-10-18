import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService';
import { isSctId } from '../../../utils/helpers/conceptUtils';

export function useSearchConcept(
  searchFilter: string | undefined,
  searchTerm: string,
  checkItemAlreadyExists: (search: string) => boolean,
  providedEcl?: string,
) {
  const { isLoading, data, error } = useQuery(
    [`concept-${searchTerm}`],
    () => {
      if (searchFilter === 'Term') {
        return ConceptService.searchConcept(searchTerm, providedEcl);
      } else if (searchFilter === 'Sct Id' && isSctId(searchTerm)) {
        return ConceptService.searchConceptById(searchTerm, providedEcl);
      } else {
        return ConceptService.searchConceptByArtgId(searchTerm);
      }
    },
    {
      cacheTime: 0,
      staleTime: 20 * (60 * 1000),
      enabled:
        searchTerm !== undefined &&
        searchTerm.length > 2 &&
        !checkItemAlreadyExists(searchTerm),
    },
  );

  return { isLoading, data, error };
}
