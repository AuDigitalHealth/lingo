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
  branchState: BranchState;
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

export enum BranchState {
  Behind = 'BEHIND',
  // Parent branch has at least one change whilst the branch is unchanged. Branch can be safely rebased in this state, to bring in the parent changes.
  Up_To_Date = 'UP_TO_DATE',
  // Branch is synchronised with parent
  Forward = 'FORWARD',
  // Branch has at least one change whilst its parent branch is unchanged. This is the required state for merging a branch.
  Diverged = 'DIVERGED',
  // Both branch and its parent have at least one change since branch creation. Branch must be rebased before it can be safely promoted, to bring in the parent changes before promoting the branch.
  Stale = 'STALE',
  // Branch is no longer associated with its original parent (and should be deleted).
}

export interface IntegrityCheckResponse {
  empty: boolean;
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
  redundantStatedRelationshipsFound: boolean;
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
  SavingInProgress = 'SAVING_IN_PROGRESS',
  Saved = 'SAVED',
  SaveFailed = 'SAVE_FAILED',
}

export enum FeedbackStatus {
  Read = 'read',
  Unread = 'unread',
  None = 'none',
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
  Auto_Classifying = 'Auto Classifying',
  Auto_Promoting = 'Auto Promoting',
  Deleted = 'Deleted',
  Unknown = 'Unknown',
}
export interface TaskRequest {
  assignee: UserDetails;
  reviewers: UserDetails[];
}
