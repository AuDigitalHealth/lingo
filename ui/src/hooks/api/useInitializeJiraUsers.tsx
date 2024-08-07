import JiraUserService from '../../api/JiraUserService';
import { useQuery } from '@tanstack/react-query';

export function useJiraUsers() {
  const { isLoading, data } = useQuery({
    queryKey: ['jira-users'],
    queryFn: () => {
      return JiraUserService.getAllJiraUsers();
    },
    staleTime: 1 * (60 * 1000),
  });

  const jiraUsersIsLoading: boolean = isLoading;
  const jiraUsers = data ?? [];

  return { jiraUsersIsLoading, jiraUsers };
}
