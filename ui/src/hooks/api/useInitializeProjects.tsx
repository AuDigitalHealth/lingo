import { useQuery } from '@tanstack/react-query';
import TasksServices from '../../api/TasksService';
import { Project } from '../../types/Project';

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

export const getProjectFromKey = (
  key: string | undefined,
  projects: Project[] | undefined,
) => {
  if (key === undefined) return undefined;
  const returnProject = projects?.find(project => {
    return project.key.toUpperCase() === key.toUpperCase();
  });

  return returnProject;
};

export const getProjectByTitle = (
  title: string,
  projects: Project[] | undefined,
) => {
  const returnProject = projects?.find(project => {
    return project.title.toUpperCase() === title.toUpperCase();
  });
  return returnProject;
};
