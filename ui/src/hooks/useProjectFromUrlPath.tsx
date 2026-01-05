import { useParams, useLocation } from 'react-router-dom';
import { Project } from '../types/Project';
import useAvailableProjects from './api/useInitializeProjects';
import useTaskByKey from './useTaskByKey';

export function useProjectFromUrlTaskPath() {
  const projects = useAvailableProjects();

  const params = useParams();
  const task = useTaskByKey(params.branchKey);

  const project = projects.data?.find(
    project => project.key.toUpperCase() === task?.projectKey?.toUpperCase(),
  );

  return project;
}

export function useProjectFromUrlProjectPath() {
  const projects = useAvailableProjects();

  const params = useParams();
  const projectKey = params.project;

  if (!projectKey) return undefined;

  const project = projects.data?.find(
    project => project.key.toUpperCase() === projectKey,
  );

  return project;
}
