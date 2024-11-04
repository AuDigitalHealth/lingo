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

import { BaseEntity } from './ticket';

export interface JobResult extends BaseEntity {
  id: number;
  jobName: string;
  jobId: string;
  finishedTime: string;
  results: Result[];
  acknowledged: boolean;
  nestedError?: string;
}

export interface Result {
  name: string;
  count: number;
  results?: Result[];
  items?: ResultItem[];
  notification?: ResultNotification;
  id?: number;
}

export interface ResultItem {
  id: string;
  title?: string;
  link?: string;
}

export interface ResultNotification {
  type: ResultNotificationType;
  description: string;
}

export enum ResultNotificationType {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
}

export const getSeverityRank = (type: ResultNotificationType): number => {
  switch (type) {
    case ResultNotificationType.ERROR:
      return 3;
    case ResultNotificationType.WARNING:
      return 2;
    case ResultNotificationType.SUCCESS:
      return 1;
    default:
      return 0;
  }
};

export function isJobResult(result: JobResult | Result): result is JobResult {
  return 'jobName' in result;
}
