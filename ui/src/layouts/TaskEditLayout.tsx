import { ReactNode, useState } from 'react';
import { Card, Grid, Tab, Tabs } from '@mui/material';

import useTaskById from '../hooks/useTaskById';
import TaskEditCard from '../components/tasks/TaskEditCard';
import TasksList from '../components/TasksList';
import { Stack } from '@mui/system';

function TaskEditLayout() {
  const task = useTaskById();

  return (
    <Grid container sx={{ minHeight: 'calc(100vh - 110px)' }}>
      <Stack spacing={1} alignItems={'center'} width={'100%'}>
        <TasksList
          tasks={task ? [task] : []}
          heading=""
          dense={true}
          naked={true}
        />
        <Grid container sx={{ height: '100%' }}>
          <Grid item lg={3} sx={{ maxWidth: '300px' }}>
            <TaskEditCard />
          </Grid>
        </Grid>
      </Stack>
    </Grid>
  );
}

export default TaskEditLayout;
