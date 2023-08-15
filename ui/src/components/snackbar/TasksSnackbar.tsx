import { StompMessage } from '../../hooks/useWebSocket';
import CloseSnackbar from './CloseSnackBar';
import SnackbarLink from './SnackbarLink';
import {SnackbarKey} from 'notistack';

interface TasksSnackbarProps {
  message: StompMessage;
  snackbarKey: SnackbarKey
}

function TasksSnackbar({ message, snackbarKey }: TasksSnackbarProps) {
  return (
    <>
      {message.task ? <SnackbarLink taskId={message.task} /> : <></>}
      <CloseSnackbar snackbarKey={snackbarKey}/>
    </>
  );
}

export default TasksSnackbar;
