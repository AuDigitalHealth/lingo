import { create } from 'zustand';
import { Task, TaskStatus } from '../types/task';
import TasksServices from '../api/TasksService';
import useApplicationConfigStore from './ApplicationConfigStore.ts';
import { Project } from '../types/Project.ts';

interface TaskStoreConfig {
  fetching: boolean;
  allTasks: Task[];
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  getProjectFromKey: (key: string | undefined) => Project | undefined;
  getProjectbyTitle: (title: string) => Project | undefined;
  setAllTasks: (tasks: Task[]) => void;
  fetchAllTasks: () => Promise<void>;
  getTaskById: (taskId: string | undefined) => Task | null;
  mergeTasks: (updatedTask: Task) => void;
  addTask: (task: Task) => void;
  getTasksNeedReview: () => Task[];
}

const useTaskStore = create<TaskStoreConfig>()((set, get) => ({
  fetching: false,
  allTasks: [],
  projects: [],
  fetchAllTasks: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const projectKey =
        useApplicationConfigStore.getState().applicationConfig?.apProjectKey;
      const allTasks = await TasksServices.getAllTasks(projectKey);

      set({ allTasks: [...allTasks] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
  setProjects: (projects: Project[]) => {
    console.log('set projects called');
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
  setAllTasks: (allTasks: Task[]) => {
    set({ allTasks: [...allTasks] });
  },
  getTaskById: (taskId: string | undefined) => {
    if (taskId === undefined) return null;

    let tasks = get().allTasks;

    tasks = tasks?.filter(task => {
      return task.key === taskId;
    });

    return tasks.length === 1 ? tasks[0] : null;
  },
  mergeTasks: (updatedTask: Task) => {
    const updatedTasks = get().allTasks.map((task: Task): Task => {
      return task.key === updatedTask.key ? updatedTask : task;
    });
    set({ allTasks: [...updatedTasks] });
  },
  addTask: (task: Task) => {
    const updatedTasks = [task, ...get().allTasks];

    set({ allTasks: [...updatedTasks] });
  },
  getTasksNeedReview: () => {
    const tasksNeedReview = get().allTasks.filter(function (task) {
      return task.status === TaskStatus.InReview;
    });
    return tasksNeedReview;
  },
}));

export default useTaskStore;
