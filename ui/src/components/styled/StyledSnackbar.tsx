import { styled } from '@mui/material';
import { MaterialDesignContent } from 'notistack';

export const StyledSnackbar = styled(MaterialDesignContent)(() => ({
  '&.notistack-MuiContent-success': {
    zIndex: '100000',
  },
  '&.notistack-MuiContent-error': {
    zIndex: '100000',
  },
}));
