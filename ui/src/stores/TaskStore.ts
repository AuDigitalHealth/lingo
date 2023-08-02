import { create } from 'zustand';
import { Task } from '../types/task';
import axios from 'axios';
interface TaskStoreConfig {
  fetching: boolean;
  tasks: Task[];
  fetchTasks: () => Promise<void>;
}

const useTaskStore = create<TaskStoreConfig>()(set => ({
  fetching: false,
  tasks: [],
  fetchTasks: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const tasks = await axios.get<Task[]>('/api/tasks');
      set({ tasks: [...tasks.data] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
}));

export default useTaskStore;
