import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useTaskStore from '../../stores/TaskStore';
import { Task } from '../../types/task';

function useTaskById() {
  const [task, setTask] = useState<Task | null>();
  const taskStore = useTaskStore();
  const { taskKey, projectKey } = useParams();

  useEffect(() => {
    const tempTask: Task | undefined = taskStore.getUserTaskByIds(projectKey, taskKey);
    setTask(tempTask);
  }, [projectKey, taskKey, taskStore]);

  return task;
}

export default useTaskById;
