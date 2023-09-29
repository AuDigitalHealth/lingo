import { useQuery } from '@tanstack/react-query';
import useTaskStore from '../../stores/TaskStore';
import TasksServices from '../../api/TasksService';
import { useMemo } from 'react';
import ApplicationConfig from '../../types/applicationConfig';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore';

export default function useInitializeTasks() {
  const {applicationConfig} = useApplicationConfigStore();
  const { allTasksIsLoading } = useInitializeAllTasks(applicationConfig);
  const { tasksIsLoading } = useInitializeMyTasks();

  return { tasksLoading: allTasksIsLoading || tasksIsLoading };
}

export function useInitializeAllTasks(applicationConfig: ApplicationConfig | null) {
  const { setAllTasks } = useTaskStore();
  const { isLoading, data } = useQuery(
    [`all-tasks-${applicationConfig?.apProjectKey}`],
    () => {
      return TasksServices.getAllTasks(applicationConfig?.apProjectKey);
    },
    { staleTime: 1 * (60 * 1000) },
  );

  useMemo(() => {
    if (data) {
      setAllTasks(data);
    }
  }, [data, setAllTasks]);

  const allTasksIsLoading: boolean = isLoading;
  const allTasksData = data;

  return { allTasksIsLoading, allTasksData };
}

export function useInitializeMyTasks() {
  const { setTasks } = useTaskStore();
  const { isLoading, data } = useQuery(
    ['all-tasks'],
    () => {
      return TasksServices.getUserTasks();
    },
    { staleTime: 1 * (60 * 1000) },
  );

  useMemo(() => {
    if (data) {
      setTasks(data);
    }
  }, [data, setTasks]);
  const tasksIsLoading: boolean = isLoading;
  const tasksData = data;

  return { tasksIsLoading, tasksData };
}
