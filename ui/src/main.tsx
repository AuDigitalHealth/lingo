import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

import { CssBaseline } from '@mui/material';
import ThemeCustomization from './themes/index.tsx';
import { ConfigProvider } from './contexts/ConfigContext.tsx';
import Locales from './components/Locales.tsx';
import { SnackbarProvider } from 'notistack';
import CloseSnackbar from './components/CloseSnackBar.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider>
      <ThemeCustomization>
        <Locales>
          <CssBaseline />
          <SnackbarProvider
            autoHideDuration={15000}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            preventDuplicate={true}
            action={<CloseSnackbar />}
          >
            <App />
          </SnackbarProvider>
        </Locales>
      </ThemeCustomization>
    </ConfigProvider>
  </React.StrictMode>,
);
