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

import { Concept } from './concept';

export interface ConceptReview {
  conceptId?: string;
  concept?: Concept;
  reviews?: ConceptReviewFeedback;
  unread?: boolean;
  approved?: boolean;
}

export interface ConceptReviewFeedback {
  id: string;
  viewDate: string;
  messages?: ReviewMessage[];
  unread: boolean;
}

export interface ReviewMessage {
  id: number;
  branch: ReviewBranch;
  messageHtml: string;
  creationDate: string;
  fromUsername: string;
  feedbackRequested: boolean;
  subjectConceptIds: string[];
}

export interface ReviewMessagePost {
  event: string;
  messageHtml: string;
  feedbackRequested: boolean;
  subjectConceptIds: string[];
}

export interface ReviewBranch {
  project: string;
  task: string;
}
export interface Activity {
  id: string;
  username: string;
  branch: string;
  branchDepth: number;
  activityType: string;
  conceptChanges: ConceptChange[];
}
export interface ConceptChange {
  conceptId: string;
}

export interface ReviewedList {
  conceptIds: string[];
  approvalDate: string;
}
