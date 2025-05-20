import { Stack } from '@mui/system';
import { Typography } from '@mui/material';
import TasksList from '../tasks/components/TasksList.tsx';

function TaskEditLayout() {
  return (
    <Stack spacing={4}>
      <Typography variant="h1" sx={{ fontSize: '1.5rem', color: '#003665' }}>
        Snodine
      </Typography>
      <TasksList
        heading="My Tasks"
        isSnodineList={true}
        displayProject={true}
        path="/snodine"
        taskCreateRedirectUrl="/dashboard/snodine/task/:projectKey"
      />
    </Stack>
  );
}

export default TaskEditLayout;
