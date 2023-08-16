import { IconButton, Tooltip } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack';
import { Link } from 'react-router-dom';

interface SnackbarLinkProps {
  taskId: string;
}
function SnackbarLink({ taskId }: SnackbarLinkProps) {
  const { closeSnackbar } = useSnackbar();

  return (
    <>
      <Link to={`/dashboard/tasks/edit/${taskId}`}>
        <Tooltip title="View Task">
          <IconButton
            onClick={() => {
              closeSnackbar();
            }}
            sx={{ color: 'white' }}
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Link>
    </>
  );
}

export default SnackbarLink;
