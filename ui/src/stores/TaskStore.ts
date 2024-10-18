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
