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

import { enqueueSnackbar } from 'notistack';
import { AxiosError } from 'axios';
import { ServiceStatus } from './applicationConfig';

export interface SnowstormError {
  message: string;
  detail: string;
  status: number;
  error: string;
}

export const snowstormErrorHandler = (
  unknownError: unknown,
  subject: string,
  serviceStatus: ServiceStatus | undefined,
) => {
  const running = serviceStatus?.snowstorm.running;
  const err = unknownError as AxiosError<SnowstormError>;
  let errorMessage = err.response?.data.error;

  if (err.status === 500 && !running) {
    return unavailableErrorHandler('', 'Snowstorm');
  } else {
    if (err.response?.data.message) {
      errorMessage = err.response?.data.message;
    } else if (err.response?.data.detail) {
      errorMessage = err.response?.data.detail;
    }
    return enqueueSnackbar(
      `${subject}, ${err.response?.data.status}: ${errorMessage}`,
      {
        variant: 'error',
      },
    );
  }
};

export const authoringPlatformErrorHandler = (
  unknownError: unknown,
  subject: string,
  running: boolean | undefined,
) => {
  const err = unknownError as AxiosError<SnowstormError>;
  let errorMessage = err.response?.data.error;

  if (err.response?.status === 500 && !running) {
    unavailableErrorHandler('', 'Authoring Platform');
  } else {
    if (err.response?.data.message) {
      errorMessage = err.response?.data.message;
    } else if (err.response?.data.detail) {
      errorMessage = err.response?.data.detail;
    }
    enqueueSnackbar(
      `${subject}, ${err.response?.data.status}: ${errorMessage}`,
      {
        variant: 'error',
      },
    );
  }
};

export const unavailableErrorHandler = (
  functionName: string,
  service: string,
) => {
  return enqueueSnackbar(
    `Unable to perform ${functionName} function as ${service} is currently unavailable.`,
    {
      variant: 'error',
    },
  );
};

export const unavailableTasksErrorHandler = () => {
  enqueueSnackbar(
    `Unable to load tasks as Authoring Platform is currently unavailable`,
    {
      variant: 'error',
    },
  );
};

export const showErrors = (errorMessages: string[], subject?: string) => {
  if (!subject) {
    return enqueueSnackbar(`error: ${errorMessages.toString()}`, {
      variant: 'error',
    });
  } else
    return enqueueSnackbar(`${subject}, error: ${errorMessages.toString()}`, {
      variant: 'error',
    });
};

export const showError = (errorMessage?: string, subject?: string) => {
  if (!errorMessage) return;
  if (!subject) {
    enqueueSnackbar(`error: ${errorMessage}`, {
      variant: 'error',
    });
  } else
    enqueueSnackbar(`${subject}, error: ${errorMessage}`, {
      variant: 'error',
    });
};

export interface LingoProblem extends Error {
  status: number;
  title: string;
  type: string;
  detail: string;
}

export const snomioErrorHandler = (lingoProblem: LingoProblem) => {
  enqueueSnackbar(`Snomio Problem`, {
    variant: 'error',
  });
};
