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
  async getTask(
    projectKey: string | undefined,
    taskKey: string | undefined,
  ): Promise<Task> {
    if (projectKey === undefined || taskKey === undefined) {
      this.handleErrors();
    }
    const response = await axios.get(
      `/authoring-services/projects/${projectKey}/tasks/${taskKey}`,
    );
    if (response.status !== 200) {
      this.handleErrors();
    }
    return response.data as Task;
  },
  // we want to return the task here that has validation running on it now
  async triggerClassification(
    projectKey: string | undefined,
    taskKey: string | undefined,
  ): Promise<Task> {
    if (projectKey === undefined || taskKey === undefined) {
      this.handleErrors();
    }
    const response = await axios.post(
      `/authoring-services/projects/${projectKey}/tasks/${taskKey}/classifications`,
    );
    if (response.status !== 200) {
      this.handleErrors();
    }
    const returnTask = await this.getTask(projectKey, taskKey);
    return returnTask;
  },
  async triggerValidation(
    projectKey: string | undefined,
    taskKey: string | undefined,
  ): Promise<Task> {
    if (projectKey === undefined || taskKey === undefined) {
      this.handleErrors();
    }
    // returns a status object {status: string}
    const response = await axios.post(
      `/authoring-services/projects/${projectKey}/tasks/${taskKey}/validation`,
    );
    if (response.status !== 200) {
      this.handleErrors();
    }
    const returnTask = await this.getTask(projectKey, taskKey);
    return returnTask;
  },
  async submitForReview(
    projectKey: string | undefined,
    taskKey: string | undefined,
  ): Promise<Task> {
    if (projectKey === undefined || taskKey === undefined) {
      this.handleErrors();
    }
    // returns a status object {status: string}
    const response = await axios.post(
      `/authoring-services/projects/${projectKey}/tasks/${taskKey}/validation`,
    );
    if (response.status !== 200) {
      this.handleErrors();
    }
    const returnTask = await this.getTask(projectKey, taskKey);
    return returnTask;
  },
};

export default TasksServices;
