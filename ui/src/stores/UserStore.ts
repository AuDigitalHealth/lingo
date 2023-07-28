import { create } from 'zustand';
import { UserState } from '../types/user';

interface UserStoreConfig extends UserState {
  updateUserState: (userState: UserState) => void;
  logout: () => void;
}

const useUserStore = create<UserStoreConfig>()(set => ({
  login: null,
  firstName: null,
  lastName: null,
  email: null,
  roles: [],
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
}));

export default useUserStore;
