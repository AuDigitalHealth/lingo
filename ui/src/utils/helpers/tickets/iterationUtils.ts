import { Iteration } from '../../../types/tickets/ticket';

export function mapToIterationOptions(iterations: Iteration[]) {
  const iterationsList = iterations.map(iteration => {
    return { value: iteration.name, label: iteration.name };
  });
  return iterationsList;
}
