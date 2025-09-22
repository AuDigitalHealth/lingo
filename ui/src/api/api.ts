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
  normalizeMultilineMessage,
  snackbarMultilineStyle,
} from './ProblemDetail';
import {
  isSentryAvailable,
  Sentry,
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
        enqueueSnackbar(
          normalizeMultilineMessage(potentialProblemDetail.detail),
          {
            variant: 'error',
            style: snackbarMultilineStyle,
          },
        );
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
            Sentry.withScope(scope => {
              scope.setTag('axios', 'true');
              scope.setTag('http.status_code', error.response?.status);

              // Correlation ID if backend sends one (e.g. `x-correlation-id`)
              const correlationId =
                error.response?.headers?.['x-correlation-id'] ||
                error.response?.headers?.['sentry-event-id'];
              if (correlationId) {
                console.log('apicorrelation_id', correlationId);
                scope.setTag('correlation_id', correlationId);
              }

              scope.setContext('AxiosRequest', {
                url: error.config?.url,
                method: error.config?.method,
                safeParams: error.config?.params,
                safeData: error.config?.data,
              });

              scope.setContext('AxiosResponse', {
                status: error.response?.status,
                safeResponseData: error.response?.data,
              });

              // Build descriptive error message with request details
              const requestParams = error.config?.params
                ? JSON.stringify(error.config.params)
                : undefined;

              const normalizedError = new Error(
                [
                  error.message || 'Axios request failed',
                  `URL: ${error.config?.url}`,
                  `Method: ${error.config?.method}`,
                  requestParams ? `Params: ${requestParams}` : null,
                  error.config?.data
                    ? `Data: ${JSON.stringify(error.config.data)}`
                    : null,
                  error.response?.status
                    ? `Status: ${error.response.status}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' | '),
              );

              normalizedError.name = error.name || 'AxiosError';
              if (error.stack) {
                normalizedError.stack = error.stack;
              }

              // Capture and get eventId
              const eventId = Sentry.captureException(normalizedError);

              // Show user feedback dialog tied to this event
              Sentry.showReportDialog({ eventId });
            });
          } else {
            enqueueSnackbar(
              `Oops, something went wrong! Please copy the error details below and report it to support: \n\n` +
                filterStackTrace(potentialInternalServerError),
              {
                variant: 'error',
              },
            );
          }
        } else if (isUserReportableProblem(potentialProblemDetail)) {
          enqueueSnackbar(
            normalizeMultilineMessage(potentialProblemDetail.detail),
            {
              variant: 'error',
              style: snackbarMultilineStyle,
            },
          );
        }
      }
    }
    return Promise.reject(error);
  },
);
