import { create } from 'zustand';
import { Task } from '../types/task';

interface TaskStoreConfig {
  fetching: boolean;
  tasks: Array<Task>;
  fetchTasks: () => void;
}

const useTaskStore = create<TaskStoreConfig>()(set => ({
  fetching: false,
  tasks: [],
  fetchTasks: async () => {
    set(() => ({
      fetching: true,
    }));

    const response = await fetch('/api/tasks');
    const tasks = await response.json();
    set({ tasks: [...tasks] });
    set({ fetching: false });
  },
}));

export default useTaskStore;
