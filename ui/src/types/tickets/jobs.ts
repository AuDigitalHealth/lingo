import { BaseEntity } from './ticket';

export interface JobResult extends BaseEntity {
  id: number;
  jobName: string;
  jobId: string;
  finishedTime: string;
  results: Result[];
  acknowledged: boolean;
}

export interface Result {
  name: string;
  count: number;
  items: ResultItem[];
  id?: number;
}

export interface ResultItem {
  id: string;
  title?: string;
  link?: string;
}
