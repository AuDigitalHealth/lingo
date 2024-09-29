import SockJs from 'sockjs-client';
import Stomp from 'stompjs';
import useUserStore from '../stores/UserStore';
import { useCallback, useEffect, useRef } from 'react';
import useWebsocketEventHandler from './useWebsocketEventHandler';

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

const maxReconnectDelay = 45 * 1000;

function useWebSocket() {
  const { handleClassificationEvent, handleValidationEvent } =
    useWebsocketEventHandler();
  const stompClientRef = useRef<Stomp.Client | null>(null);
  const user = useUserStore();
  const reconnectAttemptsRef = useRef(0);
  const initialReconnectDelay = 1000;

  const stompConnectCallback = useCallback(
    (frame: Stomp.Frame | undefined): void => {
      const headers = frame?.headers as StompHeaders;
      const username = headers['user-name'];
      if (username !== null && stompClientRef.current) {
        stompClientRef.current.subscribe(
          `/topic/user/${user?.login}/notifications`,
          subscriptionHandler,
          { id: `sca-subscription-id-${user?.login}` },
        );
      }
      reconnectAttemptsRef.current = 0;
    },
    // eslint-disable-next-line
    [user?.login],
  );

  const subscriptionHandler = useCallback(
    (message: Stomp.Message) => {
      const notification = JSON.parse(message.body) as StompMessage;
      switch (notification.entityType) {
        case EntityType.Classification:
          void handleClassificationEvent(notification);
          break;
        case EntityType.Validation:
        case EntityType.Promotion:
          void handleValidationEvent(notification);
          break;
        default:
          break;
      }
    },
    [handleClassificationEvent, handleValidationEvent],
  );

  const errorCallback = useCallback((error: Stomp.Frame | string): void => {
    console.log(error);
    safeDeactivate();
    reconnectWithBackoff();
    // eslint-disable-next-line
  }, []);

  const reconnectWithBackoff = useCallback(() => {
    let delay = 1000;
    if (reconnectAttemptsRef.current > 5) {
      delay = maxReconnectDelay;
    } else {
      delay = initialReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
    }
    setTimeout(() => {
      reconnectAttemptsRef.current++;
      stompConnect();
    }, delay);
    // eslint-disable-next-line
  }, []);

  const safeDeactivate = useCallback(() => {
    if (stompClientRef.current) {
      if (stompClientRef.current.connected) {
        stompClientRef.current.disconnect(() => {
          return undefined;
        });
      } else {
        // If not connected, just remove the reference
        stompClientRef.current = null;
      }
    }
  }, []);

  const stompConnect = useCallback(() => {
    // Check if already connected or connecting
    if (stompClientRef.current && stompClientRef.current.connected) {
      return;
    }
    safeDeactivate();

    const sockJsProtocols = ['websocket'];
    const socketProvider = new SockJs(
      '/authoring-services/authoring-services-websocket',
      null,
      { transports: sockJsProtocols },
    );

    const stompyBoi = Stomp.over(socketProvider);
    stompyBoi.connect({}, stompConnectCallback, errorCallback);

    stompClientRef.current = stompyBoi;
    // eslint-disable-next-line
  }, [stompConnectCallback, errorCallback]);

  useEffect(() => {
    stompConnect();
    return () => {
      safeDeactivate();
    };
  }, [stompConnect, safeDeactivate]);

  return { stompClient: stompClientRef.current };
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
