/* eslint-disable */
import { Button, SxProps } from '@mui/material';
import useTaskById from '../../hooks/useTaskById';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ArchiveIcon from '@mui/icons-material/Archive';
import axios from 'axios';
import SockJs from 'sockjs-client';
import Stomp from 'stompjs';

import useUserStore from '../../stores/UserStore';

const customSx: SxProps = {
  justifyContent: 'flex-start',
};
function TaskDetailsActions() {
  const task = useTaskById();
  let stompClient: Stomp.Client;
  let user = useUserStore();
  console.log('rendering task details actions');

  const handleStartClassification = async () => {
    stompConnect();
    const res = await axios.get(
      '/authoring-services/projects?lightweight=false',
    );
    console.log(res);
  };

  const stompSuccessCallback = (frame: any) => {
    let username = frame.headers['user-name'];
    console.log(stompClient);
    if (username !== null) {
      stompClient.subscribe(
        '/topic/user/' + user.login + '/notifications',
        subscriptionHandler,
        { id: 'sca-subscription-id-' + user.login },
      );
    }
  };

  const stompConnect = () => {
    let sockJsProtocols = ['websocket'];
    var socketProvider = new SockJs(
      '/authoring-services/' + 'authoring-services-websocket',
      null,
      { transports: sockJsProtocols },
    );

    const stompyBoi: Stomp.Client = Stomp.over(socketProvider);

    stompyBoi.connect({}, stompSuccessCallback, stompFailureCallback);

    stompClient = stompyBoi;
  };
  const subscriptionHandler = (message: any) => {
    console.log(message);
    console.log('wft');
  };

  const stompFailureCallback = () => {
    stompClient.disconnect(stompConnect);
    setTimeout(function () {
      stompConnect();
    }, 5000);
    console.log('STOMP: Reconnecting in 5 seconds');
  };

  return (
    <div
      style={{
        marginTop: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '.5em',
        padding: '1em',
      }}
    >
      <Button
        variant="contained"
        color="secondary"
        startIcon={<SettingsIcon />}
        sx={customSx}
      >
        Edit Task Details
      </Button>
      <Button
        variant="contained"
        color="success"
        startIcon={<NotificationsIcon />}
        sx={customSx}
        onClick={handleStartClassification}
      >
        Classify
      </Button>
      <Button variant="contained" startIcon={<SchoolIcon />} sx={customSx}>
        Validate Without MRCM
      </Button>
      <Button
        variant="contained"
        startIcon={<QuestionAnswerIcon />}
        sx={customSx}
      >
        Submit For Review
      </Button>
      <Button variant="contained" startIcon={<CallMergeIcon />} sx={customSx}>
        Promote This Task to the Project
      </Button>
      <Button variant="contained" startIcon={<ArchiveIcon />} sx={customSx}>
        Begin Promotion Automation
      </Button>
    </div>
  );
}

export default TaskDetailsActions;
