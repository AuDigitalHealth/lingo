import { create } from 'zustand';
import { Task } from '../types/task';

interface TaskStoreConfig {
  fetching: boolean;

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
