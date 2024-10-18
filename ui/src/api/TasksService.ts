///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import {
  Classification,
  ClassificationStatus,
  Task,
  TaskDto,
  TaskStatus,
  UserDetails,
} from '../types/task';
import {
  BranchCreationRequest,
  BranchDetails,
  Project,
} from '../types/Project';
import { api } from './api';

const TasksServices = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid task response');
  },

  async createTask(projectKey: string, task: TaskDto): Promise<Task> {
    const response = await api.post(`/api/tasks`, task);
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as Task;
  },
  async getProjects(): Promise<Project[]> {
    const response = await api.get('/authoring-services/projects');
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as Project[];
  },
  async getUserTasks(excludePromoted?: boolean): Promise<Task[]> {
    const response = await api.get('/authoring-services/projects/my-tasks', {
      params: { excludePromoted },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as Task[];
  },

  async getUserReviewTasks(excludePromoted?: boolean): Promise<Task[]> {
    // Reviewer is user, or unassigned
    const response = await api.get(
      '/authoring-services/projects/review-tasks',
      {
        params: { excludePromoted },
      },
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as Task[];
  },

  async getAllTasks(projectKey: string | undefined): Promise<Task[]> {
    if (projectKey === undefined) {
      this.handleErrors();
    }
    const response = await api.get(`/api/tasks`);
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
    const response = await api.get(
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
      await api.post(
        `/authoring-services/projects/${projectKey}/tasks/${taskKey}/classifications/status/cache-evict`,
      );
    }
    const response = await api.post(
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
    const response = await api.post(
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
    reviewers: UserDetails[],
  ): Promise<Task> {
    if (
      projectKey === undefined ||
      taskKey === undefined ||
      reviewers === undefined
    ) {
      this.handleErrors();
    }

    const reviewRequest = {
      reviewers: reviewers,
      status: 'IN_REVIEW',
    };

    const response = await api.put(
      `/authoring-services/projects/${projectKey}/tasks/${taskKey}`,
      reviewRequest,
    );
    if (response.status !== 200) {
      this.handleErrors();
    }
    const returnTask = await this.getTask(projectKey, taskKey);
    return returnTask;
  },
  async updateTask(
    projectKey: string | undefined,
    taskKey: string | undefined,
    assignee: UserDetails | undefined,
    reviewers: UserDetails[],
  ): Promise<Task> {
    if (
      projectKey === undefined ||
      taskKey === undefined ||
      (assignee === undefined && reviewers === undefined)
    ) {
      this.handleErrors();
    }

    const taskRequest =
      assignee !== undefined
        ? {
            assignee: assignee,
          }
        : { reviewers: reviewers };
    const response = await api.put(
      `/authoring-services/projects/${projectKey}/tasks/${taskKey}`,
      taskRequest,
    );
    if (response.status !== 200) {
      this.handleErrors();
    }
    const returnTask = await this.getTask(projectKey, taskKey);
    return returnTask;
  },
  async updateTaskStatus(
    projectKey: string | undefined,
    taskKey: string | undefined,
    taskStatus: TaskStatus | undefined,
  ): Promise<Task> {
    if (
      projectKey === undefined ||
      taskKey === undefined ||
      taskStatus === undefined
    ) {
      this.handleErrors();
    }

    const taskRequest = {
      status: taskStatus?.toUpperCase().replace(/ /g, '_'),
    };
    const response = await api.put(
      `/authoring-services/projects/${projectKey}/tasks/${taskKey}`,
      taskRequest,
    );
    if (response.status !== 200) {
      this.handleErrors();
    }
    const returnTask = await this.getTask(projectKey, taskKey);
    return returnTask;
  },
  async fetchBranchDetails(branchPath: string): Promise<BranchDetails | null> {
    const response = await api.get(`/snowstorm/branches/${branchPath}`);
    if (response.status === 404) {
      return null;
    }
    if (response.status !== 200) {
      this.handleErrors();
    }
    return response.data as BranchDetails;
  },
  async createBranchForTask(
    branchCreationRequest: BranchCreationRequest,
  ): Promise<BranchDetails> {
    const response = await api.post(
      `/snowstorm/branches/`,
      branchCreationRequest,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as BranchDetails;
  },
  async searchTaskByKey(branchKey: string): Promise<Task[]> {
    const response = await api.get(
      `/authoring-services/projects/tasks/search?criteria=${branchKey}`,
    );
    if (response.status !== 200) {
      this.handleErrors();
    }

    return response.data as Task[];
  },
};

export default TasksServices;
