import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Task } from '../../types/task';
import {
  useInitializeUserReviewTasks,
  useInitializeUserTasks,
} from '../api/task/useAllTasks';
import useTaskStore from '../../stores/TaskStore';

function useSnodineTaskByKey(key?: string) {
  const [task, setTask] = useState<Task | null>();
  const { userTasks, userReviewTasks } = useTaskStore();

  useInitializeUserTasks();
  useInitializeUserReviewTasks();

  const { branchKey } = useParams();
  const usedKey = branchKey ? branchKey : key;

  useEffect(() => {
    const found =
      [...userTasks, ...userReviewTasks].find(t => t.key === usedKey) ?? null;
    setTask(found ? { ...found } : null);
  }, [usedKey, userTasks, userReviewTasks]);

  return task;
}

export default useSnodineTaskByKey;
