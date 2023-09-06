export interface ConceptResponse {
  items: Concept[];
}

export interface Concept {
  conceptId: string;
  definitionStatus?: string;
  moduleId?: string;
  active?: boolean;
  pt: Term;
  fsn: Term;
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
