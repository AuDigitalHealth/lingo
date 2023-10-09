import { Box, Grid, InputLabel, Tooltip } from '@mui/material';
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
        <Grid container spacing={2} sx={{ padding: '20px', minWidth: 1000 }}>
          {attachments?.map(attachment => {
            const createdDate =
              attachment.jiraCreated ||
              attachment.modified ||
              attachment.created;
            const created = new Date(Date.parse(createdDate));
            return (
              <FileItem
                key={attachment.id}
                filename={attachment.filename}
                id={attachment.id}
                created={created.toLocaleString()}
                thumbnail={attachment.thumbnailLocation}
              />
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
