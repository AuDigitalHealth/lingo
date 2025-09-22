// import Router from './router/Router';
import { browserRouter } from './router';
import './app.css';
import { RouterProvider } from 'react-router-dom';

import { configureSentry } from './sentry/SentryConfig.ts';
import {
  useFetchReleaseVersion,
  useSecureApplicationConfig,
} from './hooks/api/useInitializeConfig.tsx';
import { useEffect } from 'react';

function App() {
  const { releaseVersion } = useFetchReleaseVersion();
  const { secureAppConfig } = useSecureApplicationConfig();

  useEffect(() => {
    if (secureAppConfig) {
      // Configure Sentry when config is available
      configureSentry(secureAppConfig, releaseVersion);
    }
  }, [secureAppConfig, releaseVersion]);

  return <RouterProvider router={browserRouter} />;
}

export default App;
