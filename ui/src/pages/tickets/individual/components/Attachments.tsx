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
import { useRef, useState, useEffect } from 'react';
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
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFileOverDropZone, setIsFileOverDropZone] = useState(false);
  const { canEdit } = useCanEditTicket(ticket);

  useEffect(() => {
    if (!canEdit) return;

    const handleWindowDragEnter = (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleWindowDragOver = (event: DragEvent) => {
      event.preventDefault();
    };

    const handleWindowDrop = (event: DragEvent) => {
      // If the drop didn't happen on our dropzone, prevent default behavior
      if (
        event.target !== dropZoneRef.current &&
        !dropZoneRef.current?.contains(event.target as Node)
      ) {
        event.preventDefault();
        setIsDragging(false);
      }
    };

    const handleWindowDragLeave = (event: DragEvent) => {
      // Only consider it a leave if we're leaving the window
      if (!event.relatedTarget) {
        setIsDragging(false);
      }
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    window.addEventListener('dragleave', handleWindowDragLeave);

    // Clean up
    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
      window.removeEventListener('dragleave', handleWindowDragLeave);
    };
  }, [canEdit]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files) {
      await processFiles(Array.from(event.target.files));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processFiles = async (files: File[]) => {
    if (!canEdit || !ticket?.id) return;

    setIsUploading(true);

    for (const file of files) {
      try {
        await uploadAttachment(ticket.id, file);
      } catch (error) {
        console.error(`Error uploading file: ${file.name}`, error);
        enqueueSnackbar(`Error uploading file: ${file.name}`, {
          variant: 'error',
        });
      }
    }

    void queryClient.invalidateQueries({
      queryKey: ['ticket', ticket.ticketNumber.toString()],
    });
    setIsUploading(false);
    setIsDragging(false);
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

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isUploading && canEdit) {
      setIsFileOverDropZone(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsFileOverDropZone(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    setIsFileOverDropZone(false);

    if (!isUploading && canEdit && event.dataTransfer.files.length > 0) {
      void processFiles(Array.from(event.dataTransfer.files));
    }
  };

  const showDropHighlight = isDragging || isFileOverDropZone;

  return (
    <>
      <InputLabel sx={{ mt: 1 }}>Attachments:</InputLabel>
      <Box
        ref={dropZoneRef}
        sx={{
          mt: 1,
          border: 1,
          borderStyle: 'dashed',
          borderColor: showDropHighlight ? '#2647aa' : '#dadada',
          backgroundColor: showDropHighlight ? '#f0f6ff' : 'transparent',
          position: 'relative',
          transition: 'all 0.2s ease',
          zIndex: 1,
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="attachment-drop-zone"
      >
        {isDragging && canEdit && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(240, 246, 255, 0.8)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          >
            <Box sx={{ fontSize: 18, fontWeight: 'bold', color: '#2647aa' }}>
              Drop files to upload
            </Box>
          </Box>
        )}
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
          data-testid={`ticket-attachment-upload-${ticket?.id}`}
          type="file"
          ref={fileInputRef}
          multiple
          onChange={e => {
            void handleFileSelect(e);
          }}
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
