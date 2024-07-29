import { useEffect, useState } from 'react';
import { TaskAssocation } from '../types/tickets/ticket';
import { useInitializeTaskAssociations } from './api/useInitializeTickets';

export function useGetTaskAssociationsByTaskId(
  taskId: string | undefined,
): TaskAssocation[] {
  const taskAssociationsQuery = useInitializeTaskAssociations();
  const [taskAssociations, setTaskAssociations] = useState<TaskAssocation[]>(
    [],
  );

  useEffect(() => {
    if (taskAssociationsQuery.taskAssociationsData) {
      setTaskAssociations(
        taskAssociationsQuery.taskAssociationsData.filter(taskAssociation => {
          return taskAssociation.taskId === taskId;
        }),
      );
    }
  }, [taskAssociationsQuery.taskAssociationsData]);

  return taskAssociations;
}

export function getTaskAssociationsByTaskId(
  taskId: string | undefined,
  taskAssocations: TaskAssocation[] | undefined,
): TaskAssocation[] {
  if (taskAssocations === undefined) return [];
  return taskAssocations.filter(taskAssociation => {
    return taskAssociation.taskId === taskId;
  });
}
