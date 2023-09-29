import { Stack, Typography, useTheme } from '@mui/material';

interface BaseModalHeaderProps {
  title: string;
}
export default function BaseModalHeader({ title }: BaseModalHeaderProps) {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      sx={{
        width: '100%',
        padding: '1em',
        borderBottom: `1px solid ${theme.palette.grey[200]}`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="h5">{title}</Typography>
    </Stack>
  );
}
