import { enqueueSnackbar } from 'notistack';
import { AxiosError } from 'axios';
import { ServiceStatus } from './applicationConfig';

interface SnowstormError {
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

export interface SnomioProblem extends Error {
  status: number;
  title: string;
  type: string;
  detail: string;
}

export const snomioErrorHandler = (snomioProblem: SnomioProblem) => {
  console.log(snomioProblem);
  enqueueSnackbar(`Snomio Problem`, {
    variant: 'error',
  });
};
