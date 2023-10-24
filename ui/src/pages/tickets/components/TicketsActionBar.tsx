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
        title={'Generate ADHA Report'}
      />
      <Stack sx={{ width: '100%', padding: '1em 1em 1em 0em' }}>
        <Button
          variant="contained"
          color="info"
          startIcon={<FileDownload />}
          sx={{ marginLeft: 'auto' }}
          onClick={() => setModalOpen(true)}
        >
          Create Adha Report
        </Button>
      </Stack>
    </>
  );
}
