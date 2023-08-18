export interface Task {
  assignee: UserDetails;
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
  latestClassificationJson?: Classification;
  reviewers: UserDetails[];
  status: TaskStatus;
  summary: string;
  updated: string;
}
export interface UserDetails {
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string;
}
export interface Classification {
  completionDate: string;
  creationDate: string;
  equivalentConceptsFound: boolean;
  id: string;
  inferredRelationshipChangesFound: boolean;
  lastCommitDate: string;
  path: string;
  reasonerId: string;
  status: ClassificationStatus;
  userId: string;
}

export enum ClassificationStatus {
  Scheduled = 'SCHEDULED',
  Running = 'RUNNING',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED',
  Stale = 'STALE',
  // SavingInProgress nfi?
  Saved = 'SAVED',
  // SaveFailed = nfi?

  // nfi
}

export enum TaskStatus {
  New = 'New',
  InProgress = 'In Progress',
  InReview = 'In Review',
  ReviewCompleted = 'Review Completed',
  Promoted = 'Promoted',
  Completed = 'Completed',
  Deleted = 'Deleted',
  Unknown = 'Unknown',
}

export interface TaskRequest {
  assignee: UserDetails;
  reviewers: UserDetails[];
}
