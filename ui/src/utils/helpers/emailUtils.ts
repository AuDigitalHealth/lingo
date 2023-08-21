import { JiraUser } from '../../types/JiraUserResponse.ts';
import { UserDetails } from '../../types/task.ts';

export default function emailUtils(email: string | undefined) {
  if (email === undefined) return '';

  const [namePart, domainPart] = email.split('@');
  const [firstname, lastname] = namePart.split('.');

  const capitalizedFirstname =
    firstname?.charAt(0)?.toUpperCase() + firstname?.slice(1);
  const capitalizedLastname =
    lastname?.charAt(0)?.toUpperCase() + lastname?.slice(1);

  const transformedName = `${capitalizedFirstname} ${capitalizedLastname}`;

  return transformedName;
}

export function mapEmailToUserDetail(
  email: string,
  userList: JiraUser[],
): UserDetails {
  const jiraUser = userList.find(function (user) {
    return user.emailAddress === email;
  });
  if (jiraUser) {
    const userDetail: UserDetails = {
      email: jiraUser.emailAddress,
      displayName: jiraUser.displayName,
      username: jiraUser.name,
      avatarUrl: '',
    };
    return userDetail;
  }
}
export function mapToEmailList(userList: UserDetails[]): string[] {
  const emailList: string[] = userList.map(function (user) {
    return user.email;
  });
  console.log(emailList);
  return emailList;
}

export function mapJiraUsersToEmailList(userList: JiraUser[]): string[] {
  const emailList: string[] = userList.map(function (user) {
    return user.emailAddress;
  });
  return emailList;
}
