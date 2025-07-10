import { Stack } from '@mui/system';
import { Typography } from '@mui/material';
import TasksList from '../tasks/components/TasksList.tsx';
import { useCallback, useEffect, useState } from 'react';
import {
  useInitializeUserReviewTasks,
  useInitializeUserTasks,
} from '../../hooks/api/useAllTasks.tsx';
import { userExistsInList } from '../../utils/helpers/userUtils.ts';
import useUserStore from '../../stores/UserStore.ts';

import { Task } from '../../types/task.ts';
import useAvailableProjects from '../../hooks/api/useInitializeProjects.tsx';

function TaskEditLayout() {
  const { userTasksData, userTasksIsLoading } = useInitializeUserTasks();
  const { userReviewTasksData, userReviewTasksIsLoading } =
    useInitializeUserReviewTasks();
  const { login } = useUserStore();
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  const getFilteredUserReviewTasks = useCallback(() => {
    return userReviewTasksData?.filter(task => {
      if (userExistsInList(task.reviewers, login)) {
        return true;
      }
    });
  }, [userReviewTasksData, login]);

  useEffect(() => {
    setLocalTasks([
      ...(userTasksData ?? []),
      ...(getFilteredUserReviewTasks() ?? []),
    ]);
  }, [userTasksData, getFilteredUserReviewTasks]);

  const { data: projects } = useAvailableProjects();

  return (
    <Stack spacing={4}>
      <Typography variant="h1" sx={{ fontSize: '1.5rem', color: '#003665' }}>
        Snodine
      </Typography>
      <TasksList
        loading={userReviewTasksIsLoading || userTasksIsLoading}
        propTasks={localTasks}
        heading="My Tasks"
        isSnodineList={true}
        displayProject={true}
        taskCreateRedirectUrl="/dashboard/snodine/task/:projectKey"
        projectOptions={projects}
      />
    </Stack>
  );
}

export default TaskEditLayout;
