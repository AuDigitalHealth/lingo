import {
  Article,
  AttachEmail,
  AttachFile,
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
  Divider,
  Grid,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import AttachmentService from '../../../../api/AttachmentService';

interface FileItemProps {
  filename: string;
  created: string;
  thumbnail: string;
  id: number;
}

function FileItem({ id, filename, created, thumbnail }: FileItemProps) {
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

  const extension = filename.split('.').pop();
  let selectedIcon = iconMapping.default;
  if (extension) {
    selectedIcon = iconMapping[extension.toLocaleLowerCase()];
  }

  const downloadFile = (id: number) => {
    AttachmentService.downloadAttachment(id);
  };

  return (
    <>
      <Grid item xs={3} key={filename}>
        <Tooltip title={filename}>
          <Button
            onClick={() => {
              downloadFile(id);
            }}
            sx={{
              mt: 1,
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
              minWidth: 220,
              maxWidth: 220,
              justifyContent: 'space-between',
              overflow: 'hidden',
            }}
          >
            <Stack
              sx={{ height: 200, display: 'flex', justifyContent: 'center' }}
            >
              {thumbnail ? (
                <img
                  src={`/api/thumbnail/${thumbnail}`}
                  alt={`/api/thumbnail/${thumbnail}`}
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
              <Typography
                align="right"
                variant="caption"
                sx={{
                  mt: 1,
                  maxWidth: '200px',
                  display: 'block',
                  alignSelf: 'flex-end',
                }}
              >
                {created}
              </Typography>
            </Stack>
          </Button>
        </Tooltip>
      </Grid>
    </>
  );
}

export default FileItem;
