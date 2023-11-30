import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService';
import { ProductModel } from '../../../types/concept';
import { errorHandler } from '../../../types/ErrorHandler.ts';

export function useConceptModel(
  id: string | undefined,
  reloadStateElements: () => void,
  setProductModel: (data: ProductModel) => void,
  branch: string,
) {
  const { isLoading, data, error } = useQuery(
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
  useEffect(() => {
    if (error) {
      errorHandler(error, 'Loading concept failed');
    }
  }, [error]);

  return { isLoading, data };
}
