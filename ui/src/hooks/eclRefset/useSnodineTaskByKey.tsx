import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Task } from '../../types/task';
import {
  getTaskById,
  useAllTasks,
  useInitializeUserReviewTasks,
  useInitializeUserTasks,
} from '../api/task/useAllTasks';

function useSnodineTaskByKey(key?: string) {
  const [task, setTask] = useState<Task | null>();
  const { allTasks: userTasksData } = useAllTasks();

  useInitializeUserReviewTasks();

  const { branchKey } = useParams();
  const usedKey = branchKey ? branchKey : key;

  useEffect(() => {
    const tempTask: Task | null = getTaskById(usedKey, userTasksData);
    setTask(tempTask ? { ...tempTask } : null);
  }, [usedKey, userTasksData]);

  return task;
}

export default useSnodineTaskByKey;
