import { Stack, useTheme } from '@mui/material';
import { ReactNode } from 'react';

interface BaseModalFooterProps {
  startChildren: ReactNode;
  endChildren: ReactNode;
}

export default function BaseModalFooter({
  startChildren,
  endChildren,
}: BaseModalFooterProps) {
  const theme = useTheme();
  return (
    <Stack
      flexDirection="row"
      justifyContent="space-between"
      sx={{ padding: '1em', borderTop: `1px solid ${theme.palette.grey[200]}` }}
    >
      <div>{startChildren}</div>
      <div>{endChildren}</div>
    </Stack>
  );
}
