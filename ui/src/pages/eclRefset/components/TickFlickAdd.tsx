import { useEffect, useState } from 'react';
import { useAddMembersBulk } from '../../../hooks/eclRefset/useUpdateRefsetMember.tsx';
import { enqueueSnackbar } from 'notistack';
import { Query, useQueryClient } from '@tanstack/react-query';
import TickFlickSearchModal from './TickFlickSearchModal.tsx';
import { Button } from '@mui/material';
import PlusCircleOutlined from '@ant-design/icons/lib/icons/PlusCircleOutlined';
import useUserTaskByIds from '../../../hooks/eclRefset/useUserTaskByIds.tsx';
import useUserStore from '../../../stores/UserStore.ts';

interface TickFlickAddProps {
  branch: string;
  referenceSet: string;
}

export default function TickFlickAdd({
  branch,
  referenceSet,
}: TickFlickAddProps) {
  const task = useUserTaskByIds();
  const { login } = useUserStore();
  const queryClient = useQueryClient();

  const addMemberMutation = useAddMembersBulk(branch, referenceSet);
  const {
    isSuccess: isAddSuccess,
    isPending: isAddPending,
    reset: resetAdd,
  } = addMemberMutation;
  useEffect(() => {
    if (isAddSuccess) {
      enqueueSnackbar(`Reference set updated successfully.`, {
        variant: 'success',
        autoHideDuration: 5000,
      });

      resetAdd();
      setAddModalOpen(false);

      queryClient
        .invalidateQueries({
          predicate: (query: Query) =>
            (query.queryKey[0] as string).startsWith(
              `concept-${branch}-^ ${referenceSet}`,
            ),
        })
        .catch(console.error);
    }
  }, [isAddSuccess, branch, referenceSet, resetAdd, queryClient]);

  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        color="success"
        startIcon={<PlusCircleOutlined />}
        sx={{ marginLeft: 'auto' }}
        disabled={login !== task?.assignee.username}
        onClick={() => setAddModalOpen(true)}
      >
        Add
      </Button>
      <TickFlickSearchModal
        branch={branch}
        open={addModalOpen}
        setOpen={setAddModalOpen}
        action="add"
        title="Add Members"
        isActionLoading={isAddPending}
        isActionSuccess={isAddSuccess}
        onConceptsValidated={conceptIds => addMemberMutation.mutate(conceptIds)}
      />
    </>
  );
}
