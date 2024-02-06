import { useCallback, useEffect, useState } from 'react';
import useAuthStore from '../stores/AuthStore';
import useUserStore from '../stores/UserStore';
import AuthService from '../api/AuthService';
import { useNavigate } from 'react-router-dom';
import useAuthoringStore from '../stores/AuthoringStore';

const activityEvents = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
];
const interval = 1000;
const maxInactivity = 60 * 1000 * 30; // Change maxInactivity to 100 seconds (100 * 1000 milliseconds)

function useLogoutTimer() {
  const [inactiveTimer, setInactiveTimer] = useState(0);
  //   const [inactive, setInactive] = useState(false);
  const [intervalRef, setIntervalRef] = useState<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { setForceNavigation } = useAuthoringStore();

  const { resetAuthStore } = useAuthStore();
  const { logout } = useUserStore();

  const handleInactiveTimerChange = () => {
    if (inactiveTimer >= maxInactivity) {
      if (intervalRef) {
        clearInterval(intervalRef);
      }
    } else {
      setInactiveTimer(prevTimer => prevTimer + interval);
    }
  };

  const handleInactiveTimerReset = () => {
    setInactiveTimer(0);
  };

  const handleLogout = useCallback(() => {
    setInactiveTimer(0);
    resetAuthStore();
    logout();
    navigate('/login');
  }, [setInactiveTimer, resetAuthStore, logout, navigate]);

  const activityWatcher = useCallback(() => {
    const temp = setInterval(() => {
      handleInactiveTimerChange();
    }, interval);
    setIntervalRef(temp);

    activityEvents.forEach(eventName => {
      document.addEventListener(eventName, handleInactiveTimerReset, true);
    });

    return () => {
      if (intervalRef) {
        clearInterval(intervalRef);
      }
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    activityWatcher();
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleInactiveTimerReset);
      });
      if (intervalRef) {
        clearInterval(intervalRef);
      }
    };
    // eslint-disable-next-line
  }, [activityWatcher]);

  useEffect(() => {
    if (inactiveTimer >= maxInactivity) {
      setForceNavigation(true);
      void AuthService.logout().then(res => {
        if (res.status === 200) {
          handleLogout();
        }
      });
    }
  }, [inactiveTimer, setForceNavigation, handleLogout]);
}

export default useLogoutTimer;
