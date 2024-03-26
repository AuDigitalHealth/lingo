import React from 'react';

import { useLocation } from 'react-router-dom';

import { Ticket } from '../../types/tickets/ticket.ts';
import { Task } from '../../types/task.ts';
import ProductAuthoring from './ProductAuthoring.tsx';
import { ProductType } from '../../types/product.ts';

interface LocationState {
  productName: string;
  productType: ProductType | undefined;
}
interface ProductAuthoringEditProps {
  ticket: Ticket;
  task: Task;
}
function ProductAuthoringEdit({ ticket, task }: ProductAuthoringEditProps) {
  const location = useLocation();

  if (location !== null && location.state) {
    const locationState = location.state as LocationState;
    if (locationState.productName !== null) {
      return (
        <ProductAuthoring
          ticket={ticket}
          task={task}
          productName={locationState.productName}
          productType={locationState.productType}
        />
      );
    }
  }
  return <></>;
}

export default ProductAuthoringEdit;
