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
import { UserState } from '../types/user';

interface UserStoreConfig extends UserState {
  login: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  roles: Array<string> | null;
  loginRefreshRequired: boolean | undefined;
  setLoginRefreshRequired: (bool: boolean) => void;
  updateUserState: (userState: UserState) => void;
  logout: () => void;
}

const useUserStore = create<UserStoreConfig>()(set => ({
  login: null,
  firstName: null,
  lastName: null,
  email: null,
  roles: [],
  loginRefreshRequired: undefined,
  updateUserState: (userState: UserState) =>
    set(() => ({
      login: userState.login,
      firstName: userState.firstName,
      lastName: userState.lastName,
      email: userState.email,
      roles: userState.roles,
    })),
  logout: () =>
    set(() => ({
      login: null,
      firstName: null,
      lastName: null,
      email: null,
      roles: [],
    })),
  setLoginRefreshRequired: (bool: boolean) => {
    set({ loginRefreshRequired: bool });
  },
}));

export default useUserStore;
