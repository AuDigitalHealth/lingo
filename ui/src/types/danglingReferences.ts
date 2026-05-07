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

export type ConceptStatus = 'ACTIVE' | 'RETIRED' | 'DELETED';
export type TidyKind = 'REFSET_MEMBER' | 'NON_DEFINING_RELATIONSHIP';
export type TidyAction = 'DELETED' | 'INACTIVATED';

export interface DanglingRefsetMember {
  memberId: string;
  refsetId: string;
  refsetPt: string | null;
  referencedConceptId: string;
  referencedConceptPt: string | null;
  referencedConceptStatus: ConceptStatus;
  released: boolean;
}

export interface DanglingNonDefiningRelationship {
  relationshipId: string;
  typeId: string;
  typePt: string | null;
  sourceId: string;
  sourcePt: string | null;
  sourceStatus: ConceptStatus;
  // destinationId is null for concrete-value relationships (numeric/string values).
  destinationId: string | null;
  destinationPt: string | null;
  destinationStatus: ConceptStatus;
  released: boolean;
}

export interface DanglingReferenceSummary {
  branch: string;
  danglingRefsetMembers: DanglingRefsetMember[];
  danglingNonDefiningRelationships: DanglingNonDefiningRelationship[];
}

export interface TidySuccess {
  kind: TidyKind;
  id: string;
  action: TidyAction;
}

export interface TidyFailure {
  kind: TidyKind;
  id: string;
  attemptedAction: TidyAction;
  errorMessage: string;
}

export interface TidyResult {
  succeeded: TidySuccess[];
  failed: TidyFailure[];
}
