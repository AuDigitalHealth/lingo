import { IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack';
import {SnackbarKey} from 'notistack';

interface CloseSnackbarProps {
  snackbarKey: SnackbarKey
}
function CloseSnackbar({snackbarKey} : CloseSnackbarProps) {
  const { closeSnackbar } = useSnackbar();

  return (
    <>
      <Tooltip title="Close">
        <IconButton
          onClick={() => {
            closeSnackbar(snackbarKey);
          }}
          sx={{ color: 'white' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
}

export default CloseSnackbar;
