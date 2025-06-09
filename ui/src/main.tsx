const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (
    args.some(
      arg =>
        typeof arg === 'string' &&
        arg.includes('WebSocket') &&
        arg.includes('local'),
    )
  ) {
    // Ignore errors that include 'WebSocket' and 'local'
    return;
  }
  originalConsoleError(...args);
};

import React from 'react';
import ReactDOM from 'react-dom/client';

import { initializeOpenTelemetry } from './Tracing.tsx';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/en-au';

import { MainBody } from './MainBody.tsx';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Australia/Brisbane');
initializeOpenTelemetry();

ReactDOM.createRoot(document.getElementById('root')!).render(<MainBody />);
