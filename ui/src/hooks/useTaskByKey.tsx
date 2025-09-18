import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Task } from '../types/task';
import { getTaskById, useAllTasks } from './api/task/useAllTasks';
import { enqueueSnackbar } from 'notistack';

function useTaskByKey(key?: string) {
  const location = useLocation();
  const isCreate = location && location.state ? location.state.isCreate : false;
  const [task, setTask] = useState<Task | null>();
  const { allTasks } = useAllTasks();
  const { branchKey } = useParams();
  const usedKey = branchKey ? branchKey : key;

  useEffect(() => {
    const tempTask: Task | null = getTaskById(usedKey, allTasks);
    if (tempTask) {
      setTask(tempTask ? tempTask : null);
    } else {
      setTask(null);
      if (!isCreate) {
        enqueueSnackbar(
          'Task is no longer available. Task has already been promoted or deleted.',
          { variant: 'error' },
        );
      }
    }
  }, [usedKey, allTasks, isCreate]);

  return task;
}

export default useTaskByKey;
