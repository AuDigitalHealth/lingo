import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

import { CssBaseline } from '@mui/material';
import ThemeCustomization from './themes/index.tsx';
import { ConfigProvider } from './contexts/ConfigContext.tsx';
import Locales from './components/Locales.tsx';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/en-au';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { PrimeReactProvider } from 'primereact/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // default: true
    },
  },
});

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Australia/Brisbane');
ReactDOM.createRoot(document.getElementById('root')!).render(
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
  </React.StrictMode>,
);
