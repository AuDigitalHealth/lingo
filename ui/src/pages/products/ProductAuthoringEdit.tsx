import React from 'react';

import { useLocation } from 'react-router-dom';

import { Ticket } from '../../types/tickets/ticket.ts';
import { Task } from '../../types/task.ts';
import ProductAuthoring from './ProductAuthoring.tsx';

interface LocationState {
  productName: string;
}
interface ProductModelEditProps {
  ticket: Ticket;
  task: Task;
}
function ProductModelEdit({ ticket, task }: ProductModelEditProps) {
  const location = useLocation();

  if (location !== null && location.state) {
    const locationState = location.state as LocationState;
    if (locationState.productName !== null) {
      return (
        <ProductAuthoring
          ticket={ticket}
          task={task}
          productName={locationState.productName}
        />
      );
    }
  }
  return <></>;
}

export default ProductModelEdit;
