import {
  Article,
  AttachEmail,
  AttachFile,
  Delete,
  FolderZip,
  Html,
  Image,
  PictureAsPdf,
  Slideshow,
  TableRows,
  TextSnippet,
} from '@mui/icons-material';
import {
  Button,
  IconButton,
  Divider,
  Grid,
  Stack,
  Tooltip,
  Typography,
  Box,
} from '@mui/material';
import React, { useState } from 'react';
import AttachmentService from '../../../../api/AttachmentService';
import ConfirmationModal from '../../../../themes/overrides/ConfirmationModal';
import { useQueryClient } from '@tanstack/react-query';

interface FileItemProps {
  ticketId: string | undefined;
  filename: string;
  created: string;
  thumbnail: string;
  id: number;
  refresh: () => void;
}

function FileItem({
  ticketId,
  id,
  filename,
  created,
  thumbnail,
  refresh,
}: FileItemProps) {
  const iconMapping: Record<string, React.ReactNode> = {
    pdf: <PictureAsPdf />,
    jpg: <Image />,
    jfif: <Image />,
    jpeg: <Image />,
    png: <Image />,
    webp: <Image />,
    avif: <Image />,
    doc: <Article />,
    docx: <Article />,
    html: <Html />,
    htm: <Html />,
    msg: <AttachEmail />,
    pptx: <Slideshow />,
    xls: <TableRows />,
    xlsx: <TableRows />,
    sql: <TextSnippet />,
    zip: <FolderZip />,
    default: <AttachFile />,
  };

  const queryClient = useQueryClient();
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalContent, setDeleteModalContent] = useState('');

  const deleteAttachment = () => {
    if (id) {
      AttachmentService.deleteAttachment(id)
        .then(() => {
          void queryClient.invalidateQueries(['ticket', ticketId]);
          refresh();
          setDisabled(false);
        })
        .catch((err: Error) => {
          console.log(err.message);
        });
    }
  };

  const extension = filename.split('.').pop();
  let selectedIcon = iconMapping.default;
  if (extension) {
    selectedIcon = iconMapping[extension.toLocaleLowerCase()];
    if (!selectedIcon) {
      selectedIcon = iconMapping.default;
    }
  }

  const downloadFile = (id: number) => {
    AttachmentService.downloadAttachment(id);
  };

  return (
    <>
      <Grid
        data-cy={`ticket-attachment-${id}`}
        item
        xs={2}
        key={filename}
        onMouseEnter={() => {
          setShowDeleteButton(true);
        }}
        onMouseLeave={() => {
          setShowDeleteButton(false);
        }}
        sx={{
          mt: 1,
          margin: 1,
          border: 1,
          padding: 1,
          display: 'flex',
          flexDirection: 'column',
          borderStyle: 'dotted',
          borderColor: '#bababa',
          textAlign: 'center',
          color: '#646464',
          width: 300,
          height: '100%',
          minWidth: 260,
          maxWidth: 260,
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        <Tooltip title={filename} placement="top">
          <Button
            component="span"
            onClick={() => {
              downloadFile(id);
            }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'center',
              color: '#646464',
            }}
          >
            <Stack
              sx={{ height: 200, display: 'flex', justifyContent: 'center' }}
            >
              {thumbnail ? (
                <img
                  src={`/api/attachments/thumbnail/${id}`}
                  alt={`/api/attachments/thumbnail/${id}`}
                  style={{ maxHeight: '200px', maxWidth: '200px' }}
                />
              ) : (
                React.cloneElement(selectedIcon as React.ReactElement, {
                  key: extension?.toLocaleLowerCase(),
                  sx: { height: '120px', width: '120px' }, // Add this style to make the icon bigger
                })
              )}
            </Stack>
            <Divider sx={{ mb: 2, width: 200 }} />
            <Stack>
              <Typography
                alignSelf="center"
                variant="caption"
                sx={{
                  color: '#2947ab',
                  mt: 1,
                  fontSize: '1em',
                  flex: 1,
                  minWidth: 0,
                  width: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {filename}
              </Typography>
            </Stack>
          </Button>
        </Tooltip>

        <Box sx={{ position: 'relative' }}>
          {showDeleteButton && (
            <>
              <Tooltip title="Delete attachment" placement="bottom">
                <IconButton
                  data-cy={`ticket-attachment-${id}-delete`}
                  onClick={e => {
                    setDeleteModalContent(
                      `Do you want to delete attachment '${filename}'?`,
                    );
                    setDeleteModalOpen(true);
                    e.stopPropagation();
                  }}
                  sx={{
                    mt: 1,
                    position: 'absolute',
                    top: -10,
                    left: 0,
                    '&:hover': {
                      color: '#2647aa',
                      backgroundColor: '#f0f6ff',
                    },
                  }}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
              <ConfirmationModal
                open={deleteModalOpen}
                content={deleteModalContent}
                handleClose={() => {
                  setDeleteModalOpen(false);
                  setShowDeleteButton(false);
                }}
                title={'Confirm Delete Attachment'}
                disabled={disabled}
                action={'Delete'}
                handleAction={deleteAttachment}
              />
            </>
          )}
          <Typography
            align="right"
            variant="caption"
            sx={{
              mt: 1,
              maxWidth: '200px',
              display: 'block',
              alignSelf: 'flex-end',
              textTransform: 'uppercase',
            }}
          >
            {created}
          </Typography>
        </Box>
      </Grid>
    </>
  );
}

export default FileItem;
