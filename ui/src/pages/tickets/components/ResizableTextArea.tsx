import { TextareaAutosize } from '@mui/material';
import { styled, useTheme, Theme } from '@mui/material/styles';

interface ResizableTextAreaProps {
  defaultValue?: string;
}
export default function ResizableTextArea({defaultValue} : ResizableTextAreaProps) {
  const theme = useTheme();

  const StyledTextarea = styled(TextareaAutosize)(
    () => `
    width: 100%;
    font-family: IBM Plex Sans, sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    padding: 12px;
    border-radius: 12px 12px 0 12px;
    color: ${theme.palette.mode === 'dark' ? theme.palette.grey[300] : theme.palette.grey[900]};
    background: ${theme.palette.mode === 'dark' ? theme.palette.grey[900] : '#fff'};
    border: 1px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[200]};
    box-shadow: 0px 2px 2px ${theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50]};

    &:hover {
      border-color: ${theme.palette.primary[400]};
    }

    &:focus {
      border-color: ${theme.palette.primary[400]};
      box-shadow: 0 0 0 3px ${theme.palette.mode === 'dark' ? theme.palette.primary[500] : theme.palette.primary[200]};
    }

    // firefox
    &:focus-visible {
      outline: 0;
    }
  `,
  );

  return <StyledTextarea aria-label="empty textarea" placeholder="Add a description.." defaultValue={defaultValue}/>;
}
