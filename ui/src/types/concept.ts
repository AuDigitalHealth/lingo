export interface ConceptResponse {
  items: Concept[];
}

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
  pt: Term;
  descendantCount?: string | null;
  isLeafInferred?: boolean | null;
  //isLeafStated: any;
  id?: string | null;
  // definitionStatusId: any;
  // leafInferred: any;
  // leafStated: any;
  // extraFields: any;
  idAndFsnTerm?: string | null;
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
  subject?: Concept;
  nodes: Product[];
  edges: Edge[];
}
export interface Product {
  concept: Concept;
  label: string;
  newConceptDetails: ConceptDetails;
  newConcept: boolean;
  conceptId: string;
}
export interface Edge {
  source: string;
  target: string;
  label: string;
}
