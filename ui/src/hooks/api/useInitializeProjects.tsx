import { useQuery } from '@tanstack/react-query';
import TasksServices from '../../api/TasksService';
import { Project } from '../../types/Project';

import { useEffect, useRef, useState } from 'react';
import { useApplicationConfig } from './useInitializeConfig';
import useAuthoringStore from '../../stores/AuthoringStore';

const PROJECT_STORAGE_KEY = 'selected_project_key';
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

export function useDefaultProject(): Project | undefined {
  const project = useAvailableProjects();
  const { applicationConfig } = useApplicationConfig();

  const defaultProject = project?.data?.filter(project => {
    return project.branchPath === applicationConfig?.apDefaultBranch;
  });

  return defaultProject ? defaultProject[0] : undefined;
}

/**
 * Custom hook to initialize and manage the selected project in the store.
 * This should be called high up in the component tree (e.g., in a layout or provider component)
 * to ensure the project is available throughout the application.
 *
 * @returns Object containing:
 *  - selectedProject: The currently selected project
 *  - setSelectedProject: Function to manually update the selected project
 *  - isLoading: Boolean indicating if initialization is still in progress
 *  - isInitialized: Boolean indicating if initialization has completed
 */
export function useInitializeSelectedProject() {
  const { applicationConfig, applicationConfigIsLoading } =
    useApplicationConfig();
  const allProjects = useAvailableProjects();
  const defaultProject = useDefaultProject();

  const { selectedProject, setSelectedProject } = useAuthoringStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const initializationAttempted = useRef(false);

  const projects = getProjectsFromKeys(
    applicationConfig?.apProjectKeys,
    allProjects.data,
  );

  // Determine if we're still loading dependencies
  const isLoadingDependencies =
    applicationConfigIsLoading ||
    allProjects.isLoading ||
    (!projects && !defaultProject);

  // Initialize selectedProject from localStorage or default project
  useEffect(() => {
    // Don't try to initialize if we're still loading dependencies
    if (isLoadingDependencies) {
      return;
    }

    // Only run initialization once
    if (initializationAttempted.current) {
      return;
    }

    // If we already have a selected project, mark as initialized and skip
    if (selectedProject) {
      setIsInitialized(true);
      initializationAttempted.current = true;
      return;
    }

    const stored = localStorage.getItem(PROJECT_STORAGE_KEY);

    // If we have projects available, try to set one
    if (projects && projects.length > 0) {
      let projectToSet = null;

      if (stored) {
        // Try to find the stored project
        projectToSet = projects.find(p => p.key === stored);

        // If stored project key matches default project, use default project
        if (!projectToSet && defaultProject?.key === stored) {
          projectToSet = defaultProject;
        }
      }

      // If no valid stored project, fall back to default or first project
      if (!projectToSet) {
        projectToSet = defaultProject || projects[0];

        // Update localStorage with the fallback
        if (projectToSet) {
          localStorage.setItem(PROJECT_STORAGE_KEY, projectToSet.key);
        }
      }

      // Set the project in the store
      if (projectToSet) {
        setSelectedProject(projectToSet);
        setIsInitialized(true);
        initializationAttempted.current = true;
      }
    } else if (defaultProject) {
      // If we only have a default project, use it
      if (!stored || stored === defaultProject.key) {
        setSelectedProject(defaultProject);
        localStorage.setItem(PROJECT_STORAGE_KEY, defaultProject.key);
        setIsInitialized(true);
        initializationAttempted.current = true;
      }
    } else {
      // No projects available at all - mark as initialized anyway
      setIsInitialized(true);
      initializationAttempted.current = true;
    }
    // eslint-disable-next-line
  }, [
    projects,
    defaultProject,
    isLoadingDependencies,
    // Removed selectedProject and setSelectedProject from dependencies
  ]);

  // Consider loading complete when:
  // 1. Dependencies are loaded AND
  // 2. Either we're initialized OR there are no projects available
  const isLoading = isLoadingDependencies || !isInitialized;

  return {
    selectedProject,
    setSelectedProject,
    isLoading,
    isInitialized,
  };
}

/**
 * Helper function to update the selected project.
 * Updates both localStorage and the store.
 *
 * @param projectKey - The key of the project to select
 * @param projects - Available projects array
 * @param defaultProject - The default project
 * @param setSelectedProject - Store setter function
 */
export function updateSelectedProject(
  projectKey: string,
  projects: Project[] | undefined,
  defaultProject: Project | undefined,
  setSelectedProject: (project: Project) => void,
) {
  const newProject =
    projects?.find(p => p.key === projectKey) ||
    (defaultProject?.key === projectKey ? defaultProject : undefined);

  if (newProject) {
    localStorage.setItem(PROJECT_STORAGE_KEY, projectKey);
    setSelectedProject(newProject);
  }
}

export { PROJECT_STORAGE_KEY };

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

export const getProjectsFromKeys = (
  keys: string[] | undefined,
  projects: Project[] | undefined,
) => {
  if (keys === undefined || projects === undefined) return undefined;

  const returnProjects = projects.filter(project =>
    keys.some(key => project.key.toUpperCase() === key.toUpperCase()),
  );

  return returnProjects;
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
