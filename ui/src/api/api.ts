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
  isUserReportableProblem,
} from './ProblemDetail';

export const api = axios.create({});

api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      error.data?.error ||
      'Unknown error';

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
    }

    const potentialProblemDetail = error?.response?.data;

    const potentialInternalServerError = error?.response?.data;
    if (isUserReportableProblem(potentialProblemDetail)) {
      enqueueSnackbar(potentialProblemDetail.detail, {
        variant: 'error',
      });
    }
    if (isInternalServerError(potentialInternalServerError)) {
      enqueueSnackbar(
        `Oops something went wrong! Please raise an issue describing what led to this and include the timestamp: ${potentialInternalServerError.timestamp}`,
        {
          variant: 'error',
        },
      );
    }
    return Promise.reject(error);
  },
);
