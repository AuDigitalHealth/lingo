import { Box, CircularProgress } from '@mui/material';

function LoadingOverlay() {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'rgba(250, 250, 251, 0.5)',
        position: 'absolute',
        top: 0,
        bottom: 0,
        alignItems: 'center',
        zIndex: 2,
      }}
    >
      <CircularProgress />
    </Box>
  );
}

export default LoadingOverlay;
