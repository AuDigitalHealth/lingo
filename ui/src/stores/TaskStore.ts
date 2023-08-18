import { create } from 'zustand';
import { Task, TaskStatus } from '../types/task';
import TasksServices from '../api/TasksService';
import useUserStore from './UserStore.ts';

interface TaskStoreConfig {
  fetching: boolean;
  myTasks: Task[];
  allTasks: Task[];
  fetchTasks: () => Promise<void>;
  fetchAllTasks: () => Promise<void>;
  getTaskById: (taskId: string | undefined) => Task | null;
  mergeTasks: (updatedTask: Task) => void;
  getTasksNeedReview: () => Task[];
}

const useTaskStore = create<TaskStoreConfig>()((set, get) => ({
  fetching: false,
  myTasks: [],
  allTasks: [],

  fetchTasks: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const tasks = await TasksServices.getUserTasks();
      set({ myTasks: [...tasks] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
  fetchAllTasks: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const allTasks = await TasksServices.getAllTasks();
      set({ allTasks: [...allTasks] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
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
  getTasksNeedReview: () => {
    const tasksNeedReview = get().allTasks.filter(function (task) {
      return (
        task.status === TaskStatus.InReview &&
        task.assignee.email !== useUserStore.getState().email
      );
    });
    return tasksNeedReview;
  },
}));

export default useTaskStore;
