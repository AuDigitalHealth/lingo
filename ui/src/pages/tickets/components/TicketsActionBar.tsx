import { FileDownload } from '@mui/icons-material';
import { PlusCircleOutlined } from '@ant-design/icons';
import { Button, Stack } from '@mui/material';
import { useState } from 'react';
import ExportModal from './ExportModal';
import CreateTicketModal from './CreateTicketModal';

export default function TicketsActionBar() {
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  return (
    <>
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
        <Button
          id="create-ticket"
          variant="contained"
          color="success"
          startIcon={<PlusCircleOutlined />}
          sx={{ marginLeft: 'auto' }}
          onClick={() => setTicketModalOpen(true)}
        >
          Create Ticket
        </Button>
      </Stack>
    </>
  );
}
