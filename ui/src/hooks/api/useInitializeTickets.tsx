import { useMemo } from 'react';
import TicketsService from '../../api/TicketsService';
import useTicketStore from '../../stores/TicketStore';
import { useQuery } from '@tanstack/react-query';

export default function useInitializeTickets() {
  const { ticketsIsLoading } = useInitializeTicketsArray();
  const { statesIsLoading } = useInitializeState();
  const { labelsIsLoading } = useInitializeLabels();
  const { iterationsIsLoading } = useInitializeIterations();
  const { priorityBucketsIsLoading } = useInitializePriorityBuckets();
  const { additionalFieldsIsLoading } = useInitializeAdditionalFields();
  const { taskAssociationsIsLoading } = useInitializeTaskAssociations();

  return {
    ticketsLoading:
      ticketsIsLoading ||
      statesIsLoading ||
      labelsIsLoading ||
      iterationsIsLoading ||
      priorityBucketsIsLoading ||
      additionalFieldsIsLoading ||
      taskAssociationsIsLoading,
  };
}

export function useInitializeTicketsArray() {
  const { addPagedTickets } = useTicketStore();
  const { isLoading, data } = useQuery(
    ['tickets'],
    () => TicketsService.getPaginatedTickets(0, 20),
    { staleTime: 1 * (60 * 1000) },
  );
  useMemo(() => {
    if (data) {
      addPagedTickets(data);
    }
  }, [data, addPagedTickets]);

  const ticketsIsLoading: boolean = isLoading;
  const ticketsData = data;

  return { ticketsIsLoading, ticketsData };
}

export function useInitializeState() {
  const { setAvailableStates } = useTicketStore();
  const { isLoading, data } = useQuery(
    ['state'],
    () => {
      return TicketsService.getAllStates();
    },

    {
      staleTime: 1 * (60 * 1000),
    },
  );
  useMemo(() => {
    if (data) {
      setAvailableStates(data);
    }
  }, [data, setAvailableStates]);

  const statesIsLoading: boolean = isLoading;
  const statesData = data;
  return { statesIsLoading, statesData };
}

export function useInitializeLabels() {
  const { setLabelTypes } = useTicketStore();
  const { isLoading, data } = useQuery(
    ['labels'],
    () => {
      return TicketsService.getAllLabelTypes();
    },
    {
      staleTime: 1 * (60 * 1000),
    },
  );
  useMemo(() => {
    if (data) {
      setLabelTypes(data);
    }
  }, [data, setLabelTypes]);

  const labelsIsLoading: boolean = isLoading;
  const labelsData = data;

  return { labelsIsLoading, labelsData };
}

export function useInitializeIterations() {
  const { setIterations } = useTicketStore();
  const { isLoading, data } = useQuery(
    ['iterations'],
    () => {
      return TicketsService.getAllIterations();
    },

    {
      staleTime: 1 * (60 * 1000),
    },
  );
  useMemo(() => {
    if (data) {
      setIterations(data);
    }
  }, [data, setIterations]);

  const iterationsIsLoading: boolean = isLoading;
  const iterationsData = data;

  return { iterationsIsLoading, iterationsData };
}

export function useInitializePriorityBuckets() {
  const { setPriorityBuckets } = useTicketStore();
  const { isLoading, data } = useQuery(
    ['priority-buckets'],
    () => {
      return TicketsService.getAllPriorityBuckets();
    },
    {
      staleTime: 1 * (60 * 1000),
    },
  );
  useMemo(() => {
    if (data) {
      setPriorityBuckets(data);
    }
  }, [data, setPriorityBuckets]);

  const priorityBucketsIsLoading: boolean = isLoading;
  const priorityBucketsData = data;

  return { priorityBucketsIsLoading, priorityBucketsData };
}

export function useInitializeAdditionalFields() {
  const { setAdditionalFieldTypes } = useTicketStore();
  const { isLoading, data } = useQuery(
    ['additional-fields'],
    () => {
      return TicketsService.getAllAdditionalFields();
    },
    {
      staleTime: 1 * (60 * 1000),
    },
  );
  useMemo(() => {
    if (data) {
      setAdditionalFieldTypes(data);
    }
  }, [data, setAdditionalFieldTypes]);

  const additionalFieldsIsLoading: boolean = isLoading;
  const additionalFields = data;

  return { additionalFieldsIsLoading, additionalFields };
}

export function useInitializeTaskAssociations() {
  const { addTaskAssociations } = useTicketStore();
  const { isLoading, data } = useQuery(
    ['task-associations'],
    () => {
      return TicketsService.getTaskAssociations();
    },
    {
      staleTime: 1 * (60 * 1000),
    },
  );
  useMemo(() => {
    if (data) {
      addTaskAssociations(data);
    }
  }, [data, addTaskAssociations]);

  const taskAssociationsIsLoading: boolean = isLoading;
  const taskAssociationsData = data;

  return { taskAssociationsIsLoading, taskAssociationsData };
}

export function useSearchTicketByTitle(title: string) {
  const { isLoading, data } = useQuery(
    [`ticket-search-name-${title}`],
    () => {
      return TicketsService.searchPaginatedTickets(`?title=${title}`, 0, 20);
    },
    {
      staleTime: 0.5 * (60 * 1000),
    },
  );

  return { isLoading, data };
}
