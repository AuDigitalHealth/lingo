import { createContext } from 'react';

export const PendingMutationsContext = createContext<{
  isAnyMutationPending: boolean;
  addPendingMutation: (id: string) => void;
  removePendingMutation: (id: string) => void;
}>({
  isAnyMutationPending: false,
  addPendingMutation: () => {},
  removePendingMutation: () => {},
});
