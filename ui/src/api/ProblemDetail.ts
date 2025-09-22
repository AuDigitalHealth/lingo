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

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  path?: string;
  error?: string;
}

export interface UpstreamServerProblem {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
}

export interface InternalServerError {
  error: string;
  path: string;
  status: number;
  timestamp: string;
}
// eslint-disable-next-line
export const isProblemDetail = (data: any): data is ProblemDetail => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.type === 'string' &&
    typeof data.title === 'string' &&
    typeof data.status === 'number' &&
    typeof data.detail === 'string' &&
    typeof data.instance === 'string'
  );
};

export const isInternalServerError = (
  // eslint-disable-next-line
  data: any,
): data is InternalServerError => {
  return (
    data &&
    ((typeof data === 'object' &&
      typeof data.timestamp === 'string' &&
      typeof data.path === 'string' &&
      typeof data.status === 'number' &&
      typeof data.error === 'string' &&
      data?.error === 'Internal Server Error') ||
      data.status === 500)
  );
};

export const isUpstreamServerProblem = (
  data: ProblemDetail,
): data is UpstreamServerProblem => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.type === 'string' &&
    typeof data.title === 'string' &&
    typeof data.status === 'number' &&
    typeof data.detail === 'string' &&
    typeof data.instance === 'string' &&
    data.title === 'Upstream Service Error'
  );
};

export const isUserReportableProblem = (
  // eslint-disable-next-line
  data: any,
): data is ProblemDetail => {
  return (
    data.status === 400 &&
    typeof data.path === 'string' &&
    data.path.startsWith('/api')
  );
};

/**
 * Normalizes line endings in a message to LF so that CSS white-space handling can render them.
 * Supports CRLF/CR/LF inputs.
 */
export function normalizeMultilineMessage(message?: string | null): string {
  return (message ?? '').replace(/\r\n|\r|\n/g, '\n');
}

/**
 * Style object for notistack/MUI to preserve hard returns in snackbar messages.
 * Use with enqueueSnackbar(..., { style: snackbarMultilineStyle }).
 */
export const snackbarMultilineStyle: React.CSSProperties = {
  whiteSpace: 'pre-line',
};
