import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Card, IconButton, Modal, Stack, Typography } from '@mui/material';
import { Close, ZoomIn, ZoomOut } from '@mui/icons-material';
import AttachmentService from '../../../../api/AttachmentService';

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
  const [isFullscreen] = useState(false);

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

  const calculateInitialScale = useCallback(() => {
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
  }, [naturalDimensions.width, naturalDimensions.height]);

  useEffect(() => {
    const handleResize = () => {
      calculateInitialScale();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateInitialScale, naturalDimensions]);

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

  const modalSize = isFullscreen
    ? { width: '100vw', height: '100vh', maxWidth: 'none', maxHeight: 'none' }
    : { width: '90vw', height: '90vh', maxWidth: '1200px', maxHeight: '800px' };

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
          width: modalSize.width,
          height: modalSize.height,
          maxWidth: modalSize.maxWidth,
          maxHeight: modalSize.maxHeight,
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
            alignItems: fileType.isImage ? 'center' : 'stretch',
            justifyContent: fileType.isImage ? 'center' : 'stretch',
            padding: fileType.isPdf ? 0 : '1rem',
          }}
        >
          {isLoading ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Typography>Loading...</Typography>
            </Box>
          ) : (
            (() => {
              let content: React.ReactNode;

              if (fileType.isPdf && fileUrl) {
                content = (
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
                );
              } else if (fileType.isImage && fileUrl) {
                return (
                  <button
                    type="button"
                    onClick={scale < 3 ? zoomIn : zoomOut}
                    aria-label={`Preview image ${fileName}. ${scale < 3 ? 'Press to zoom in' : 'Press to zoom out'}`}
                    style={{
                      // reset button styles to make it look like plain content
                      padding: 0,
                      margin: 0,
                      border: 'none',
                      background: 'transparent',
                      lineHeight: 0,
                      cursor: scale < 3 ? 'zoom-in' : 'zoom-out',
                    }}
                  >
                    <img
                      ref={imageRef}
                      src={fileUrl}
                      alt={fileName}
                      onLoad={handleImageLoad}
                      style={{
                        ...getImageStyle(),
                        objectFit: 'contain',
                        // cursor handled on the button for accessibility
                      }}
                    />
                  </button>
                );
              } else {
                content = (
                  <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                    <Typography>Unsupported file type: {fileName}</Typography>
                  </Box>
                );
              }

              return content;
            })()
          )}
        </Box>
      </Card>
    </Modal>
  );
};

export default MediaViewerModal;
