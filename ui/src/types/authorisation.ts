export type AuthState = {
  statusCode: number | null;
  authorised: boolean | null;
  fetching: boolean | null;
  errorMessage: string | null;
};

export type AuthActions =
  | { type: 'UPDATE_AUTHORISED'; payload: boolean }
  | { type: 'UPDATE_FETCHING'; payload: boolean }
  | { type: 'UPDATE_ERROR_MESSAGE'; payload: string }
  | { type: 'UPDATE_ALL'; payload: AuthState };

//
