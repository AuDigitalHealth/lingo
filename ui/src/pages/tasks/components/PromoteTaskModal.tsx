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
import { CallMerge, Warning, Error } from '@mui/icons-material';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';
import { useCanPromoteTask } from '../../../hooks/api/task/useCanPromoteTask';
import { useAutoPromoteTask } from '../../../hooks/api/task/useAutoPromoteTask';
import { Task, TaskStatus } from '../../../types/task';
import { ConceptReview } from '../../../types/ConceptReview';
import { enqueueSnackbar } from 'notistack';

interface PromoteTaskModalProps {
  task: Task | null | undefined; // Should have projectKey and taskKey properties
  conceptReviews: ConceptReview[];
  hasUnsavedConcepts?: boolean;
  deletedCrsConceptFound?: boolean;
  customSx?: object;
  isLoading?: boolean;
}

export default function PromoteTaskModal({
  task,
  conceptReviews,
  hasUnsavedConcepts = false,
  deletedCrsConceptFound = false,
  customSx,
  isLoading = false,
}: PromoteTaskModalProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const { promotable, warnings, blockingIssues } = useCanPromoteTask({
    task,
    conceptReviews,
    hasUnsavedConcepts,
    deletedCrsConceptFound,
  });

  const autoPromoteMutation = useAutoPromoteTask();

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!autoPromoteMutation.isPending) {
      setModalOpen(false);
    }
  };

  const handleConfirmPromotion = async () => {
    try {
      if (!task) return;
      const updatedTask = await autoPromoteMutation.mutateAsync({
        projectKey: task?.projectKey,
        taskKey: task?.key,
      });

      setModalOpen(false);
    } catch (error) {
      enqueueSnackbar(
        'Error promoting task. Please attempt in the authoring platform.',
        {
          variant: 'error',
        },
      );
    }
  };

  const hasIssues = blockingIssues.length > 0 || warnings.length > 0;
  const canProceed =
    blockingIssues.length === 0 && !autoPromoteMutation.isPending;
  const isPromoting = autoPromoteMutation.isPending;

  return (
    <>
      <Button
        disabled={
          task?.status === TaskStatus.Completed ||
          task?.status === TaskStatus.Promoted ||
          isLoading
        }
        variant="contained"
        startIcon={<CallMerge />}
        sx={customSx}
        color="info"
        onClick={handleOpenModal}
      >
        Begin Promotion Automation
      </Button>

      <BaseModal
        open={modalOpen}
        handleClose={!isPromoting ? handleCloseModal : undefined}
        sx={{ minWidth: '500px', maxWidth: '700px' }}
      >
        <BaseModalHeader title="Promote Task" />
        <BaseModalBody>
          <Stack spacing={2}>
            <Typography variant="body1">
              {hasIssues
                ? 'The following issues were found during promotion validation:'
                : 'Task is ready for promotion. Do you want to proceed?'}
            </Typography>

            {/* Blocking Issues */}
            {blockingIssues.map((issue, index) => (
              <Alert
                key={`blocking-${index}`}
                severity="error"
                icon={<Error />}
              >
                <AlertTitle>{issue.checkTitle}</AlertTitle>
                {issue.checkWarning}
              </Alert>
            ))}

            {/* Warnings */}
            {warnings.map((warning, index) => (
              <Alert
                key={`warning-${index}`}
                severity="warning"
                icon={<Warning />}
              >
                <AlertTitle>{warning.checkTitle}</AlertTitle>
                {warning.checkWarning}
              </Alert>
            ))}

            {/* Success message if no issues */}
            {!hasIssues && (
              <Alert severity="success">
                <AlertTitle>Ready for Promotion</AlertTitle>
                All validation checks have passed. The task is ready to be
                promoted.
              </Alert>
            )}

            {/* Additional info for warnings */}
            {warnings.length > 0 && blockingIssues.length === 0 && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  <strong>Note:</strong> You can proceed with promotion despite
                  the warnings above, but please review them carefully to ensure
                  they won't cause issues.
                </Typography>
              </Box>
            )}

            {/* Error message from mutation */}
            {autoPromoteMutation.isError && (
              <Alert severity="error">
                <AlertTitle>Promotion Failed</AlertTitle>
                {autoPromoteMutation.error?.message ||
                  'An error occurred during promotion. Please try again.'}
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
                loading={isPromoting}
                disabled={!canProceed}
                onClick={handleConfirmPromotion}
                color="info"
                sx={{ color: '#fff' }}
              >
                {blockingIssues.length > 0
                  ? 'Cannot Promote'
                  : warnings.length > 0
                    ? 'Promote Anyway'
                    : 'Promote Task'}
              </LoadingButton>
              <Button
                variant="contained"
                onClick={handleCloseModal}
                disabled={isPromoting}
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
