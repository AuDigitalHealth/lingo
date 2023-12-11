import { useQuery } from '@tanstack/react-query';
import useTaskStore from '../../stores/TaskStore';
import TasksServices from '../../api/TasksService';
import { useMemo } from 'react';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore';

export default function useInitializeProjects() {
  const { applicationConfig } = useApplicationConfigStore();

  const { setProjects } = useTaskStore();
  const { isLoading, data } = useQuery(
    [`all-projects`],
    () => {
      return TasksServices.getProjects();
    },
    { staleTime: Infinity },
  );

  useMemo(() => {
    if (data) {
      setProjects(data);
    }
  }, [data, setProjects]);

  return { projectsLoading: isLoading };
}
