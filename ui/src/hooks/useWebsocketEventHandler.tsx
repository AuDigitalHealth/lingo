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
      `${message.entityType} ${message.event?.toLocaleLowerCase()} for task ${
        returnedTask.summary
      }`,
      {
        variant: createVariant(message),
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
      `${message.entityType} ${message.event?.toLocaleLowerCase()} for task ${
        message.task
      }`,
      {
        variant: createVariant(message),
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

const createVariant = (message: StompMessage) => {
  const lowerCaseMessage = message.event?.toLocaleLowerCase();

  if (lowerCaseMessage === 'failed') return 'error';
  if (lowerCaseMessage === 'success') return 'success';
  return 'info';
};

export default useWebsocketEventHandler;
