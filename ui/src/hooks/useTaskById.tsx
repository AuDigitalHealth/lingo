import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Task } from '../types/task';
import { getTaskById, useAllTasks } from './api/useAllTasks';

function useTaskById() {
  const [task, setTask] = useState<Task | null>();
  const { allTasks } = useAllTasks();
  const { branchKey } = useParams();

  useEffect(() => {
    const tempTask: Task | null = getTaskById(branchKey, allTasks);
    setTask(tempTask ? { ...tempTask } : null);
  }, [branchKey, allTasks]);

  return task;
}

export default useTaskById;
