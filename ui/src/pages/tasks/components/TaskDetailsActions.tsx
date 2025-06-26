import { Button, ButtonGroup, Grid, SxProps } from '@mui/material';
import useTaskById from '../../../hooks/useTaskById';
import NotificationsIcon from '@mui/icons-material/Notifications';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';

import {
  ClassificationStatus,
  TaskStatus,
  ValidationStatus,
  Task,
} from '../../../types/task';
import { LoadingButton } from '@mui/lab';
import TasksServices from '../../../api/TasksService';
import useTaskStore from '../../../stores/TaskStore';
import { useEffect, useState } from 'react';
import useCanEditTask from '../../../hooks/useCanEditTask';
import UnableToEditTooltip from './UnableToEditTooltip';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus';
import { unavailableErrorHandler } from '../../../types/ErrorHandler';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore.ts';
import {
  updateTaskCache,
  useAllTasksOptions,
} from '../../../hooks/api/task/useAllTasks';
import {
  dataTagErrorSymbol,
  dataTagSymbol,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useTaskActivities } from '../../../hooks/api/task/useTaskActivities';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import ConceptReviewList from '../../products/components/reviews/ConceptReviewList.tsx';
import { Done } from '@mui/icons-material';
import { ServiceStatus } from '../../../types/applicationConfig.ts';
import {
  useCanCompleteReview,
  useShowReviewControls,
} from '../../../hooks/api/task/useReviews.tsx';
import { useCompleteReviewMutation } from '../../../hooks/api/task/useCompleteReviewMutation.tsx';

const customSx: SxProps = {
  justifyContent: 'flex-start',
};

function TaskDetailsActions() {
  const task = useTaskById();
  const canCompleteReview = useCanCompleteReview({
    task: task,
    branch: task?.branchPath,
  });
  const showReviewControls = useShowReviewControls({ task });
  const [classifying, setClassifying] = useState(false);
  const [classified, setClassified] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [ableToSubmitForReview, setAbleToSubmitForReview] = useState(true);
  const { serviceStatus } = useServiceStatus();
  const { applicationConfig } = useApplicationConfigStore();

  const { canEdit, lockDescription } = useCanEditTask();

  const queryClient = useQueryClient();

  const queryKey = useAllTasksOptions(applicationConfig).queryKey;
  const completeReviewMutation = useCompleteReviewMutation(
    task,
    serviceStatus,
    queryKey,
  );
  useEffect(() => {
    setClassifying(
      task?.latestClassificationJson?.status === ClassificationStatus.Running,
    );
    setClassified(
      task?.latestClassificationJson?.status === ClassificationStatus.Completed,
    );
    setValidating(task?.latestValidationStatus === ValidationStatus.Scheduled);
    setValidationComplete(
      task?.latestValidationStatus !== ValidationStatus.NotTriggered,
    );
    setAbleToSubmitForReview(task?.status === TaskStatus.InProgress);
  }, [task]);

  const handleStartClassification = async () => {
    if (!serviceStatus?.authoringPlatform.running) {
      unavailableErrorHandler('', 'Authoring Platform');
      return;
    }
    setClassifying(true);
    const returnedTask = await TasksServices.triggerClassification(
      task?.projectKey,
      task?.key,
      task?.latestClassificationJson,
    );

    updateTaskCache(queryClient, queryKey, returnedTask);
  };

  const handleSubmitForReview = async () => {
    if (!serviceStatus?.authoringPlatform.running) {
      unavailableErrorHandler('', 'Authoring Platform');
      return;
    }
    setAbleToSubmitForReview(false);
    const returnedTask = await TasksServices.submitForReview(
      task?.projectKey,
      task?.key,
      [],
    );
    updateTaskCache(queryClient, queryKey, returnedTask);
  };

  const handleCompleteReview = () => {
    completeReviewMutation.mutate();
  };

  const handleStartValidation = async () => {
    if (!serviceStatus?.authoringPlatform.running) {
      unavailableErrorHandler('', 'Authoring Platform');
      return;
    }
    const returnedTask = await TasksServices.triggerValidation(
      task?.projectKey,
      task?.key,
    );
    setValidating(true);
    updateTaskCache(queryClient, queryKey, returnedTask);
  };

  return (
    <>
      {showReviewControls && <ConceptReviewList />}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '.5em',
          padding: '1em',
        }}
      >
        <Button
          variant="contained"
          color="primary"
          startIcon={<SettingsIcon />}
          sx={customSx}
          href={`${applicationConfig?.apApiBaseUrl}/#/tasks/task/${task?.projectKey}/${task?.key}/edit`}
          target="_blank"
        >
          View In Authoring Platform
        </Button>
        <Grid container spacing={0}>
          <Grid item xs={classified || !canEdit ? 6 : 12}>
            <UnableToEditTooltip
              canEdit={canEdit}
              lockDescription={lockDescription}
            >
              <LoadingButton
                fullWidth
                loading={classifying || false}
                disabled={validating || !canEdit}
                variant="contained"
                color="success"
                loadingPosition="start"
                startIcon={<NotificationsIcon />}
                sx={customSx}
                onClick={handleStartClassification}
              >
                {classified ? 'Re-classify' : 'Classify'}
              </LoadingButton>
            </UnableToEditTooltip>
          </Grid>

          {classified || !canEdit ? (
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                sx={{ ...customSx }}
                href={`${applicationConfig?.apApiBaseUrl}/#/tasks/task/${task?.projectKey}/${task?.key}/classify`}
                startIcon={<OpenInNewIcon />}
                target="_blank"
              >
                View Classification
              </Button>
            </Grid>
          ) : (
            <></>
          )}
        </Grid>

        <Grid container spacing={0}>
          <Grid item xs={validationComplete || !canEdit ? 6 : 12}>
            <UnableToEditTooltip
              canEdit={canEdit}
              lockDescription={lockDescription}
            >
              <LoadingButton
                fullWidth
                disabled={classifying || !canEdit}
                loading={validating}
                variant="contained"
                color="secondary"
                loadingPosition="start"
                startIcon={<SchoolIcon />}
                sx={{ ...customSx }}
                onClick={handleStartValidation}
              >
                {validating ? 'Validating' : 'Trigger Validation'}
              </LoadingButton>
            </UnableToEditTooltip>
          </Grid>

          {validationComplete || !canEdit ? (
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                sx={{ ...customSx, color: 'black' }}
                href={`${applicationConfig?.apApiBaseUrl}/#/tasks/task/${task?.projectKey}/${task?.key}/validate`}
                startIcon={<OpenInNewIcon />}
                target="_blank"
              >
                View Validation
              </Button>
            </Grid>
          ) : (
            <></>
          )}
        </Grid>

        <Button
          disabled={!ableToSubmitForReview}
          variant="contained"
          startIcon={<QuestionAnswerIcon />}
          sx={customSx}
          color="info"
          onClick={handleSubmitForReview}
        >
          {ableToSubmitForReview ? 'Submit For Review' : task?.status}
        </Button>
        {canCompleteReview && (
          <Button
            disabled={completeReviewMutation.isPending}
            variant="contained"
            startIcon={<Done />}
            sx={customSx}
            color="info"
            onClick={handleCompleteReview}
          >
            {'Mark Review Completed'}
          </Button>
        )}
      </div>
    </>
  );
}

export default TaskDetailsActions;
