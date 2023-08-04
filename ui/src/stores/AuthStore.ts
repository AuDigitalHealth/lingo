import { create } from 'zustand';
import { AuthState } from '../types/authorisation';

interface AuthStoreConfig extends AuthState {
  desiredRoute: string,
  updateDesiredRoute: (desiredRoute: string) => void;
  updateAuthState: (authState: AuthState) => void;
  updateFetching: (fetching: boolean) => void;
  updateAuthorised: (authorised: boolean) => void;
}

const useAuthStore = create<AuthStoreConfig>()(set => ({
  desiredRoute: '',
  authorised: null,
  fetching: null,
  errorMessage: null,
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
