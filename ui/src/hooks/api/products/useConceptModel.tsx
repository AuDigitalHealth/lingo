import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService';
import { ProductModel } from '../../../types/concept';

export function useConceptModel(
  id: string | undefined,
  reloadStateElements: () => void,
  setProductModel: (data: ProductModel) => void,
  branch: string,
) {
  const { isLoading, data } = useQuery(
    [`concept-model-${id}`],
    () => {
      return ConceptService.getConceptModel(id as string, branch);
    },
    {
      staleTime: 20 * (60 * 1000),
    },
  );

  useMemo(() => {
    if (data) {
      reloadStateElements();
      setProductModel(data);
    }
  }, [data]);

  return { isLoading, data };
}
