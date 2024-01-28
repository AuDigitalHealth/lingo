import { Concept } from './concept.ts';

export interface ProductTableRow {
  id: number;
  name: string;
  conceptId: string | null;
  concept: Concept | undefined;
  status: string;
  ticketId: number;
  idToDelete: number;
  version: number;
}
export enum ProductStatus {
  Completed = 'completed',
  Partial = 'partial',
}
