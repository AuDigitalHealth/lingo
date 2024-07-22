import { create } from 'zustand';
import { Task } from '../types/task';
import { Project } from '../types/Project.ts';

interface TaskStoreConfig {
  fetching: boolean;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  getProjectFromKey: (key: string | undefined) => Project | undefined;
  getProjectbyTitle: (title: string) => Project | undefined;

  // User tasks across all projects
  userTasks: Task[];
  userReviewTasks: Task[];
  setUserTasks: (tasks: Task[]) => void;
  setUserReviewTasks: (tasks: Task[]) => void;
  getUserTasks: (tasks: Task[]) => void;
  getUserReviewTasks: (tasks: Task[]) => void;
  getUserTaskByIds: (
    projectKey: string | undefined,
    taskKey: string | undefined,
  ) => Task | undefined;
}

const useTaskStore = create<TaskStoreConfig>()((set, get) => ({
  fetching: false,
  projects: [],
  setProjects: (projects: Project[]) => {
    set({ projects: [...projects] });
  },
  getProjectFromKey: (key: string | undefined) => {
    if (key === undefined) return undefined;
    const returnProject = get().projects.find(project => {
      return project.key.toUpperCase() === key.toUpperCase();
    });

    return returnProject;
  },
  getProjectbyTitle: (title: string) => {
    const returnProject = get().projects.find(project => {
      return project.title.toUpperCase() === title.toUpperCase();
    });
    return returnProject;
  },
  userTasks: [],
  userReviewTasks: [],
  setUserTasks: (userTasks: Task[]) => {
    set({ userTasks: [...userTasks] });
  },
  setUserReviewTasks: (userReviewTasks: Task[]) => {
    set({ userReviewTasks: [...userReviewTasks] });
  },
  getUserTasks: () => {
    const userTasks = get().userTasks;
    return userTasks;
  },
  getUserReviewTasks: () => {
    const userReviewTasks = get().userReviewTasks;
    return userReviewTasks;
  },
  getUserTaskByIds: (projectKey, taskKey) => {
    if (!projectKey || !taskKey) return;

    const userTasks = get().userTasks;
    const taskFound = userTasks.find(
      t => t.projectKey === projectKey && t.key === taskKey,
    );
    if (taskFound) return taskFound;

    const userReviewTasks = get().userReviewTasks;
    return userReviewTasks.find(
      t => t.projectKey === projectKey && t.key === taskKey,
    );
  },
}));

export default useTaskStore;
