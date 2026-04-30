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
import { useDanglingReferences } from '../../../hooks/api/task/useDanglingReferences';
import { useTidyDanglingReferences } from '../../../hooks/api/task/useTidyDanglingReferences';
import { Task, TaskStatus } from '../../../types/task';
import { ConceptReview } from '../../../types/ConceptReview';
import { TidyFailure } from '../../../types/danglingReferences';
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

  const { warnings, blockingIssues } = useCanPromoteTask({
    task,
    conceptReviews,
    hasUnsavedConcepts,
    deletedCrsConceptFound,
  });

  const autoPromoteMutation = useAutoPromoteTask();
  const danglingQuery = useDanglingReferences({
    projectKey: task?.projectKey,
    taskKey: task?.key,
    enabled: modalOpen && Boolean(task),
  });
  const tidyMutation = useTidyDanglingReferences();
  const [tidyFailures, setTidyFailures] = useState<TidyFailure[] | null>(null);

  const dangling = danglingQuery.data;
  const danglingError = danglingQuery.isError;
  const danglingLoading = danglingQuery.isFetching;
  const hasDangling =
    Boolean(dangling) &&
    (dangling!.danglingRefsetMembers.length > 0 ||
      dangling!.danglingNonDefiningRelationships.length > 0);

  const handleOpenModal = () => {
    setTidyFailures(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!autoPromoteMutation.isPending && !tidyMutation.isPending) {
      setModalOpen(false);
    }
  };

  const handleConfirmPromotion = async () => {
    if (!task) return;
    setTidyFailures(null);
    try {
      if (hasDangling) {
        const result = await tidyMutation.mutateAsync({
          projectKey: task.projectKey,
          taskKey: task.key,
        });
        if (result.failed.length > 0) {
          setTidyFailures(result.failed);
          return;
        }
      }
      await autoPromoteMutation.mutateAsync({
        projectKey: task.projectKey,
        taskKey: task.key,
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
  const isPromoting = autoPromoteMutation.isPending;
  const isTidying = tidyMutation.isPending;
  const canProceed =
    blockingIssues.length === 0 &&
    !isPromoting &&
    !isTidying &&
    !danglingError &&
    !danglingLoading &&
    !tidyFailures;

  const promoteLabel =
    blockingIssues.length > 0
      ? 'Cannot Promote'
      : hasDangling
        ? 'Tidy & Promote'
        : warnings.length > 0
          ? 'Promote Anyway'
          : 'Promote Task';

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
        handleClose={!isPromoting && !isTidying ? handleCloseModal : undefined}
        sx={{ minWidth: '500px', maxWidth: '700px' }}
      >
        <BaseModalHeader title="Promote Task" />
        <BaseModalBody>
          <Stack spacing={2}>
            <Typography variant="body1">
              {hasIssues || hasDangling
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

            {/* Detection error */}
            {danglingError && (
              <Alert severity="error">
                <AlertTitle>Could not check for dangling references</AlertTitle>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Detection failed. Please retry before promoting.
                </Typography>
                <Button size="small" onClick={() => danglingQuery.refetch()}>
                  Retry
                </Button>
              </Alert>
            )}

            {/* Dangling references summary */}
            {hasDangling && dangling && (
              <Alert severity="warning" icon={<Warning />}>
                <AlertTitle>
                  {dangling.danglingRefsetMembers.length} dangling refset member
                  {dangling.danglingRefsetMembers.length === 1 ? '' : 's'},{' '}
                  {dangling.danglingNonDefiningRelationships.length} dangling
                  non-defining relationship
                  {dangling.danglingNonDefiningRelationships.length === 1
                    ? ''
                    : 's'}
                </AlertTitle>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  These were left behind by retire/delete actions in the
                  Authoring Platform. On promote, Lingo will tidy them: released
                  components are inactivated, unreleased components are deleted.
                </Typography>
                {dangling.danglingRefsetMembers.length > 0 && (
                  <>
                    <Typography variant="subtitle2">Refset members</Typography>
                    <ul>
                      {dangling.danglingRefsetMembers.map(m => (
                        <li key={m.memberId}>
                          {m.refsetPt ?? m.refsetId} →{' '}
                          {m.referencedConceptPt
                            ? `${m.referencedConceptPt} (${m.referencedConceptStatus.toLowerCase()})`
                            : `concept ${m.referencedConceptId} (deleted)`}
                          {m.released
                            ? ' — will be inactivated'
                            : ' — will be deleted'}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {dangling.danglingNonDefiningRelationships.length > 0 && (
                  <>
                    <Typography variant="subtitle2">
                      Non-defining relationships
                    </Typography>
                    <ul>
                      {dangling.danglingNonDefiningRelationships.map(r => (
                        <li key={r.relationshipId}>
                          {r.typePt ?? r.typeId}: {r.sourcePt ?? r.sourceId} (
                          {r.sourceStatus.toLowerCase()}) →{' '}
                          {r.destinationPt ?? r.destinationId} (
                          {r.destinationStatus.toLowerCase()})
                          {r.released
                            ? ' — will be inactivated'
                            : ' — will be deleted'}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Alert>
            )}

            {/* Tidy failures */}
            {tidyFailures && tidyFailures.length > 0 && (
              <Alert severity="error">
                <AlertTitle>
                  Tidy failed for {tidyFailures.length} item
                  {tidyFailures.length === 1 ? '' : 's'}
                </AlertTitle>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Promotion has been blocked. Please contact support and quote
                  the following details:
                </Typography>
                <ul>
                  {tidyFailures.map(f => (
                    <li key={`${f.kind}-${f.id}`}>
                      {f.kind} <code>{f.id}</code> — attempted{' '}
                      {f.attemptedAction.toLowerCase()}: {f.errorMessage}
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {/* Success message if no issues */}
            {!hasIssues && !hasDangling && !danglingError && (
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
                loading={isPromoting || isTidying}
                disabled={!canProceed}
                onClick={handleConfirmPromotion}
                color="info"
                sx={{ color: '#fff' }}
              >
                {promoteLabel}
              </LoadingButton>
              <Button
                variant="contained"
                onClick={handleCloseModal}
                disabled={isPromoting || isTidying}
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
