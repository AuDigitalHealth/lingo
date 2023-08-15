import { ReactNode, useState } from 'react';
import { Card, Grid, Tab, Tabs } from '@mui/material';

import useTaskById from '../hooks/useTaskById';
import TaskEditCard from '../components/tasks/TaskEditCard';

function TaskEditLayout() {
  const task = useTaskById();

  return (
    <Grid container sx={{ minHeight: 'calc(100vh - 110px)' }}>
      <Grid item lg={3} sx={{ maxWidth: '300px' }}>
        <TaskEditCard />
      </Grid>
    </Grid>
  );
}

export default TaskEditLayout;
