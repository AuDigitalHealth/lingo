import { useEffect, useState } from 'react';
import useUserStore from '../stores/UserStore';
import useTaskById from './useTaskById';

export default function useCanEditTask() {
  const user = useUserStore();
  const task = useTaskById();
  const [canEdit, setCanEdit] = useState(false);
  useEffect(() => {
    setCanEdit(user.login === task?.assignee.username);
  }, [user, task]);

  return [canEdit];
}
