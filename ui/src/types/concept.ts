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

import { RefsetMember } from './RefsetMember.ts';
import { NonDefiningProperty } from './product.ts';

export enum DefinitionStatus {
  Primitive = 'PRIMITIVE',
  FullyDefined = 'FULLY_DEFINED',
}

export interface Concept {
  conceptId?: string;
  active?: boolean;
  definitionStatus?: DefinitionStatus | null;
  moduleId?: string | null;
  effectiveTime?: string | null;
  fsn?: Term;
  pt?: Term;
  descendantCount?: string | null | number;
  isLeafInferred?: boolean | null;
  relationships?: SnowstormRelationship[];
  classAxioms?: SnowstormAxiom[];
  gciAxioms?: SnowstormAxiom[];
  //isLeafStated: any;
  id?: string | null;
  // definitionStatusId: any;
  // leafInferred: any;
  // leafStated: any;
  // extraFields: any;
  idAndFsnTerm?: string | null;
}
export interface ConceptMini {
  conceptId: string;
  pt?: Term;
  fsn?: Term;
}

export interface BrowserConcept extends Concept {
  descriptions: Description[];
}

export type Acceptability = 'PREFERRED' | 'ACCEPTABLE' | 'SYNONYM';

export type Description = {
  active: boolean;
  moduleId: string;
  released: boolean;
  descriptionId?: string;
  term: string;
  conceptId: string;
  typeId: string;
  // where the string is the conceptId of the dialect
  acceptabilityMap?: Record<string, Acceptability>;
  type: 'FSN' | 'SYNONYM' | 'TEXT_DEFINITION';
  lang: string;
  caseSignificance:
    | 'ENTIRE_TERM_CASE_SENSITIVE'
    | 'CASE_INSENSITIVE'
    | 'INITIAL_CHARACTER_CASE_INSENSITIVE';
};

export interface SnowstormAxiom {
  axiomId: string;
  moduleId: string;
  active: boolean;
  released: boolean;
  definitionStatusId: string;
  relationships: SnowstormRelationship[];
  definitionStatus: string;
  id: string;
  effectiveTime: number;
}

export interface SnowstormRelationship {
  internalId: string;
  path: string;
  start: string; // Assuming OffsetDateTime is serialized as string
  end: string; // Assuming OffsetDateTime is serialized as string
  deleted: boolean;
  changed: boolean;
  active: boolean;
  moduleId: string;
  effectiveTimeI: number;
  released: boolean;
  releaseHash: string;
  releasedEffectiveTime: number;
  relationshipId: string;
  sourceId: string;
  destinationId: string;
  value: string;
  concreteValue: ConcreteValue;
  relationshipGroup: number;
  typeId: string;
  characteristicTypeId: string;
  modifierId: string;
  source: Concept;
  type: Concept;
  target: Concept;
  characteristicType: string;
  groupId: number;
  grouped: boolean;
  inferred: boolean;
  relationshipIdAsLong: number;
  modifier: string;
  concrete: boolean;
  effectiveTime: string;
  id: string;
}

export interface ConcreteValue {
  dataType: string;
  value?: string;
  valueWithPrefix?: string;
}

export interface ConceptResponse {
  items: Concept[];
  total: number;
  limit: number;
  offset: number;
  searchAfter: string;
  searchAfterArray: string[];
}
export interface ConceptResponseForIds {
  items: string[];
  total: number;
  limit: number;
  offset: number;
  searchAfter: string;
  searchAfterArray: string[];
}

export interface ConceptDetails {
  conceptId: number;
  specifiedConceptId: string | null;
  fullySpecifiedName: string;
  preferredTerm: string;
  semanticTag: string;
  axioms: Axiom[];
}

export interface Axiom {
  axiomId: string | null;
  moduleId: string;
  active: boolean;
  released: boolean | null;
  definitionStatusId: string | null;
  relationships: AxiomRelationship[];
  definitionStatus: DefinitionStatus;
  id: string;
  effectiveTime: number | null;
}

export interface NewConceptAxioms {
  axiomId: string | null;
  moduleId: string;
  active: boolean;
  released: boolean | null;
  definitionStatusId: string | null;
  relationships: AxiomRelationshipNewConcept[];
  definitionStatus: DefinitionStatus;
  id: string | null;
  effectiveTime: number | null;
}

