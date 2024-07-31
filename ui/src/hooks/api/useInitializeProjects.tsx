import { useQuery } from '@tanstack/react-query';
import TasksServices from '../../api/TasksService';

export default function useAvailableProjects() {
  const query = useQuery({
    queryKey: [`all-projects`],
    queryFn: () => {
      return TasksServices.getProjects();
    },
    staleTime: Infinity,
  });

  return query;
}
