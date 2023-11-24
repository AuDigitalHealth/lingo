import { enqueueSnackbar } from 'notistack';
import { AxiosError } from 'axios';

interface SnowstormError {
  message: string;
  detail: string;
  status: number;
  error: string;
}

export const errorHandler = (error: unknown, subject: string) => {
  const err = error as AxiosError<SnowstormError>;
  let errorMessage = err.response?.data.error;
  if (err.response?.data.message) {
    errorMessage = err.response?.data.message;
  } else if (err.response?.data.detail) {
    errorMessage = err.response?.data.detail;
  }
  enqueueSnackbar(
    `${subject}, error code:${err.response?.data.status}, error message: ${errorMessage}`,
    {
      variant: 'error',
    },
  );
};
