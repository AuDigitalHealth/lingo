import { useContext } from 'react';
import { PendingMutationsContext } from './PendingMutationsContext';

export const usePendingMutations = () => {
  const context = useContext(PendingMutationsContext);
  if (!context)
    throw new Error(
      'usePendingMutations must be used within PendingMutationsProvider',
    );
  return context;
};
