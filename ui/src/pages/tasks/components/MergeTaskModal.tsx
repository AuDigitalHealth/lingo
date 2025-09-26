import React, { useState } from 'react';
import {
  Button,
  Stack,
  Alert,
  AlertTitle,
  Typography,
  Box,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { CallMerge, Warning, Error, Cached } from '@mui/icons-material';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';
import { BranchState, Task, TaskStatus } from '../../../types/task';
import { enqueueSnackbar } from 'notistack';
import { useMergeTask } from '../../../hooks/api/task/useMergeTask';
import { useIntegrityCheck } from '../../../hooks/api/task/useMergeTask';

interface MergeTaskModalProps {
  task: Task | null | undefined;
  customSx?: object;
  isLoading?: boolean;
}

export default function MergeTaskModal({
  task,
  customSx,
  isLoading = false,
}: MergeTaskModalProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const integrityCheckMutation = useIntegrityCheck();
  const mergeTaskMutation = useMergeTask();

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!mergeTaskMutation.isPending) {
      setModalOpen(false);
    }
  };

  const handleConfirmMerge = async () => {
    try {
      if (!task) return;
      const projectKey = task?.branchPath?.split('/').slice(0, -1).join('/');

      const updatedTask = await mergeTaskMutation.mutateAsync(
        {
          projectKey: projectKey,
          taskKey: task?.branchPath,
          task,
        },
        {
          onSuccess: () => {
            integrityCheckMutation.mutate({ taskBranch: task?.branchPath });
          },
        },
      );

      setModalOpen(false);
      enqueueSnackbar('Task merged successfully!', {
        variant: 'success',
      });
    } catch (error) {
      enqueueSnackbar(
        'Error merging task. Please attempt in the authoring platform.',
        {
          variant: 'error',
        },
      );
    }
  };

  const canProceed = !mergeTaskMutation.isPending;
  const isMerging = mergeTaskMutation.isPending;

  return (
    <>
      <Button
        disabled={
          (task?.branchState !== BranchState.Behind &&
            task?.branchState !== BranchState.Diverged) ||
          isLoading
        }
        variant="contained"
        startIcon={<Cached />}
        sx={customSx}
        color="warning"
        onClick={handleOpenModal}
      >
        Rebase
      </Button>

      <BaseModal
        open={modalOpen}
        handleClose={!isMerging ? handleCloseModal : undefined}
        sx={{ minWidth: '500px', maxWidth: '700px' }}
      >
        <BaseModalHeader title="Rebase Task" />
        <BaseModalBody>
          <Stack spacing={2}>
            <Typography variant="body1">
              This will merge the latest changes from the main branch into your
              task branch. Do you want to proceed with the Rebase?
            </Typography>

            <Alert severity="info">
              <AlertTitle>Merge Information</AlertTitle>
              This action will update your task branch with the latest changes
              from the main branch. Any conflicts will need to be resolved
              manually in the authoring platform.
            </Alert>

            {/* Error message from mutation */}
            {mergeTaskMutation.isError && (
              <Alert severity="error">
                <AlertTitle>Rebase Failed</AlertTitle>
                {mergeTaskMutation.error?.message ||
                  'An error occurred during merge. Please try again.'}
              </Alert>
            )}
          </Stack>
        </BaseModalBody>
        <BaseModalFooter
          startChildren={<></>}
          endChildren={
            <Stack direction="row" spacing={1}>
              <LoadingButton
                variant="contained"
                loading={isMerging}
                disabled={!canProceed}
                onClick={handleConfirmMerge}
                color="primary"
                sx={{ color: '#fff' }}
              >
                Rebase Task
              </LoadingButton>
              <Button
                variant="contained"
                onClick={handleCloseModal}
                disabled={isMerging}
                color="error"
              >
                Cancel
              </Button>
            </Stack>
          }
        />
      </BaseModal>
    </>
  );
}
