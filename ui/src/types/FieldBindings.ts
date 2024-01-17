import { Concept } from './concept.ts';

export interface FieldBindings {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bindingsMap: Map<string, any>;
}
export interface FieldEclGenerated {
  actualEcl: string;
  generatedEcl: string;
  relatedFields: RelatedField[];
}
export interface RelatedField {
  relatedTo: string | undefined;
  relatedValue: Concept | undefined;
}
