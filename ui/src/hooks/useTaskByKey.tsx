import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Task } from '../types/task';
import { getTaskById, useAllTasks } from './api/task/useAllTasks';
import { enqueueSnackbar } from 'notistack';

function useTaskByKey(key?: string) {
  const [task, setTask] = useState<Task | null>();
  const { allTasks } = useAllTasks();
  const { branchKey } = useParams();
  const usedKey = branchKey ? branchKey : key;

  useEffect(() => {
    const tempTask: Task | null = getTaskById(usedKey, allTasks);
    if (tempTask) {
      setTask({ ...tempTask });
    } else {
      setTask(null);
      enqueueSnackbar(
        'Task is no longer available. Task has already been promoted or deleted.',
        { variant: 'error' },
      );
    }
  }, [usedKey, allTasks]);

  return task;
}

export default useTaskByKey;
