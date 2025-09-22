import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { snowstormErrorHandler } from '../../../types/ErrorHandler.ts';
import { useServiceStatus } from '../useServiceStatus.tsx';
import ProductService from '../../../api/ProductService.ts';

export function useNodeModel(
  conceptId: string | undefined,
  branch: string | undefined,
) {
  const { serviceStatus } = useServiceStatus();
  const { isLoading, data, error } = useQuery({
    queryKey: [`node-model-${branch}-${conceptId}`],
    queryFn: () => {
      return ProductService.getNode(conceptId as string, branch as string);
    },
    staleTime: 20 * (60 * 1000),
    enabled: !!conceptId && !!branch,
  });

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Loading concept failed', serviceStatus);
    }
  }, [error, serviceStatus]);

  return { isLoading, data };
}
