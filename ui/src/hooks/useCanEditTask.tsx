import { useEffect, useState } from 'react';
import useUserStore from '../stores/UserStore';
import useTaskById from './useTaskById';
import { ClassificationStatus, Task, TaskStatus } from '../types/task.ts';
import { useQuery } from '@tanstack/react-query';
import TasksServices from '../api/TasksService.ts';

export default function useCanEditTask() {
  const user = useUserStore();
  const task = useTaskById();
  const [canEdit, setCanEdit] = useState(false);
  const { isLocked, lockDescription } = useIsTaskLocked(task, user.login);
  useEffect(() => {
    setCanEdit(!isLocked);
  }, [user, task, isLocked]);

  return { canEdit, lockDescription };
}
function useIsTaskLocked(task: Task | null | undefined, login: string | null) {
  const [isLocked, setLocked] = useState(false);
  const [lockDescription, setLockDescription] = useState('');
  const shouldCall = () => {
    const call =
      task !== undefined &&
      task?.status !== undefined &&
      task?.status !== TaskStatus.Completed &&
      task?.status !== TaskStatus.Deleted &&
      task?.status !== TaskStatus.ReviewCompleted &&
      task.status !== TaskStatus.Promoted &&
      task.latestClassificationJson?.status !== ClassificationStatus.Running;

    return call;
  };

  const { isLoading, data } = useQuery(
    [`fetch-branch-${task ? task.branchPath : undefined}-state`],
    () => {
      if (task && task.branchPath) {
        return TasksServices.fetchBranchDetails(task.branchPath);
      } else {
        return null;
      }
    },

    {
      staleTime: 1000 * 2,
      enabled: shouldCall(),
    },
  );
  useEffect(() => {
    if (data && data.locked) {
      setLocked(true);
      setLockDescription('Branch is locked');
    }
  }, [data, isLoading]);

  if (task && !isLocked) {
    if (task?.assignee.username != login) {
      setLocked(true);
      setLockDescription('Must be Task owner');
    } else if (
      task.latestClassificationJson &&
      task.latestClassificationJson.status &&
      task.latestClassificationJson?.status === ClassificationStatus.Running
    ) {
      setLocked(true);
      setLockDescription('Classification is running');
    } else if (task.status === TaskStatus.Promoted) {
      setLocked(true);
      setLockDescription('Task has been promoted. No further changes allowed.');
    }
  }

  return { isLocked, lockDescription };
}
