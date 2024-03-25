import { Concept } from './concept.ts';
import { ProductType } from './product.ts';

export interface ProductTableRow {
  id: number;
  name: string;
  conceptId: string | null;
  concept: Concept | undefined;
  status: string;
  ticketId: number;
  idToDelete: number;
  version: number;
  productType: ProductType | undefined;
}
export enum ProductStatus {
  Completed = 'completed',
  Partial = 'partial',
}
