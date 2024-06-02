import { FileDownload } from '@mui/icons-material';
import { PlusCircleOutlined } from '@ant-design/icons';
import { Button, Stack } from '@mui/material';
import { useState } from 'react';
import ExportModal from './ExportModal';
import CreateTicketModal from './CreateTicketModal';
import TasksCreateModal from '../../tasks/components/TasksCreateModal';

export default function TicketsActionBar() {
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [tasksModalOpen, setTasksModalOpen] = useState(false);
  return (
    <>
      <TasksCreateModal
        title="Create Task"
        open={tasksModalOpen}
        handleClose={() => setTasksModalOpen(false)}
        redirectEnabled={false}
      />
      <CreateTicketModal
        open={ticketModalOpen}
        handleClose={() => setTicketModalOpen(false)}
        title={'Create Ticket'}
      />
      <ExportModal
        open={exportModalOpen}
        handleClose={() => setExportModalOpen(false)}
        title={'External Requesters Report'}
      />
      <Stack
        sx={{ width: '100%', padding: '0em 0em 1em 1em', flexDirection: 'row' }}
      >
        <Button
          variant="contained"
          color="info"
          startIcon={<FileDownload />}
          sx={{ marginRight: 'auto' }}
          onClick={() => setExportModalOpen(true)}
        >
          External Requesters Report
        </Button>
        <Stack
          gap={1}
          display={'flex'}
          flexDirection={'row'}
          sx={{ marginLeft: 'auto' }}
        >
          <Button
            id="create-task"
            variant="contained"
            color="success"
            startIcon={<PlusCircleOutlined />}
            onClick={() => setTasksModalOpen(true)}
          >
            Create Task
          </Button>
          <Button
            id="create-ticket"
            variant="contained"
            color="success"
            startIcon={<PlusCircleOutlined />}
            // sx={{ marginLeft: 'auto' }}
            onClick={() => setTicketModalOpen(true)}
          >
            Create Ticket
          </Button>
        </Stack>
      </Stack>
    </>
  );
}
