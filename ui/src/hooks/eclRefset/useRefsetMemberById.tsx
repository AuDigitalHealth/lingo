import { useQuery } from '@tanstack/react-query';
import RefsetMembersService from '../../api/RefsetMembersService.ts';
import { useEffect } from 'react';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import { useServiceStatus } from '../api/useServiceStatus.tsx';

export function useRefsetMemberById(
  branch: string,
  memberId: string | undefined,
) {
  const { serviceStatus } = useServiceStatus();

  const { data, error, refetch, isFetching } = useQuery({
    queryKey: [`refsetMembers-${branch}-${memberId}`],
    queryFn: () => {
      if (memberId !== undefined)
        return RefsetMembersService.getRefsetMemberById(branch, memberId);
      return null;
    },
    staleTime: 20 * (60 * 1000),
  });

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error, serviceStatus]);

  return {
    isRefsetMemberLoading: isFetching,
    refsetMemberData: data,
    refsetMemberError: error,
    refetchRefsetMember: refetch,
    isRefsetMemberFetching: isFetching,
  };
}
