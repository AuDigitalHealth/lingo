import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  InputLabel,
} from '@mui/material';
import { Ticket } from '../../../../types/tickets/ticket';
import FileItem from './FileItem';
import AttachmentService from '../../../../api/AttachmentService';
import { useRef, useState } from 'react';
import React from 'react';
import useCanEditTicket from '../../../../hooks/api/tickets/useCanEditTicket.tsx';
import UnableToEditTicketTooltip from '../../components/UnableToEditTicketTooltip.tsx';

interface AttachmentProps {
  ticket?: Ticket;
  onRefresh: () => void;
}

function Attachments({ ticket, onRefresh }: AttachmentProps) {
  const len = ticket?.attachments?.length || 0;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [canEdit] = useCanEditTicket(ticket?.id.toString());

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      uploadAttachment(file);
    }
  };

  const uploadAttachment = (file: File) => {
    if (ticket) {
      setIsUploading(true);
      AttachmentService.uploadAttachment(ticket?.id, file)
        .then(attachmentResponse => {
          console.log(
            attachmentResponse.message +
              ', new attachment id: ' +
              attachmentResponse.attachmentId.toString(),
          );
          onRefresh();
          setIsUploading(false);
        })
        .catch((err: Error) => {
          setIsUploading(false);
          console.log(err.message);
        });
    }
  };

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
          {len > 0 ? (
            ticket?.attachments?.map(attachment => {
              const createdDate =
                attachment.jiraCreated ||
                attachment.modified ||
                attachment.created;
              const created = new Date(Date.parse(createdDate));
              return (
                <FileItem
                  refresh={onRefresh}
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

        <Box
          sx={{
            right: 0,
            bottom: 0,
            marginTop: 5,
            fontSize: 12,
            marginBottom: 1,
          }}
        >
          <UnableToEditTicketTooltip canEdit={canEdit}>
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              color="secondary"
              disabled={isUploading || !canEdit}
              sx={{
                right: 0,
                bottom: 0,
                fontSize: 11,
                marginRight: 1,
                marginBottom: 1,
                width: 150,
                color: '#2f2f2f',
                position: 'absolute',
                '&:hover': {
                  color: '#2647aa',
                  backgroundColor: '#f0f6ff',
                },
                '& .MuiSvgIcon-root': {
                  marginRight: '5px',
                },
              }}
            >
              {isUploading ? (
                <>
                  <CircularProgress
                    sx={{
                      padding: 1,
                      marginLeft: -1,
                    }}
                  />
                  UPLOADING...
                </>
              ) : (
                <>ADD ATTACHMENT</>
              )}
            </IconButton>
          </UnableToEditTicketTooltip>
        </Box>
      </Box>
    </>
  );
}

export default Attachments;
