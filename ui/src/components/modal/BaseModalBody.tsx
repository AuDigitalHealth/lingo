import { Stack } from '@mui/material';
import { ReactNode } from 'react';

interface BaseModalBodyProps {
  children: ReactNode;
}
export default function BaseModalBody({ children }: BaseModalBodyProps) {
  return (
    <Stack
      sx={{ padding: '1em', alignItems: 'center', justifyContent: 'center' }}
    >
      {children}
    </Stack>
  );
}
