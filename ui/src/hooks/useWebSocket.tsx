import SockJs from 'sockjs-client';
import Stomp from 'stompjs';
import useUserStore from '../stores/UserStore';
import { useEffect } from 'react';

// using a hook, so we can create snackbars on different events
function useWebSocket() {
    let stompClient: Stomp.Client;
    let user = useUserStore();

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

      useEffect(() => {
        stompConnect();
      }, []);
}



export default useWebSocket;