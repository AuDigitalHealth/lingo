import { PlusCircleOutlined } from '@ant-design/icons';
import { FileDownload } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { useState } from 'react';
import TasksCreateModal from './TasksCreateModal';

export default function TasksActionBar() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <TasksCreateModal
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        title={'Create Task'}
      />
      <Stack sx={{ width: '100%', padding: '0em 0em 1em 1em' }}>
        <Button
          variant="contained"
          color="info"
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
