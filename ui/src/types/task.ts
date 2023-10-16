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
  latestValidationStatus: ValidationStatus;
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

export enum ValidationStatus {
  NotTriggered = 'NOT_TRIGGERED',
  Failed = 'FAILED',
  Pending = 'PENDING',
  Stale = 'STALE',
  Scheduled = 'SCHEDULED',
  Completed = 'COMPLETED',
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
export enum RebaseStatus {
  UpToDate = 'UP_TO_DATE',
  Forward = 'FORWARD',
  Behind = 'BEHIND',
  Diverged = 'DIVERGED',
  Stale = 'Stale',
}
export enum FeedbackStatus {
  None = 'none',
  UnRead = 'unread',
}

export interface TaskRequest {
  assignee: UserDetails;
  reviewers: UserDetails[];
}
