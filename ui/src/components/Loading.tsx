import { CircularProgress, Container, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

interface LoadingProps {
  message?: string;
}
function Loading({ message }: LoadingProps) {
  const [animatedString, setAnimatedString] = useState(message || '');
  const duration = 1000; // 1000 milliseconds (1 second)

  useEffect(() => {
    let dotCount = 0;
    const interval = setInterval(() => {
      const dots = '.'.repeat(dotCount);
      setAnimatedString(`${message}${dots}`);

      dotCount++;

      if (dotCount > 3) {
        dotCount = 0;
      }
    }, duration / 3);

    return () => clearInterval(interval); // Cleanup the interval on component unmount
  }, [message, duration]);
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
      <Typography variant="body1">{message && animatedString}</Typography>
    </Container>
  );
}

export default Loading;
