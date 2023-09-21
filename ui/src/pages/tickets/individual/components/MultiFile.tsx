// material-ui
import { styled } from '@mui/material/styles';
import { Box, Stack } from '@mui/material';

// third-party
import { useDropzone } from 'react-dropzone';

// project import
import RejectionFiles from './RejectionFiles';
import PlaceholderContent from './PlaceholderContent';
import FilesPreview from './FilesPreview';

// types
import {
  CustomFile,
  DropzopType,
  UploadMultiFileProps,
} from '../../../../types/tickets/dropzone';

const DropzoneWrapper = styled('div')(({ theme }) => ({
  outline: 'none',
  padding: theme.spacing(5, 1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  border: `1px dashed ${theme.palette.secondary.main}`,
  '&:hover': { opacity: 0.72, cursor: 'pointer' },
}));

// ==============================|| UPLOAD - MULTIPLE FILE ||============================== //

const MultiFileUpload = ({
  error,
  showList = false,
  files,
  type,
  sx,
  onFileDrop
}: UploadMultiFileProps) => {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections,
  } = useDropzone({
    multiple: true,
    onDrop: (acceptedFiles: CustomFile[]) => {
      onFileDrop(acceptedFiles[acceptedFiles.length - 1]);
    },
  });

  // implement me
  const onRemove = (file: File | string) => {};

  return (
    <>
      <Box
        sx={{
          width: '100%',
          ...(type === DropzopType.standard && {
            width: 'auto',
            display: 'flex',
            alignItems: 'center',
          }),
          ...sx,
        }}
      >
        <Stack {...(type === DropzopType.standard && { alignItems: 'center' })}>
          <DropzoneWrapper
            {...getRootProps()}
            sx={{
              ...(type === DropzopType.standard && {
                p: 0,
                m: 1,
                width: 64,
                height: 64,
              }),
              ...(isDragActive && { opacity: 0.72 }),
              ...((isDragReject || error) && {
                color: 'error.main',
                borderColor: 'error.light',
                bgcolor: 'error.lighter',
              }),
            }}
          >
            <input {...getInputProps()} />
            <PlaceholderContent type={type} />
          </DropzoneWrapper>
        </Stack>
        {/* 
            You will need to look into fileRejections - they are set through react-dropzone
            It might be better not to show something for rejected files - and just add an error code to formik,
            and not display the failed files in the list of files? IDK, up to you
        */}
        {fileRejections.length > 0 && (
          <RejectionFiles fileRejections={fileRejections} />
        )}
        {files && files.length > 0 && (
          <FilesPreview
            files={files}
            showList={showList}
            onRemove={onRemove}
            type={type}
          />
        )}
      </Box>
    </>
  );
};

export default MultiFileUpload;
