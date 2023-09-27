import { useMemo } from "react";
import TicketsService from "../../api/TicketsService";
import useTicketStore from "../../stores/TicketStore";
import {useQuery} from '@tanstack/react-query';

const ONE_MINUTE = 60000;

export default function useInitializeTickets(){
    const {ticketsIsLoading} = useInitializeTicketsArray();
    const {statesIsLoading} = useInitializeState();
    const {labelsIsLoading} = useInitializeLabels();
    const {iterationsIsLoading} = useInitializeIterations();
    const {priorityBucketsIsLoading} = useInitializePriorityBuckets();
    const {additionalFieldsIsLoading} = useInitializeAdditionalFields();
    const {taskAssociationsIsLoading} = useInitializeTaskAssociations();

    return { ticketsLoading: ticketsIsLoading || statesIsLoading || labelsIsLoading || iterationsIsLoading || priorityBucketsIsLoading || additionalFieldsIsLoading || taskAssociationsIsLoading};
}

export function useInitializeTicketsArray(){
    const {addPagedTickets} = useTicketStore();
    const {isLoading, data} = useQuery(
        ['tickets'],
        () => TicketsService.getPaginatedTickets(0, 20),
        {staleTime: 1 * (60 * 1000)}
    );
    useMemo(() => {
        if(data){
            addPagedTickets(data);            
        }
    }, [data])
        
    const ticketsIsLoading : boolean = isLoading;
    const ticketsData = data; 

    return {ticketsIsLoading, ticketsData};
}

export function useInitializeState(){
    const { setAvailableStates } = useTicketStore();
    const {isLoading, data} = useQuery(
        ['state'],
        TicketsService.getAllStates,
        {
            staleTime: 1 * (60 * 1000)
        }
    );
    useMemo(() => {
        if(data){
            setAvailableStates(data)
        }
    }, [data]);

    const statesIsLoading : boolean = isLoading;
    const statesData = data; 
    return {statesIsLoading, statesData};
}

export function useInitializeLabels(){
    const {setLabelTypes } = useTicketStore();
    const {isLoading, data} = useQuery(
        ['labels'],
        TicketsService.getAllLabelTypes,
        {
            staleTime: 1 * (60 * 1000)
        }
    );
    useMemo(() => {
        if(data){
            setLabelTypes(data);
        }
    }, [data]);
        
    const labelsIsLoading : boolean = isLoading;
    const labelsData = data; 

    return {labelsIsLoading, labelsData};
}

export function useInitializeIterations(){
    const { setIterations } = useTicketStore();
    const {isLoading, data} = useQuery(
        ['iterations'],
        TicketsService.getAllIterations,
        {
            staleTime: 1 * (60 * 1000)
        }
    );
    useMemo(() => {
        if(data){
            setIterations(data);
        }
    }, [data]);
        
    const iterationsIsLoading : boolean = isLoading;
    const iterationsData = data; 

    return {iterationsIsLoading, iterationsData};
}

export function useInitializePriorityBuckets(){
    const { setPriorityBuckets } = useTicketStore();
    const {isLoading, data} = useQuery(
        ['priority-buckets'],
        TicketsService.getAllPriorityBuckets,
        {
            staleTime: 1 * (60 * 1000)
        }
    );
    useMemo(() => {
        if(data){
            setPriorityBuckets(data);
        }
    }, [data]);
        
    const priorityBucketsIsLoading : boolean = isLoading;
    const priorityBucketsData = data; 

    return {priorityBucketsIsLoading, priorityBucketsData};
}

export function useInitializeAdditionalFields(){
    const {setAdditionalFieldTypes} = useTicketStore();
    const {isLoading, data} = useQuery(
        ['additional-fields'],
        TicketsService.getAllAdditionalFields,
        {
            staleTime: 1 * (60 * 1000)
        }
    );
    useMemo(() => {
        if(data){
            setAdditionalFieldTypes(data);
        }
    }, [data]);
        
    const additionalFieldsIsLoading : boolean = isLoading;
    const additionalFields = data; 

    return {additionalFieldsIsLoading, additionalFields};
}

export function useInitializeTaskAssociations(){
    const {setTaskAssociations} = useTicketStore();
    const {isLoading, data} = useQuery(
        ['task-associations'],
        TicketsService.getTaskAssociations,
        {
            staleTime: 1 * (60 * 1000)
        }
    );
    useMemo(() => {
        if(data){
            setTaskAssociations(data);
        }
    }, [data]);
        
    const taskAssociationsIsLoading : boolean = isLoading;
    const taskAssociationsData = data; 

    return {taskAssociationsIsLoading, taskAssociationsData};
}