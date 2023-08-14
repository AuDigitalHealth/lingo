import { CircularProgress, Container } from '@mui/material';

function Loading() {
  return (
    <Container
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <CircularProgress />
    </Container>
  );
}

export default Loading;
