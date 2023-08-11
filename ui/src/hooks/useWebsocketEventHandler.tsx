import axios from 'axios';
import { Task } from '../types/task';
import { StompMessage } from './useWebSocket';
import TasksServices from '../api/TasksService';
import useTaskStore from '../stores/TaskStore';

function useWebsocketEventHandler() {
  const taskStore = useTaskStore();

  async function handleClassificationEvent(
    message: StompMessage,
  ): Promise<Task> {
    const returnedTask = await TasksServices.getTask(
      message?.project,
      message.task,
    );
    taskStore.mergeTasks(returnedTask);
    return returnedTask;
  }

  return {
    handleClassificationEvent,
  };
}

export default useWebsocketEventHandler;
