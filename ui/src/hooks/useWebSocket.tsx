import SockJs from 'sockjs-client';
import Stomp, { Frame, Message } from 'stompjs';
import useUserStore from '../stores/UserStore';
import { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import useWebsocketEventHandler from './useWebsocketEventHandler';
import TasksSnackbar from '../components/snackbar/TasksSnackbar';

export enum EntityType {
  Rebase = 'Rebase',
  ConflictReport = 'ConflictReport',
  Promotion = 'Promotion',
  Feedback = 'Feedback',
  Classification = 'Classification',
  BranchState = 'BranchState',
  Validation = 'Validation',
  BranchHead = 'BranchHead',
  AuthorChange = 'AuthorChange',
}

const message : StompMessage = {
  entityType: EntityType.Classification,
  project: 'AU',
  task: 'AU-92',
  event: 'success'
}
// using a hook, so we can create snackbars on different events
function useWebSocket() {
  const { enqueueSnackbar } = useSnackbar();
  const { handleClassificationEvent, handleValidationEvent } =
    useWebsocketEventHandler();
  enqueueSnackbar('test test mic check', {
    action: ((snackbarKey) => {
      return <TasksSnackbar message={message} snackbarKey={snackbarKey}/>
    })
    
  });
  let stompClient: Stomp.Client;
  const user = useUserStore();

  const stompConnectCallback = (frame: Frame | undefined): any => {
    const headers = frame?.headers as StompHeaders;
    const username = headers['user-name'];
    if (username !== null) {
      stompClient.subscribe(
        `/topic/user/${user?.login}/notifications`,
        subscriptionHandler,
        { id: `sca-subscription-id-${user?.login}` },
      );
    }
  };

  const stompConnect = () => {
    const sockJsProtocols = ['websocket'];
    const socketProvider = new SockJs(
      '/authoring-services/' + 'authoring-services-websocket',
      null,
      { transports: sockJsProtocols },
    );

    const stompyBoi: Stomp.Client = Stomp.over(socketProvider);
    stompyBoi.connect({}, stompConnectCallback, errorCallback);

    stompClient = stompyBoi;
  };
  const subscriptionHandler = (message: Message) => {
    const notification = JSON.parse(message.body) as StompMessage;
    switch (notification.entityType) {
      case EntityType.Classification:
        void handleClassificationEvent(notification);
        break;
      case EntityType.Validation:
        void handleValidationEvent(notification);
        break;
      default:
        break;
    }
  };

  const errorCallback = (frame: string | Frame): any => {
    console.log(frame);
    stompClient.disconnect(stompConnect);
    setTimeout(function () {
      stompConnect();
    }, 5000);
    console.log('STOMP: Reconnecting in 5 seconds');
  };

  useEffect(() => {
    stompConnect();
  }, []);
}

interface StompHeaders {
  'user-name': string;
}

export interface StompMessage {
  entityType: EntityType;
  project?: string;
  task?: string;
  event?: string;
}



export default useWebSocket;
