import {
  Iteration,
  PriorityBucket,
  State,
} from '../../../types/tickets/ticket';

export function getIterationValue(
  name: string | undefined,
  iterationList: Iteration[],
) {
  const iteration: Iteration | undefined = iterationList.find(
    iterationItem => iterationItem.name === name,
  );
  return iteration;
}

export function getStateValue(stateName: string | undefined, states: State[]) {
  return states.find(stateItem => stateItem.label === stateName);
}

export function getPriorityValue(
  name: string | undefined,
  priorityBucketList: PriorityBucket[],
) {
  const priorityBucket: PriorityBucket | undefined = priorityBucketList.find(
    priorityBucketItem => priorityBucketItem.name === name,
  );
  return priorityBucket;
}
