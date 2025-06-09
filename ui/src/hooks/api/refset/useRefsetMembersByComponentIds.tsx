import { useQuery } from '@tanstack/react-query';

import { useServiceStatus } from '../useServiceStatus.tsx';
import RefsetMembersService from '../../../api/RefsetMembersService.ts';

export function useRefsetMembersByComponentIds(
  branch: string,
  referencedComponentIds: string[] | undefined,
  options?: { enabled?: boolean },
) {
  const { serviceStatus } = useServiceStatus();
  const distinctIds = [...new Set(referencedComponentIds)];

  const { isLoading, data, error } = useQuery({
    queryKey: [
      `refsetMembers-componentById-${distinctIds.join('-')}-${branch}`,
    ],
    queryFn: () => {
      if (distinctIds.length > 0)
        return RefsetMembersService.getRefsetMembersByComponentIds(
          branch,
          distinctIds,
        );
      return null;
    },
    staleTime: 20 * (60 * 1000),
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : distinctIds !== undefined &&
          distinctIds.length > 0 &&
          branch !== undefined &&
          serviceStatus?.snowstorm.running,
  });

  return {
    isRefsetLoading: isLoading,
    refsetData: data?.items,
    refsetError: error,
  };
}
