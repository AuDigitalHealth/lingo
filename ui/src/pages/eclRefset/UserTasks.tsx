import { Stack } from '@mui/system';
import UserTasksList from './components/UserTasksList.tsx';
import { Typography } from '@mui/material';

function TaskEditLayout() {
  return (
    <Stack spacing={4}>
      <Typography variant="h1" sx={{ fontSize: '1.5rem', color: '#003665' }}>
        ECL Refset Tool
      </Typography>
      <UserTasksList heading="My Tasks" />
    </Stack>
  );
}

export default TaskEditLayout;
