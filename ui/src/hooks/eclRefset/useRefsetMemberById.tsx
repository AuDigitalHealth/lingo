import { useQuery } from '@tanstack/react-query';
import RefsetMembersService from '../../api/RefsetMembersService.ts';
import { useEffect } from 'react';
import {
  snowstormErrorHandler,
} from '../../types/ErrorHandler.ts';
import { useServiceStatus } from '../api/useServiceStatus.tsx';

export function useRefsetMemberById(
  branch: string,
  memberId: string | undefined
) {
  const { serviceStatus } = useServiceStatus();


  const { isLoading, data, error, refetch, isFetching } = useQuery(
    [`refsetMembers-${branch}-${memberId}`],
    () => {
      if (memberId !== undefined) return RefsetMembersService.getRefsetMemberById(branch, memberId);
      return null;
    },
    {
      staleTime: 20 * (60 * 1000),
    },
  );

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Search Failed', serviceStatus);
    }
  }, [error, serviceStatus]);

  return { 
    isRefsetMemberLoading: isLoading, 
    refsetMemberData: data, 
    refsetMemberError: error, 
    refetchRefsetMember: refetch ,
    isRefsetMemberFetching: isFetching 
  };
}
