import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useTaskStore from '../stores/TaskStore';
import { Task } from '../types/task';

function useTaskById() {
  const [task, setTask] = useState<Task | null>();
  const taskStore = useTaskStore();
  const { branchKey } = useParams();

  useEffect(() => {
    const tempTask: Task | null = taskStore.getTaskById(branchKey);
    setTask(tempTask);
  }, [branchKey, taskStore]);

  return task;
}

export default useTaskById;
