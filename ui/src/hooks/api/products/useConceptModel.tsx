import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { snowstormErrorHandler } from '../../../types/ErrorHandler.ts';
import { useServiceStatus } from '../useServiceStatus.tsx';
import ProductService from '../../../api/ProductService.ts';

export function useConceptModel(
  id: string | undefined,
  reloadStateElements: () => void,
  branch: string,
) {
  const queryKey = `concept-model-${branch}-${id}`;
  console.log(`queryKey: ${queryKey}`);
  const { serviceStatus } = useServiceStatus();
  const { isLoading, data, error } = useQuery({
    queryKey: [queryKey],
    queryFn: () => {
      return ProductService.getProductModel(id as string, branch);
    },
    staleTime: 20 * (60 * 1000),
    enabled: !!id,
  });

  useMemo(() => {
    if (data) {
      reloadStateElements();
    }
  }, [data, reloadStateElements]);

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Loading concept failed', serviceStatus);
    }
  }, [error, serviceStatus]);

  return { isLoading, data };
}
