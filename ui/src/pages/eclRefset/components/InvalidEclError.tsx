import { Alert } from '@mui/material';

export default function InvalidEclError() {
  return (
    <Alert
      severity="error"
      sx={{
        color: 'rgb(95, 33, 32)',
        alignItems: 'center',
        width: '100%',
        '& .MuiSvgIcon-root': {
          fontSize: '22px',
        },
        '& .MuiAlert-message': {
          mt: 0,
        },
      }}
    >
      Error: Check ECL expression
    </Alert>
  );
}
