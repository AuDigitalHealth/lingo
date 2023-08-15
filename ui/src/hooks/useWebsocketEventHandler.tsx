import axios from 'axios';
import { Task } from '../types/task';
import { StompMessage } from './useWebSocket';
import TasksServices from '../api/TasksService';
import useTaskStore from '../stores/TaskStore';

import { useSnackbar } from 'notistack';
import TasksSnackbar from '../components/snackbar/TasksSnackbar';

function useWebsocketEventHandler() {
  const taskStore = useTaskStore();
  const { enqueueSnackbar } = useSnackbar();

  async function handleClassificationEvent(
    message: StompMessage,
  ): Promise<Task> {
    const returnedTask = await TasksServices.getTask(
      message?.project,
      message.task,
    );
    enqueueSnackbar(
      `${message.entityType} completed for task ${returnedTask.summary}`,
      {
        variant: message.event?.includes('success') ? 'success' : 'error',
        action: snackbarKey => (
          <TasksSnackbar message={message} snackbarKey={snackbarKey} />
        ),
      },
    );
    taskStore.mergeTasks(returnedTask);
    return returnedTask;
  }
  async function handleValidationEvent(message: StompMessage): Promise<Task> {
    const returnedTask = await TasksServices.getTask(
      message?.project,
      message.task,
    );
    enqueueSnackbar(
      `${message.entityType} completed for task ${message.task}`,
      {
        variant: message.event?.includes('success') ? 'success' : 'error',
        action: snackbarKey => (
          <TasksSnackbar message={message} snackbarKey={snackbarKey} />
        ),
      },
    );
    taskStore.mergeTasks(returnedTask);
    return returnedTask;
  }

  return {
    handleClassificationEvent,
    handleValidationEvent,
  };
}

export default useWebsocketEventHandler;
