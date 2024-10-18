import React, { useEffect } from 'react';
import App from './App.tsx';
import { initializeOpenTelemetry } from './Tracing.tsx';

import { CssBaseline } from '@mui/material';
import ThemeCustomization from './themes/index.tsx';
import { ConfigProvider } from './contexts/ConfigContext.tsx';
import Locales from './components/Locales.tsx';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/en-au';
import { QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { PrimeReactProvider } from 'primereact/api';
import { queryClient } from './hooks/api/config/useQueryConfig.ts';
import useApplicationConfigStore from './stores/ApplicationConfigStore.ts';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Australia/Brisbane');
initializeOpenTelemetry();

export const MainBody = () => {
  const { getLogo, applicationConfig } = useApplicationConfigStore();

  useEffect(() => {
    const logo = getLogo();
    if (logo) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      // Set the favicon based on the environment
      link.href = logo;
      document.head.appendChild(link);
    }
  }, [applicationConfig, getLogo]);

  return (
    <React.StrictMode>
      <PrimeReactProvider>
        <ConfigProvider>
          <ThemeCustomization>
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="en-au"
            >
              <Locales>
                <CssBaseline />
                <QueryClientProvider client={queryClient}>
                  <App />
                </QueryClientProvider>
              </Locales>
            </LocalizationProvider>
          </ThemeCustomization>
        </ConfigProvider>
      </PrimeReactProvider>
    </React.StrictMode>
  );
};
