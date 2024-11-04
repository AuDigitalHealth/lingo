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

import { create } from 'zustand';
import { AuthState } from '../types/authorisation';

interface AuthStoreConfig extends AuthState {
  desiredRoute: string;
  updateDesiredRoute: (desiredRoute: string) => void;
  updateAuthState: (authState: AuthState) => void;
  updateFetching: (fetching: boolean) => void;
  updateAuthorised: (authorised: boolean) => void;
  resetAuthStore: () => void;
}

const useAuthStore = create<AuthStoreConfig>()(set => ({
  statusCode: null,
  desiredRoute: '',
  authorised: null,
  fetching: null,
  errorMessage: null,
  resetAuthStore: () => {
    set({
      statusCode: null,
      desiredRoute: '',
      authorised: null,
      fetching: null,
      errorMessage: null,
    });
  },
  updateDesiredRoute: (desiredRoute: string) =>
    set(() => ({
      desiredRoute: desiredRoute,
    })),
  updateAuthState: (authState: AuthState) =>
    set(() => ({
      authorised: authState.authorised,
      fetching: authState.fetching,
      errorMessage: authState.errorMessage,
    })),
  updateFetching: (fetching: boolean) =>
    set(() => ({
      fetching: fetching,
    })),
  updateAuthorised: (authorised: boolean) =>
    set(() => ({
      authorised: authorised,
    })),
}));

export default useAuthStore;
