import { useMutation, useQuery } from '@tanstack/react-query';
import RefsetMembersService from '../../api/RefsetMembersService.ts';
import { RefsetMember } from '../../types/RefsetMember.ts';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import { useEffect } from 'react';
import { useServiceStatus } from '../api/useServiceStatus.tsx';
import { enqueueSnackbar } from 'notistack';

export function useUpdateRefsetMember(branch: string) {
  const mutation = useMutation({
    mutationFn: (newMember: RefsetMember) => {
      return RefsetMembersService.updateRefsetMember(branch, newMember);
    },
  });

  return mutation;
}

export function useCreateRefsetMember(branch: string) {
  const mutation = useMutation({
    mutationFn: (newMember: RefsetMember) => {
      return RefsetMembersService.createRefsetMember(branch, newMember);
    },
  });

  return mutation;
}

export function useRetireMembersBulk(branch: string, referenceSet: string) {
  const { serviceStatus } = useServiceStatus();
  const mutation = useMutation({
    mutationFn: async (conceptIds: string[]) => {
      if (!conceptIds.length) return null;

      const members = await RefsetMembersService.searchRefsetMembersBatched(
        branch,
        referenceSet,
        conceptIds,
        {
          active: true,
        },
      );

      return RefsetMembersService.bulkUpdate(
        branch,
        members.map(member => ({ ...member, active: false })),
      );
    },
  });

  const bulkUpdateLocation = mutation.data;

  const bulkQuery = useBulkStatus(branch, bulkUpdateLocation);

  useEffect(() => {
    if (mutation.error) {
      snowstormErrorHandler(
        mutation.error,
        'Refset update failed',
        serviceStatus,
      );
    }
  }, [mutation.error, serviceStatus]);

  return {
    mutate: mutation.mutate,
    reset: mutation.reset,
    isSuccess: mutation.isSuccess && bulkQuery.isSuccess,
    isPending: mutation.isPending || bulkQuery.isFetching,
  };
}

export function useAddMembersBulk(branch: string, referenceSet: string) {
  const { serviceStatus } = useServiceStatus();
  const mutation = useMutation({
    mutationFn: async (conceptIds: string[]) => {
      if (!conceptIds.length) return null;

      const members = await RefsetMembersService.searchRefsetMembersBatched(
        branch,
        referenceSet,
        conceptIds,
      );

      const membersBulkUpdate: RefsetMember[] = [];

      conceptIds.forEach(conceptId => {
        const membersFound = members.filter(
          m => m.referencedComponentId === conceptId,
        );
        if (membersFound.length) {
          membersBulkUpdate.push(
            ...membersFound
              .filter(m => !m.active)
              .map(m => ({ ...m, active: true })),
          );
        } else {
          membersBulkUpdate.push({
            active: true,
            referencedComponentId: conceptId,
            refsetId: referenceSet,
          });
        }
      });

      return RefsetMembersService.bulkUpdate(branch, membersBulkUpdate);
    },
  });

  const bulkUpdateLocation = mutation.data;

  const bulkQuery = useBulkStatus(branch, bulkUpdateLocation);

  useEffect(() => {
    if (mutation.error) {
      snowstormErrorHandler(
        mutation.error,
        'Refset update failed',
        serviceStatus,
      );
    }
  }, [mutation.error, serviceStatus]);

  return {
    mutate: mutation.mutate,
    reset: mutation.reset,
    isSuccess: mutation.isSuccess && bulkQuery.isSuccess,
    isPending: mutation.isPending || bulkQuery.isFetching,
  };
}

export function useReplaceMembersBulk(branch: string, referenceSet: string) {
  const { serviceStatus } = useServiceStatus();
  const mutation = useMutation({
    mutationFn: async ({
      retireConceptIds,
      addConceptIds,
    }: {
      retireConceptIds: string[];
      addConceptIds: string[];
    }) => {
      if (!retireConceptIds.length && !addConceptIds.length) return null;

      const members = await RefsetMembersService.searchRefsetMembersBatched(
        branch,
        referenceSet,
        [...retireConceptIds, ...addConceptIds],
      );

      const membersBulkUpdate: RefsetMember[] = [];

      retireConceptIds
        .filter(c => !addConceptIds.includes(c))
        .forEach(conceptId => {
          const membersFound = members.filter(
            m => m.referencedComponentId === conceptId,
          );
          membersBulkUpdate.push(
            ...membersFound.map(member => ({ ...member, active: false })),
          );
        });

      addConceptIds
        .filter(c => !retireConceptIds.includes(c))
        .forEach(conceptId => {
          const membersFound = members.filter(
            m => m.referencedComponentId === conceptId,
          );
          if (membersFound.length) {
            membersBulkUpdate.push(
              ...membersFound
                .filter(m => !m.active)
                .map(m => ({ ...m, active: true })),
            );
          } else {
            membersBulkUpdate.push({
              active: true,
              referencedComponentId: conceptId,
              refsetId: referenceSet,
            });
          }
        });

      return RefsetMembersService.bulkUpdate(branch, membersBulkUpdate);
    },
  });

  const bulkUpdateLocation = mutation.data;

  const bulkQuery = useBulkStatus(branch, bulkUpdateLocation);

  useEffect(() => {
    if (mutation.error) {
      snowstormErrorHandler(
        mutation.error,
        'Refset update failed',
        serviceStatus,
      );
    }
  }, [mutation.error, serviceStatus]);

  return {
    mutate: mutation.mutate,
    reset: mutation.reset,
    isSuccess: mutation.isSuccess && bulkQuery.isSuccess,
    isPending: mutation.isPending || bulkQuery.isFetching,
  };
}

function useBulkStatus(
  branch: string,
  bulkUpdateLocation: string | undefined | null,
) {
  const bulkStatus = useQuery({
    queryKey: [`refsetMember-bulk-${bulkUpdateLocation}`],
    queryFn: async () => {
      if (!bulkUpdateLocation) return null;
      const rsp = await RefsetMembersService.bulkStatus(
        branch,
        bulkUpdateLocation,
      );
      if (rsp.status !== 'COMPLETED') {
        throw new Error(rsp.status);
      }
      return rsp;
    },
    retry: (failureCount, error) => {
      return error.message === 'RUNNING';
    },
    enabled: !!bulkUpdateLocation,
  });

  useEffect(() => {
    if (bulkStatus.error) {
      enqueueSnackbar(`Refset update failed: ${bulkStatus.error?.message}`, {
        variant: 'error',
      });
    }
  }, [bulkStatus.error]);

  return bulkStatus;
}
