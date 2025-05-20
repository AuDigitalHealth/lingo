import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Task } from '../types/task';
import { getTaskById, useAllTasks } from './api/useAllTasks';

function useTaskByKey(key?: string) {
  const [task, setTask] = useState<Task | null>();
  const { allTasks } = useAllTasks();
  const { branchKey } = useParams();
  const usedKey = branchKey ? branchKey : key;

  useEffect(() => {
    const tempTask: Task | null = getTaskById(usedKey, allTasks);
    setTask(tempTask ? { ...tempTask } : null);
  }, [usedKey, allTasks]);

  return task;
}

export default useTaskByKey;
