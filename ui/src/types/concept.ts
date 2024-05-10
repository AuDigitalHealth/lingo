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
export interface ConceptDetails {
  conceptId: string;
  specifiedConceptId: string;
  fullySpecifiedName: string;
  preferredTerm: string;
  semanticTag: string;
  axioms: Axiom[];
}
export interface Axiom {
  axiomId: string;
  moduleId: string;
  active: boolean;
  released: boolean | null;
  definitionStatusId: string;
  relationships: AxiomRelationship[];
  definitionStatus: DefinitionStatus;
  id: string;
  effectiveTime: number | null;
}
export interface AxiomRelationship {
  internalId: string;
  path: string;
  start: string;
  end: string;
  deleted: boolean | null;
  changed: boolean | null;
  active: boolean;
  moduleId: string;
  effectiveTimeI: number | null;
  released: boolean | null;
  releaseHash: string;
  releasedEffectiveTime: number | null;
  relationshipId: string;
  sourceId: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any;
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
export interface ProductModel {
  subject?: Product;
  nodes: Product[];
  edges: Edge[];
}

export interface Edge {
  source: string;
  target: string;
  label: string;
}
export interface Product {
  concept: Concept | null;
  label: string;
  newConceptDetails: ConceptDetails;
  conceptOptions: Concept[];
  newConcept: boolean;
  conceptId: string;
  preferredTerm?: string;
  fullySpecifiedName?: string;
}
