import axios from 'axios';
import { Task } from '../types/task';

const TasksServices = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid task response');
  },

  async getUserTasks(): Promise<Task[]> {
    const response = await axios.get('/api/tasks/myTasks');
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as Task[];
  },

  async getAllTasks(): Promise<Task[]> {
    const response = await axios.get('/api/tasks');
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as Task[];
  },
};

export default TasksServices;
