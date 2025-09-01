import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useState } from 'react';
import { Ticket } from '../../../types/tickets/ticket';
import AttachmentService from '../../../api/AttachmentService';
import MediaViewerModal from '../../tickets/individual/components/MediaViewerModal';
import { enqueueSnackbar } from 'notistack';

interface AttachmentsListProps {
  ticket?: Ticket;
}

interface DraggableAttachmentProps {
  attachmentId: number;
  filename: string;
}

function DraggableAttachment({
  attachmentId,
  filename,
}: DraggableAttachmentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const handleDownload = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await AttachmentService.downloadAttachmentAndSave(attachmentId);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  const handleCopyUrl = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const attachmentRef = `attachment://${attachmentId}`;
      await navigator.clipboard.writeText(attachmentRef);
      enqueueSnackbar('Attachment URL copied to clipboard!', {
        variant: 'success',
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback for older browsers or when clipboard API is not available
      try {
        const textArea = document.createElement('textarea');
        textArea.value = `attachment://${attachmentId}`;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        enqueueSnackbar('Attachment URL copied to clipboard!', {
          variant: 'success',
        });
      } catch (fallbackError) {
        enqueueSnackbar('Failed to copy URL to clipboard', {
          variant: 'error',
        });
      }
    }
  };

  const handlePreview = (event: React.MouseEvent) => {
    event.preventDefault();
    setPreviewModalOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewModalOpen(false);
  };

  const handleDragStart = (event: React.DragEvent) => {
    setIsDragging(true);

    const attachmentRef = `attachment://${attachmentId}`;

    event.dataTransfer.setData('text/plain', attachmentRef);
    event.dataTransfer.setData('text/uri-list', attachmentRef);

    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'internal-attachment',
        reference: attachmentRef,
        filename: filename,
        attachmentId: attachmentId,
      }),
    );

    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          py: 0.5,
          opacity: isDragging ? 0.5 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Link
            component="button"
            variant="body2"
            draggable={true}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handlePreview}
            sx={{
              textAlign: 'left',
              textDecoration: 'none',
              cursor: isDragging ? 'grabbing' : 'pointer',
              display: 'block',
              width: '100%',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              background: 'none',
              border: 'none',
              padding: 0,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {filename}
          </Link>
        </Box>

        <IconButton
          size="small"
          onClick={handleCopyUrl}
          sx={{
            ml: 1,
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
            },
          }}
          title="Copy attachment URL"
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          onClick={handleDownload}
          sx={{
            ml: 0.5,
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
            },
          }}
          title="Download file"
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Stack>

      {previewModalOpen && (
        <MediaViewerModal
          open={previewModalOpen}
          handleClose={handleClosePreview}
          fileId={attachmentId}
        />
      )}
    </Box>
  );
}

function AttachmentsList({ ticket }: AttachmentsListProps) {
  const attachments = ticket?.attachments || [];
  const attachmentCount = attachments.length;

  if (attachmentCount === 0) {
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="body2" color="text.secondary">
          No attachments
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      <Accordion defaultExpanded={false} disableGutters elevation={0}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            minHeight: 'auto',
            '&.Mui-expanded': {
              minHeight: 'auto',
            },
            '& .MuiAccordionSummary-content': {
              margin: '8px 0',
              '&.Mui-expanded': {
                margin: '8px 0',
              },
            },
            padding: 0,
          }}
        >
          <Typography variant="subtitle2">
            Attachments ({attachmentCount})
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0, paddingLeft: 1 }}>
          {attachments.map(attachment => (
            <DraggableAttachment
              key={attachment.id}
              attachmentId={attachment.id}
              filename={attachment.filename}
            />
          ))}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            Click to preview • Drag URLs to form fields • Copy icon copies URL
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default AttachmentsList;
