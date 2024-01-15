import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService';
import { ProductModel } from '../../../types/concept';
import { snowstormErrorHandler } from '../../../types/ErrorHandler.ts';
import { useServiceStatus } from '../useServiceStatus.tsx';

export function useConceptModel(
  id: string | undefined,
  reloadStateElements: () => void,
  setProductModel: (data: ProductModel) => void,
  branch: string,
) {
  const {serviceStatus} = useServiceStatus();
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
      snowstormErrorHandler(error, 'Loading concept failed', serviceStatus);
    }
  }, [error]);

  return { isLoading, data };
}
