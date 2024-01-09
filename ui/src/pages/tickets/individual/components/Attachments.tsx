import { Box, Grid, IconButton, InputLabel, Tooltip } from '@mui/material';
import { Ticket } from '../../../../types/tickets/ticket';
import FileItem from './FileItem';
import AttachmentService from '../../../../api/AttachmentService';
import { PostAdd } from '@mui/icons-material';
import { useRef, useState } from 'react';
import React from 'react';

interface AttachmentProps {
  ticket?: Ticket;
}

function Attachments({ ticket }: AttachmentProps) {
  const len = ticket?.attachments?.length || 0;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      uploadAttachment(file);
    }
  };

  const uploadAttachment = (file: File) => {
    if (ticket) {
      AttachmentService.uploadAttachment(ticket?.id, file)
        .then(attachmentResponse => {
          console.log(attachmentResponse.message);
          setUploadComplete(true);
        })
        .catch(err => {
          console.log(err);
          setUploadComplete(false);
        });
    }
  };

  React.useEffect(() => {
    if (uploadComplete) {
      // Reset your component's state or perform other actions
      setUploadComplete(false);
    }
  }, [uploadComplete]);

  return (
    <>
      <InputLabel sx={{ mt: 1 }}>Attachments:</InputLabel>
      <Box
        sx={{
          mt: 1,
          border: 1,
          borderStyle: 'dashed',
          borderColor: '#dadada',
          position: 'relative',
        }}
      >
        <Grid
          container
          spacing={2}
          sx={{
            padding: '20px',
            minWidth: 1000,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {len > 0 && !uploadComplete ? (
            ticket?.attachments?.map(attachment => {
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
                  created={created.toLocaleString('en-AU')}
                  thumbnail={attachment.thumbnailLocation}
                />
              );
            })
          ) : (
            <Box>-- No attachments --</Box>
          )}
        </Grid>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <Tooltip title="Add new attachment">
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            color="secondary"
            sx={{
              right: 0,
              bottom: 0,
              margin: 1,
              position: 'absolute',
              '&:hover': {
                color: '#2647aa',
                backgroundColor: 'transparent',
              },
            }}
          >
            <PostAdd
              sx={{
                fontSize: 35,
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>
    </>
  );
}

export default Attachments;
