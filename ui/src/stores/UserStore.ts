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
