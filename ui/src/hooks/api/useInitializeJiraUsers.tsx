import { useMemo } from "react";
import JiraUserService from "../../api/JiraUserService";
import useJiraUserStore from "../../stores/JiraUserStore";
import {useQuery} from '@tanstack/react-query';

export function useInitializeJiraUsers(){
    const {setJiraUsers} = useJiraUserStore();
    const {isLoading, data} = useQuery(
        ['jira-users'],
        JiraUserService.getAllJiraUsers,
        {staleTime: 1 * (60 * 1000)}
        
    );

    useMemo(() => {
        if(data){
            setJiraUsers(data);
        }
    }, [data]);
    
    const jiraUsersIsLoading : boolean = isLoading;
    const jiraUsersData = data; 

    return {jiraUsersIsLoading, jiraUsersData};
}