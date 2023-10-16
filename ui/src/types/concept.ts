export interface ConceptResponse {
  items: Concept[];
}

export enum DefinitionStatus {
  Primitive = 'PRIMITIVE',
  FullyDefined = 'FULLY_DEFINED',
}
export interface Concept {
  conceptId: string;
  active: boolean;
  definitionStatus: DefinitionStatus;
  moduleId: string;
  effectiveTime: string | null;
  fsn: Term;
  pt: Term;
  descendantCount: string | null;
  isLeafInferred: boolean | null;
  //isLeafStated: any;
  id: string;
  // definitionStatusId: any;
  // leafInferred: any;
  // leafStated: any;
  // extraFields: any;
  idAndFsnTerm: string | null;
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
  subject: Concept;
  nodes: Product[];
  edges: Edge[];
}
export interface Product {
  concept: Concept;
  label: string;
}
export interface Edge {
  source: string;
  target: string;
  label: string;
}
