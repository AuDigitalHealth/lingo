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

import { JiraUser } from './JiraUserResponse';

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
  latestValidationStatus?: ValidationStatus;
  projectKey: string;
  latestClassificationJson?: Classification;
  reviewers: UserDetails[];
  status?: TaskStatus;
  summary: string;
  updated: string;
}

export interface TaskDto {
  key?: string;
  projectKey: string;
  // summary is the title, confusing
  summary: string;
  status?: TaskStatus;
  description: string;
  assignee?: JiraUser;
  // not entirely sure what this is
  labels?: [];
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
  // SavingInProgress = 'SAVING_IN_PROGRESS',
  Saved = 'SAVED',
  // SaveFailed = 'SAVE_FAILED',
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
// export enum RebaseStatus { uncomment if needed
//   UpToDate = 'UP_TO_DATE',
//   Forward = 'FORWARD',
//   Behind = 'BEHIND',
//   Diverged = 'DIVERGED',
//   Stale = 'Stale',
// }
// export enum FeedbackStatus {
//   None = 'none',
//   UnRead = 'unread',
// }

export interface TaskRequest {
  assignee: UserDetails;
  reviewers: UserDetails[];
}
