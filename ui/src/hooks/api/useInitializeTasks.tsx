import {useQuery} from '@tanstack/react-query';
import useTaskStore from "../../stores/TaskStore";
import TasksServices from '../../api/TasksService';
import { useMemo } from 'react';

export default function useInitializeTasks(){
    const {allTasksIsLoading} = useInitializeAllTasks();
    const {tasksIsLoading} = useInitializeMyTasks();

    return {tasksLoading: allTasksIsLoading || tasksIsLoading};
}

export function useInitializeAllTasks(){
    const {setAllTasks} = useTaskStore();
    const {isLoading, data} = useQuery(
        ['all-tasks'],
        TasksServices.getAllTasks,
        {staleTime: 1 * (60 * 1000)}
    );

    useMemo(() => {
        if(data){
            setAllTasks(data);
        }
    }, [data])
    
    const allTasksIsLoading : boolean = isLoading;
    const allTasksData = data; 

    return {allTasksIsLoading, allTasksData};
}

export function useInitializeMyTasks(){
    const {setTasks} = useTaskStore();
    const {isLoading, data} = useQuery(
        ['all-tasks'],
        TasksServices.getUserTasks,
        {staleTime: 1 * (60 * 1000)}
        
    );
    
    useMemo(() => {
        if(data){
            setTasks(data);
        }
    }, [data])
    const tasksIsLoading : boolean = isLoading;
    const tasksData = data; 

    return {tasksIsLoading, tasksData};
}

