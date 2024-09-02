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
