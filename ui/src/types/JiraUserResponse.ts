export interface JiraUserResponse {
  name: string | null;
  users: UserItems;
}

export interface UserItems {
  size: number;
  items: JiraUser[];
}

export interface JiraUser {
  emailAddress: string;
  displayName: string;
  active: boolean;
  key: string;
  name: string;
}

export interface JiraUserSelect {
  label: string;
  value: string;
  email: string;
}
