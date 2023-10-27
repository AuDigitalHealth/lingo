import { FileDownload } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { useState } from 'react';
import ExportModal from './ExportModal';

export default function TicketsActionBar() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <ExportModal
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        title={'External Requesters Report'}
      />
      <Stack sx={{ width: '100%', padding: '0em 0em 1em 1em' }}>
        <Button
          variant="contained"
          color="info"
          startIcon={<FileDownload />}
          sx={{ marginLeft: 'auto' }}
          onClick={() => setModalOpen(true)}
        >
          External Requesters Report
        </Button>
      </Stack>
    </>
  );
}
