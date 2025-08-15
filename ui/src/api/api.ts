///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import axios from 'axios';
import useUserStore from '../stores/UserStore';
import { enqueueSnackbar } from 'notistack';
import {
  isInternalServerError,
  isProblemDetail,
  isUpstreamServerProblem,
  isUserReportableProblem,
} from './ProblemDetail';
import {
  isSentryAvailable,
  showSentryFeedbackDialog,
} from '../sentry/SentryConfig';

export const api = axios.create({});

function filterStackTrace(error: unknown): string {
  if (!error) return 'Unknown error';

  try {
    const errorObj = typeof error === 'string' ? JSON.parse(error) : error;

    // Extract stack trace if available
    let stack = errorObj.trace || errorObj.stack || errorObj.exception?.stack;
    if (stack) {
      // Filter to only include lines with your package name
      const stackLines = stack.replace('\\n', '\n').split('\n');
      const filteredLines = stackLines.filter(l =>
        l.includes('au.gov.digitalhealth'),
      );

      // If we found relevant lines, use those
      if (filteredLines.length > 0) {
        stack = filteredLines.join('\n');
        // Create new error object with filtered stack
        const filteredError = {
          ...errorObj,
          trace: stack,
          message: errorObj.message || 'Unknown error',
          // Add note about filtering
          note: 'Stack trace filtered to show only application code',
        };
        return JSON.stringify(filteredError, null, 2);
      }
    }

    // If no stack or no filtered lines, return original with truncation
    return (
      JSON.stringify(errorObj, null, 2).substring(0, 1000) +
      (JSON.stringify(errorObj, null, 2).length > 1000
        ? '...\n[Stack trace truncated]'
        : '')
    );
  } catch (e) {
    console.log('Error parsing error object', e);
    // If parsing fails, return as is but truncated
    const errorStr = String(error);
    return (
      errorStr.substring(0, 1000) +
      (errorStr.length > 1000 ? '...\n[Stack trace truncated]' : '')
    );
  }
}

api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (
      error.response?.status === 403 &&
      error.response.data?.detail === 'The task is not owned by the user.'
    ) {
      enqueueSnackbar(
        'You don’t currently have ownership of this task, so this action isn’t allowed.',
        {
          variant: 'error',
        },
      );
    } else if (
      error.response?.status === 403 &&
      window.location.href.includes('/dashboard')
    ) {
      useUserStore.setState({ loginRefreshRequired: true });
    } else {
      const potentialProblemDetail = error?.response?.data;

      if (isUserReportableProblem(potentialProblemDetail)) {
        enqueueSnackbar(potentialProblemDetail.detail, {
          variant: 'error',
        });
      } else {
        const potentialInternalServerError = error?.response?.data;
        if (
          isProblemDetail(potentialInternalServerError) &&
          isUpstreamServerProblem(potentialInternalServerError)
        ) {
          enqueueSnackbar(`${potentialInternalServerError?.detail}`, {
            variant: 'error',
          });
        } else if (isInternalServerError(potentialInternalServerError)) {
          if (isSentryAvailable()) {
            // Use Sentry feedback dialog
            showSentryFeedbackDialog(
              error,
              potentialInternalServerError.timestamp,
            );
          } else {
            enqueueSnackbar(
              `Oops, something went wrong! Please copy the error details below and report it to support: \n\n` +
                filterStackTrace(potentialInternalServerError),
              {
                variant: 'error',
              },
            );
          }
        }
      }
    }
    return Promise.reject(error);
  },
);
