import { useQuery } from '@tanstack/react-query';
import RefsetMembersService from '../../api/RefsetMembersService.ts';
import { useEffect, useMemo } from 'react';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import { useServiceStatus } from '../api/useServiceStatus.tsx';
import useRefsetMemberStore from '../../stores/RefsetMemberStore.ts';

export function useRefsetMembers(branch: string) {
  const { serviceStatus } = useServiceStatus();
  const { setMembers } = useRefsetMemberStore();

  const { isLoading, isFetching, data, error, refetch } = useQuery(
    [`refsetMembers-${branch}`],
    () => {
      return RefsetMembersService.getRefsetMembers(branch);
    },
    {
      staleTime: 20 * (60 * 1000),
    },
  );

  useMemo(() => {
    setMembers(data?.items ?? []);
  }, [data, setMembers]);

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error, serviceStatus]);
  return { isLoading, isFetching, data, error, refetch };
}
