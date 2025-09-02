import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, IconButton, Modal, Stack } from '@mui/material';
import { Close, ZoomIn, ZoomOut } from '@mui/icons-material';
import AttachmentService from '../../../../api/AttachmentService';
import { Typography } from '@mui/material';

interface MediaViewerModalProps {
  open: boolean;
  handleClose: () => void;
  fileId: number;
}
const MediaViewerModal = ({
  open,
  handleClose,
  fileId,
}: MediaViewerModalProps) => {
  const [scale, setScale] = useState(1);
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);
  const [fileName, setFileName] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);

  const [naturalDimensions, setNaturalDimensions] = useState({
    width: 0,
    height: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setNaturalDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
      calculateInitialScale();
    }
  };

  useEffect(() => {
    const handleResize = () => {
      calculateInitialScale();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [naturalDimensions]);

  const calculateInitialScale = () => {
    if (
      containerRef.current &&
      naturalDimensions.width &&
      naturalDimensions.height
    ) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight - 100; // Account for header

      const widthRatio = containerWidth / naturalDimensions.width;
      const heightRatio = containerHeight / naturalDimensions.height;

      // Use the smaller ratio to ensure image fits both dimensions
      const initialScale = Math.min(widthRatio, heightRatio, 1);
      setScale(initialScale);
    }
  };

  // Determine file type from URL
  const fileType = useMemo(() => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    return {
      isPdf: extension === 'pdf',
      isImage:
        extension !== undefined &&
        ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension),
    };
  }, [fileName]);

  useEffect(() => {
    if (open && fileId) {
      void loadFile();
    }
    return () => {
      // Cleanup URL when component unmounts or modal closes
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
    // eslint-disable-next-line
  }, [open, fileId]);

  const loadFile = async () => {
    try {
      setIsLoading(true);
      const result = await AttachmentService.downloadAttachment(fileId);
      if (result) {
        const { blob, actualFileName } = result;
        const url = URL.createObjectURL(blob);
        setFileUrl(url);
        setFileName(actualFileName);
      }
    } catch (error) {
      console.error('Error loading file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.1));
  };

  const getImageStyle = () => {
    if (!naturalDimensions.width || !naturalDimensions.height) return {};

    const scaledWidth = naturalDimensions.width * scale;
    const scaledHeight = naturalDimensions.height * scale;

    return {
      width: `${scaledWidth}px`,
      height: `${scaledHeight}px`,
      transition: 'width 0.3s ease, height 0.3s ease',
    };
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="media-viewer-modal"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      disableEnforceFocus
    >
      <Card
        sx={{
          position: 'relative',
          width: '90vw',
          height: '90vh',
          maxWidth: '1200px',
          maxHeight: '800px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Fixed Header */}
        <Stack
          direction="row"
          sx={{
            padding: '1rem',
            backgroundColor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            position: 'sticky',
            top: 0,
            zIndex: 2,
          }}
        >
          {fileType.isImage && (
            <>
              <IconButton
                onClick={zoomOut}
                disabled={scale <= 0.1}
                sx={{ color: 'text.secondary' }}
              >
                <ZoomOut />
              </IconButton>
              <IconButton
                onClick={zoomIn}
                disabled={scale >= 3}
                sx={{ color: 'text.secondary' }}
              >
                <ZoomIn />
              </IconButton>
            </>
          )}
          <IconButton onClick={handleClose} sx={{ marginLeft: 'auto' }}>
            <Close />
          </IconButton>
        </Stack>

        {/* Scrollable Content Area */}
        <Box
          ref={containerRef}
          sx={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          {isLoading ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography>Loading...</Typography>
            </Box>
          ) : fileType.isPdf && fileUrl ? (
            <iframe
              src={`${fileUrl}`}
              title="PDF Viewer"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                minHeight: '500px',
              }}
            />
          ) : fileType.isImage && fileUrl ? (
            <img
              ref={imageRef}
              src={fileUrl}
              alt={fileName}
              onLoad={handleImageLoad}
              style={{
                ...getImageStyle(),
                objectFit: 'contain',
                cursor: scale < 3 ? 'zoom-in' : 'zoom-out',
              }}
              onClick={scale < 3 ? zoomIn : zoomOut}
            />
          ) : (
            <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
              <Typography>Unsupported file type: {fileName}</Typography>
            </Box>
          )}
        </Box>
      </Card>
    </Modal>
  );
};

export default MediaViewerModal;
