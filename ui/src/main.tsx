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
