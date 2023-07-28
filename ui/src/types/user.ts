export type UserState = {
  login: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  roles: Array<string> | null;
};

export type UserActions =
  | { type: 'UPDATE_LOGIN'; payload: string }
  | { type: 'UPDATE_FIRST_NAME'; payload: string }
  | { type: 'UPDATE_LAST_NAME'; payload: string }
  | { type: 'UPDATE_EMAIL'; payload: string }
  | { type: 'UPDATE_ROLES'; payload: Array<string> }
  | { type: 'UPDATE_ALL'; payload: UserState };
