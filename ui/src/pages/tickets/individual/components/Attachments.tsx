import { Box, Grid, InputLabel } from '@mui/material';
import { Attachment } from '../../../../types/tickets/ticket';
import FileItem from './FileItem';

interface AttachmentProps {
  attachments?: Attachment[];
}

function Attachments({ attachments }: AttachmentProps) {
  const len = attachments?.length || 0;
  return len > 0 ? (
    <>
      <InputLabel sx={{ mt: 1 }}>Attachments:</InputLabel>
      <Box
        sx={{
          mt: 1,
          border: 1,
          borderStyle: 'dashed',
          borderColor: '#dadada',
        }}
      >
        <Grid container spacing={2} sx={{ padding: '20px'}}>
          {attachments?.map(attachment => {
            return (
              <Grid item xs={2}>
                <FileItem filename={attachment.filename} id={attachment.id} />
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </>
  ) : (
    <></>
  );
}

export default Attachments;
