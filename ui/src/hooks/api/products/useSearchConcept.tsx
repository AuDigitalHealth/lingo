import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService';
import { Concept, ProductModel } from '../../../types/concept';
import { isArtgId, isSctId } from '../../../utils/helpers/conceptUtils';

export function useSearchConcept(
  searchFilter: string | undefined,
  searchTerm: string,
  checkItemAlreadyExists: (search: string) => boolean,
) {
  const { isLoading, data, error } = useQuery(
    [`concept-${searchTerm}`],
    () => {
      if (searchFilter === 'Term') {
        return ConceptService.searchConcept(searchTerm);
      } else if (searchFilter === 'Sct Id' && isSctId(searchTerm)) {
        return ConceptService.searchConceptById(searchTerm);
      } else {
        return ConceptService.searchConceptByArtgId(searchTerm);
      }
    },
    {
      staleTime: 20 * (60 * 1000),
      enabled: searchTerm.length > 2 && !checkItemAlreadyExists(searchTerm),
    },
  );

  return { isLoading, data, error };
}
