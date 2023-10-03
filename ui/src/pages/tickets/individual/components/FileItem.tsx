import { Article, AttachEmail, AttachFile, FolderZip, Html, Panorama, PictureAsPdf, Slideshow, TableRows, TextSnippet, VideoFile } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import React from 'react';

interface FileItemProps {
  filename: string;
  id: number  
}

function FileItem({ filename }: FileItemProps) {

  const iconMapping: Record<string, React.ReactNode>= {
    pdf: <PictureAsPdf/>,
    jpg: <Panorama />,
    jfif: <Panorama />,
    jpeg: <Panorama />,
    png: <Panorama />,
    webp: <Panorama />,
    avif: <Panorama />,
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
  return (
    <>
    <Box sx={{
      mt: 1,
      border: 1,
      padding: 1,
      borderStyle: 'dotted',
      borderColor: '#eaeaea',
      textAlign: 'center',
      color: '#343434'
    }}>
      {React.cloneElement(selectedIcon as React.ReactElement, {
        sx: { minHeight: '50px', minWidth: '50px' }, // Add this style to make the icon bigger
      })}
      <Typography variant="caption" sx={{display: 'block', maxWidth: '120px'}}>
      { filename }
      </Typography>
    </Box>
    </>
  );
}

export default FileItem;
