import { CircularProgress, Container, Typography } from '@mui/material';

interface LoadingProps {
  message?: string;
}
function Loading({ message }: LoadingProps) {
  return (
    <Container
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '1em',
      }}
    >
      <CircularProgress />
      <Typography variant="body1">{message}</Typography>
    </Container>
  );
}

export default Loading;
