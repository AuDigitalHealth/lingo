import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService';
import { ProductModel } from '../../../types/concept';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore.ts';

export function useConceptModel(
  id: string | undefined,
  reloadStateElements: () => void,
  setProductModel: (data: ProductModel) => void,
) {
  const { isLoading, data } = useQuery(
    [`concept-${id}`],
    () => {
      return ConceptService.getConceptModel(
        id as string,
        useApplicationConfigStore.getState().applicationConfig
          ?.apDefaultBranch as string,
      );
    },
    { staleTime: 20 * (60 * 1000) },
  );

  useMemo(() => {
    if (data) {
      reloadStateElements();
      setProductModel(data);
    }
  }, [data]);

  return { isLoading, data };
}
