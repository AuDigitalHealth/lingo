// import Router from './router/Router';
import { browserRouter } from './router';
import './app.css';
import { RouterProvider } from 'react-router-dom';

import { configureSentry } from './sentry/SentryConfig.ts';
import {
  useFetchReleaseVersion,
  useSecureApplicationConfig,
} from './hooks/api/useInitializeConfig.tsx';

function App() {
  const { releaseVersion } = useFetchReleaseVersion();
  const { secureAppConfig } = useSecureApplicationConfig();
  if (secureAppConfig && secureAppConfig.sentryEnabled) {
    configureSentry(secureAppConfig, releaseVersion);
  }

  return <RouterProvider router={browserRouter} />;
}

export default App;
