import { useState, useMemo, useEffect, useRef } from 'react';
import { Modal, IconButton, Card, Stack } from '@mui/material';
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
    if (containerRef.current && imageRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const maxWidth = Math.min(containerWidth, window.innerWidth * 0.8);
      const maxHeight = Math.min(containerHeight, window.innerHeight * 0.8);

      const widthRatio = maxWidth / imageRef.current.naturalWidth;
      const heightRatio = maxHeight / imageRef.current.naturalHeight;

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
        ['jpg', 'jpeg', 'png', 'gif'].includes(extension),
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
      transition: 'transform 1s ease-in-out',
    };
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="media-viewer-modal"
      className="flex items-center justify-center"
    >
      <Card
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          minWidth: '350px',
          overflow: 'auto',
          maxHeight: '95%',
        }}
      >
        <Stack sx={{ margin: '1rem', flexDirection: 'row' }}>
          {fileType.isImage && (
            <>
              <IconButton
                onClick={zoomOut}
                disabled={scale <= 0.1}
                className="text-gray-600 hover:text-gray-800"
              >
                <ZoomOut />
              </IconButton>
              <IconButton
                onClick={zoomIn}
                disabled={scale >= 3}
                className="text-gray-600 hover:text-gray-800"
              >
                <ZoomIn />
              </IconButton>
            </>
          )}
          <IconButton onClick={handleClose} sx={{ marginLeft: 'auto' }}>
            <Close />
          </IconButton>
        </Stack>

        <div
          ref={containerRef}
          className="overflow-auto h-[calc(90vh-100px)] flex items-center justify-center"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              Loading...
            </div>
          ) : fileType.isPdf && fileUrl ? (
            <Stack sx={{ width: '80vw', height: '80vh' }}>
              <iframe
                src={`${fileUrl}`}
                title="PDF Viewer"
                className="w-full h-full border-none"
                style={{ width: '100%', height: '100%' }}
              />
            </Stack>
          ) : fileType.isImage && fileUrl ? (
            <img
              ref={imageRef}
              src={fileUrl}
              alt={fileName}
              onLoad={handleImageLoad}
              style={getImageStyle()}
              className="object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Unsupported file type
            </div>
          )}
        </div>
      </Card>
    </Modal>
  );
};

export default MediaViewerModal;
