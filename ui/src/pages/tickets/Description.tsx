import { Grid, InputLabel, Typography, useTheme } from '@mui/material';
import { ThemeMode } from '../../types/config';
import MainCard from '../../components/MainCard';
import { Stack, fontWeight } from '@mui/system';
import { RichTextReadOnly } from 'mui-tiptap';
import useExtensions from './components/individual/comments/useExtensions';

interface DescriptionProps {
  description?: string;
}
export default function Description({ description }: DescriptionProps) {
  const theme = useTheme();
  const extensions = useExtensions();

  return (
    <Stack direction="column" width="100%" marginTop="0.5em">
      <InputLabel sx={{ mt: 0.5 }}>Description:</InputLabel>
      <MainCard
        content={false}
        sx={{
          width: '100%',
          padding: '1rem',
          background:
            theme.palette.mode === ThemeMode.DARK
              ? theme.palette.grey[100]
              : theme.palette.grey[50],
          p: 1.5,
          mt: 1.25,
        }}
      >
        <RichTextReadOnly content={description} extensions={extensions} />
      </MainCard>
    </Stack>
  );
}