export interface AxiomRelationship {
  internalId: string | null;
  path: string | null;
  start: string | null;
  end: string | null;
  deleted: boolean | null;
  changed: boolean | null;
  active: boolean;
  moduleId: string;
  effectiveTimeI: number | null;
  released: boolean | null;
  releaseHash: string | null;
  releasedEffectiveTime: number | null;
  relationshipId: string | null;
  sourceId: string | null;
  destinationId: string;
  value: string | null;
  concreteValue: string | null;
  relationshipGroup: number | null;
  typeId: string;
  characteristicTypeId: string;
  modifierId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: any;
  type: string;
  target: Concept;
  characteristicType: string;
  groupId: number;
  grouped: boolean;
  inferred: boolean;
  relationshipIdAsLong: number | null;
  modifier: string;
  concrete: boolean;
  effectiveTime: string;
  id: string;
}

export interface AxiomRelationshipNewConcept {
  internalId: string | null;
  path: string | null;
  start: string | null;
  end: string | null;
  deleted: boolean | null;
  changed: boolean | null;
  active: boolean;
  moduleId: string;
  effectiveTimeI: number | null;
  released: boolean | null;
  releaseHash: string | null;
  releasedEffectiveTime: number | null;
  relationshipId: string | null;
  sourceId: string | null;
  destinationId: string;
  value: string | null;
  concreteValue: ConcreteValue | null;
  relationshipGroup: number | null;
  typeId: string;
  characteristicTypeId: string;
  modifierId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: any;
  type: Concept;
  target: Concept;
  characteristicType: string;
  groupId: number;
  grouped: boolean;
  inferred: boolean;
  relationshipIdAsLong: number | null;
  modifier: string;
  concrete: boolean;
  effectiveTime: string | null;
  id: string | null;
}

export interface Term {
  term: string;
  lang?: string;
}

export interface ConceptSearchResponse {
  items: ConceptSearchItem[];
}

export interface ConceptSearchItem {
  referencedComponent: Concept;
}
export interface ProductSummary {
  subjects: Product[];
  nodes: Product[];
  edges: Edge[];
}

export interface Edge {
  source: string;
  target: string;
  label: string;
}

class InactivationReason {
  value: string;
  label: string;
}

class OriginalNode {
  node: Product | null;
  inactivationReason: InactivationReason | null;
  referencedByOtherProducts: boolean;
}

export interface Product {
  displayName: string;
  concept: Concept | null;
  label: string;
  newConceptDetails: NewConceptDetails | null;
  conceptOptions: Concept[];
  newConcept: boolean;
  conceptId: string;
  preferredTerm?: string;
  fullySpecifiedName?: string;
  generatedPreferredTerm?: string;
  generatedFullySpecifiedName?: string;
  newInTask: boolean;
  newInProject: boolean;
  nonDefiningProperties?: NonDefiningProperty[];
  isModified?: boolean;
  propertyUpdate: boolean;
  originalNode: OriginalNode | null;
  statedFormChanged: boolean | null;
  inferredFormChanged: boolean | null;
  historicalAssociations?: RefsetMember[];
}

export function hasDescriptionChange(product: Product): boolean {
  return (
    product.originalNode != null &&
    (product.fullySpecifiedName !==
      product.originalNode.node?.fullySpecifiedName ||
      product.preferredTerm !== product.originalNode.node?.preferredTerm)
  );
}

export function hasHistoricalAssociationsChanged(product: Product): boolean {
  const filtered = product?.historicalAssociations?.filter(ass => {
    return ass.released === false;
  });

  return filtered?.length !== undefined && filtered?.length > 0;
}

export interface NewConceptDetails {
  conceptId: number;
  specifiedConceptId: string | null;
  fullySpecifiedName: string;
  preferredTerm: string;
  semanticTag: string;
  axioms: NewConceptAxioms[];
  referenceSetMembers: RefsetMember[];
  fsn?: Term;
  pt?: Term;
}

export enum Product7BoxBGColour {
  NEW = '#00A854',
  PRIMITIVE = '#99CCFF',
  FULLY_DEFINED = '#CCCCFF',
  INVALID = '#F04134',
  INCOMPLETE = '#FFA500',
  PROPERTY_CHANGE = '#FFD700',
}
