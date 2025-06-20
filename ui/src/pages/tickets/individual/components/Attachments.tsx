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

import UnableToEditTicketTooltip from '../../components/UnableToEditTicketTooltip.tsx';
import { useCanEditTicket } from '../../../../hooks/api/tickets/useCanEditTicket.tsx';
import { useQueryClient } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';

interface AttachmentProps {
  ticket?: Ticket;
}

function Attachments({ ticket }: AttachmentProps) {
  const queryClient = useQueryClient();
  const len = ticket?.attachments?.length || 0;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { canEdit } = useCanEditTicket(ticket);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files) {
      setIsUploading(true);
      const files = Array.from(event.target.files);

      for (const file of files) {
        try {
          await uploadAttachment(ticket!.id, file);
        } catch (error) {
          console.error(`Error uploading file: ${file.name}`, error);
          enqueueSnackbar(`Error uploading file: ${file.name}`, {
            variant: 'error',
          });
        }
      }
      void queryClient.invalidateQueries({
        queryKey: ['ticket', ticket!.ticketNumber.toString()],
      });
      setIsUploading(false);
    }
  };

  const uploadAttachment = async (ticketId: number, file: File) => {
    if (ticketId) {
      const attachmentResponse = await AttachmentService.uploadAttachment(
        ticketId,
        file,
      );
      return attachmentResponse;
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
                  ticket={ticket}
                  key={attachment.id}
                  filename={attachment.filename}
                  id={attachment.id}
                  created={created.toLocaleString()}
                  thumbnail={attachment.thumbnailLocation}
                />
              );
            })
          ) : (
            <Box>-- No attachments --</Box>
          )}
        </Grid>
        <input
          data-testid={`ticket-attachment-upload-${ticket?.id}`}
          type="file"
          ref={fileInputRef}
          multiple
          onChange={void handleFileSelect}
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
              data-testid="ticket-add-attachment-button"
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
