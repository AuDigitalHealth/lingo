import { CSSObject } from '@emotion/react';
import { Stack } from '@mui/material';
import { ReactNode } from 'react';

interface BaseModalBodyProps {
  children: ReactNode;
  sx?: CSSObject;
}
export default function BaseModalBody({ children, sx }: BaseModalBodyProps) {
  return (
    <Stack
      sx={{
        padding: '1em',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
    >
      {children}
    </Stack>
  );
}
