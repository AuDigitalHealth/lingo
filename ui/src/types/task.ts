export interface Task {
  assignee: Assignee;
  branchBaseTimeStamp: number;
  branchHeadTimeStamp: number;
  branchPath: string;
  branchState: string;
  created: string;
  description: string;
  feedBackMessageStatus: string;
  key: string;
  latestValidationStatus: string;
  projectKey: string;
  status: string;
  summary: string;
  updated: string;
}
export interface Assignee {
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string;
}
