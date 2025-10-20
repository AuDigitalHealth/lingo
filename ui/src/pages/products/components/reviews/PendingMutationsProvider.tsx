import { createContext, useCallback, useContext, useState } from 'react';
import { PendingMutationsContext } from './PendingMutationsContext';

export const PendingMutationsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const addPendingMutation = useCallback((id: string) => {
    setPendingIds(prev => new Set(prev).add(id));
  }, []);

  const removePendingMutation = useCallback((id: string) => {
    setPendingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return (
    <PendingMutationsContext.Provider
      value={{
        isAnyMutationPending: pendingIds.size > 0,
        addPendingMutation,
        removePendingMutation,
      }}
    >
      {children}
    </PendingMutationsContext.Provider>
  );
};
