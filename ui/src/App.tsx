// import Router from './router/Router';
import { browserRouter } from './router';
import './app.css';
import { RouterProvider } from 'react-router-dom';

import useApplicationConfigStore from './stores/ApplicationConfigStore.ts';
import { configureSentry } from './sentry/SentryConfig.ts';
import { useFetchReleaseVersion } from './hooks/api/useInitializeConfig.tsx';

function App() {
  const { releaseVersion } = useFetchReleaseVersion();
  const { applicationConfig } = useApplicationConfigStore();
  if (applicationConfig.sentryEnabled) {
    configureSentry(applicationConfig, releaseVersion);
  }

  return <RouterProvider router={browserRouter} />;
}

export default App;
