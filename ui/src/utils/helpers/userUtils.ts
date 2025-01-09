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

import { JiraUser } from '../../types/JiraUserResponse.ts';
import { UserDetails } from '../../types/task.ts';

export function mapUserToUserDetail(
  username: string,
  userList: JiraUser[],
): UserDetails | undefined {
  const jiraUser = userList.find(function (user) {
    return user.name === username;
  });
  if (jiraUser === undefined) {
    return undefined;
  }
  const userDetail: UserDetails = {
    email: jiraUser.emailAddress ? jiraUser.emailAddress : '',
    displayName: jiraUser.displayName,
    username: jiraUser.name,
    avatarUrl: jiraUser?.avatarUrls ? jiraUser?.avatarUrls['48x48'] : '',
  };
  return userDetail;
}
export function mapToUserNameArray(userList: UserDetails[]): string[] {
  const userNameList: string[] = userList
    ? userList.map(function (user) {
        return user.username;
      })
    : [];
  return userNameList;
}

export function isUserExistsInList(
  userNameList: string[],
  search: string,
  userList: JiraUser[],
): boolean {
  if (userNameList.length === 0) {
    return false;
  }
  const result = userNameList.filter(userName => {
    return isUserExists(userName, userList, search);
  });
  return result.length > 0;
}
export function isUserExists(
  username: string,
  userList: JiraUser[],
  searchTerm: string,
): boolean {
  const jiraUser = findJiraUserFromList(username, userList);
  if (jiraUser) {
    return (
      jiraUser.displayName.toUpperCase().includes(searchTerm.toUpperCase()) ||
      jiraUser.name.toUpperCase().includes(searchTerm.toUpperCase())
    );
  }
  return false;
}

export function mapToUserOptions(userList: JiraUser[]) {
  const emailList = userList.map(function (user) {
    return { value: user.name, label: user.displayName };
  });
  return emailList;
}

export function getGravatarUrl(username: string, userList: JiraUser[]): string {
  const user = findJiraUserFromList(username, userList);
  return user === undefined
    ? ''
    : user.avatarUrls
      ? user.avatarUrls['48x48'] + '&d=monsterid'
      : '';
}
export function getDisplayName(username: string, userList: JiraUser[]): string {
  return findJiraUserFromList(username, userList)?.displayName as string;
}
export function getEmail(username: string, userList: JiraUser[]): string {
  return findJiraUserFromList(username, userList)?.emailAddress as string;
}
export function getGravatarMd5FromUsername(
  username: string,
  userList: JiraUser[],
): string {
  const user = findJiraUserFromList(username, userList);
  const gravatarUrl = user?.avatarUrls ? user?.avatarUrls['48x48'] : undefined;
  if (!gravatarUrl) return '';
  const md5 = gravatarUrl.substring(
    gravatarUrl.indexOf('/avatar/') + 8,
    gravatarUrl.lastIndexOf('?'),
  );

  return md5;
}
export function findJiraUserFromList(
  username: string | undefined,
  userList: JiraUser[],
): JiraUser | undefined {
  if (!username) return undefined;
  const filteredUser = userList.find(function (user) {
    return user.name === username;
  });
  return filteredUser;
}
export function userExistsInList(
  userList: UserDetails[] | undefined,
  userName: string | null,
): boolean {
  if (!userList || userName === null) {
    return false;
  }
  const user = userList.find(function (u) {
    return u && u.username === userName;
  });
  return user !== undefined;
}

export function findLikeJiraUserByDisplayedNameFromList(
  term: string | undefined,
  userList: JiraUser[],
): JiraUser | undefined {
  if (!term) return undefined;
  const filteredUser = userList.find(function (user) {
    return user.displayName.toLowerCase().startsWith(term);
  });
  return filteredUser;
}
