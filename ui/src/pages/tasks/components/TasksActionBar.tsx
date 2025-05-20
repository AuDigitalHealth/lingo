import { PlusCircleOutlined } from '@ant-design/icons';
import { Button, Stack } from '@mui/material';
import { useState } from 'react';
import TasksCreateModal from './TasksCreateModal';

interface TasksActionBarProps {
  redirectUrl: string;
}
export default function TasksActionBar({ redirectUrl }: TasksActionBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <TasksCreateModal
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        title={'Create Task'}
        redirectUrl={redirectUrl}
      />
      <Stack sx={{ width: '100%', padding: '0em 0em 1em 1em' }}>
        <Button
          data-testid={'create-task'}
          variant="contained"
          color="success"
          startIcon={<PlusCircleOutlined />}
          sx={{ marginLeft: 'auto' }}
          onClick={() => setModalOpen(true)}
        >
          Create Task
        </Button>
      </Stack>
    </>
  );
}
