import { IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack';

function CloseSnackbar() {
  const { closeSnackbar } = useSnackbar();

  return (
    <>
      <Tooltip title="Close">
        <IconButton
          onClick={() => {
            closeSnackbar();
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
