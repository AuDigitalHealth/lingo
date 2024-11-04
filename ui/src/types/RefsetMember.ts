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

export interface RefsetMember {
  path?: string;
  start?: string;
  end?: string;
  deleted?: boolean;
  changed?: boolean;
  active?: boolean;
  moduleId?: string;
  released?: boolean;
  releaseHash?: string;
  releasedEffectiveTime?: number;
  memberId?: string;
  refsetId: string;
  referencedComponentId: string;
  conceptId?: string;
  additionalFields?: Record<string, string>;
  referencedComponent?: object;
  effectiveTime?: string;
}

export interface RefsetMembersResponse {
  items: RefsetMember[];
  total: number;
  limit: number;
  offset: number;
  searchAfter: string;
  searchAfterArray: string[];
}

export interface BulkStatus {
  id: string;
  startTime: number;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  memberIds?: string[];
  endTime?: number;
  message?: string;
  secondsDuration?: number;
}
