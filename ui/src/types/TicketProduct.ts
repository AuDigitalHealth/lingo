import { Concept } from './concept.ts';
import { ProductType } from './product.ts';

export interface ProductTableRow {
  id: number;
  productId?: number;
  name: string;
  conceptId: string | null;
  concept: Concept | undefined;
  status: string;
  ticketId: number;
  idToDelete: number;
  version: number | undefined;
  productType: ProductType | undefined;
  bulkProductActionId?: number;
  conceptIds?: string[];
}
export enum ProductStatus {
  Completed = 'completed',
  Partial = 'partial',
}
