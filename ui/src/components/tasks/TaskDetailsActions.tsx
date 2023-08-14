/* eslint-disable */
import { Button, SxProps } from '@mui/material';
import useTaskById from '../../hooks/useTaskById';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ArchiveIcon from '@mui/icons-material/Archive';
import axios from 'axios';
import SockJs from 'sockjs-client';
import Stomp from 'stompjs';

import { authoringPlatformLocation } from '../../utils/externalLocations';

import useUserStore from '../../stores/UserStore';
import { Link } from 'react-router-dom';
import { ClassificationStatus, TaskStatus } from '../../types/task';
import { LoadingButton } from '@mui/lab';
import TasksServices from '../../api/TasksService';
import useTaskStore from '../../stores/TaskStore';
import { useState } from 'react';

const customSx: SxProps = {
  justifyContent: 'flex-start',
};

function TaskDetailsActions() {
  const task = useTaskById();
  const taskStore = useTaskStore();

  console.log(task);

  const [classifying, setClassifying] = useState(
    task?.latestClassificationJson?.status === ClassificationStatus.Running,
  );
  const [classified, setClassified] = useState(
    task?.latestClassificationJson?.status === ClassificationStatus.Completed,
  );
  const [validating, setValidating] = useState(
    task?.latestValidationStatus === ClassificationStatus.Scheduled,
  );
  const [ableToSubmitForReview, setAbleToSubmitForReview] = useState(
    task?.status === TaskStatus.InProgress,
  );

  const handleStartClassification = async () => {
    setClassifying(true);
    const returnedTask = await TasksServices.triggerClassification(
      task?.projectKey,
      task?.key,
    );

    taskStore.mergeTasks(returnedTask);
  };

  const handleSubmitForReview = async () => {
    setAbleToSubmitForReview(false);
    const returnedTask = await TasksServices.triggerValidation(
      task?.projectKey,
      task?.key,
    );
    taskStore.mergeTasks(returnedTask);
  };

  const handleStartValidation = async () => {
    const returnedTask = await TasksServices.triggerValidation(
      task?.projectKey,
      task?.key,
    );
    setValidating(true);
    taskStore.mergeTasks(returnedTask);
  };

  return (
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
        href={`${authoringPlatformLocation}/#/tasks/task/${task?.projectKey}/${task?.key}/edit`}
        target="_blank"
      >
        View In Authoring Platform
      </Button>

      <LoadingButton
        loading={classifying || false}
        variant="contained"
        color="success"
        loadingPosition="start"
        startIcon={<NotificationsIcon />}
        sx={customSx}
        onClick={handleStartClassification}
      >
        {classified ? 'Re-classify' : 'Classify'}
      </LoadingButton>

      <LoadingButton
        loading={validating}
        variant="contained"
        color="secondary"
        loadingPosition="start"
        startIcon={<SchoolIcon />}
        sx={customSx}
        onClick={handleStartValidation}
      >
        {validating ? 'Validating' : 'Trigger Validation'}
      </LoadingButton>

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
      {/* <Button
        variant="contained"
        startIcon={<CallMergeIcon />}
        sx={customSx}
        color="warning"
      >
        Promote This Task to the Project
      </Button>
      <Button
        variant="contained"
        startIcon={<ArchiveIcon />}
        sx={customSx}
        color="error"
      >
        Begin Promotion Automation
      </Button> */}
    </div>
  );
}

export default TaskDetailsActions;
