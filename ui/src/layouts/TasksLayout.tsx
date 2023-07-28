import { useEffect } from 'react';
import useTaskStore from '../stores/TaskStore';
import TasksList from '../components/TasksList';

function TasksLayout() {
  const taskStore = useTaskStore();

  useEffect(() => {
    taskStore.fetchTasks();
  }, []);

  return <>{taskStore.fetching ? <div>fetching</div> : <TasksList />}</>;
}

export default TasksLayout;
