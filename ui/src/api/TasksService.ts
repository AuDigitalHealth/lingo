import axios from 'axios';
import { Classification, ClassificationStatus, Task } from '../types/task';

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
    latestClassificationJson: Classification | undefined,
  ): Promise<Task> {
    if (projectKey === undefined || taskKey === undefined) {
      this.handleErrors();
    }
    // i'm not sure if this is 100% necassary, but it seems like it
    // if you make changes, and want to reclassify the task will be stuck in classified,
    // give you a 500, and say it's already running. Which makes sense when it's in the running state
    // but 0 sense when in the completed state
    if (latestClassificationJson?.status === ClassificationStatus.Completed) {
      const cacheEvictResponse = await axios.post(
        `/authoring-services/projects/${projectKey}/tasks/${taskKey}/classifications/status/cache-evict`,
      );
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
