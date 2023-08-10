import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useTaskStore from '../stores/TaskStore';
import { Task } from '../types/task';

function useTaskById() {
  const [task, setTask] = useState<Task | null>();
  const taskStore = useTaskStore();
  const { id } = useParams();

  useEffect(() => {
    const tempTask: Task | null = taskStore.getTaskById(id);
    setTask(tempTask);
  }, [id]);

  return task;
}

export default useTaskById;
