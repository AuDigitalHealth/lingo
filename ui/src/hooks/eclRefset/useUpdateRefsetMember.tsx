import { useMutation } from '@tanstack/react-query';
import RefsetMembersService from '../../api/RefsetMembersService.ts';
import { RefsetMember } from '../../types/RefsetMember.ts';

export function useUpdateRefsetMember(
  branch: string
) {
  const mutation = useMutation({
    mutationFn: (newMember: RefsetMember) => {
      return RefsetMembersService.updateRefsetMember(branch, newMember);
    },
  });

  return mutation;
}
