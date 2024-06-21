import { useMemo } from 'react';
import TicketsService from '../../api/TicketsService';
import useTicketStore from '../../stores/TicketStore';
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import {
  ticketExternalRequestors,
  ticketIterationsKey,
  ticketLabelsKey,
} from '../../types/queryKeys.ts';
import {
  SearchCondition,
  SearchConditionBody,
} from '../../types/tickets/search.ts';

export default function useInitializeTickets() {
  // const { ticketsIsLoading } = useInitializeTicketsArray();
  const { statesIsLoading } = useInitializeState();
  const { labelsIsLoading } = useInitializeLabels();
  const { externalRequestorsIsLoading } = useInitializeExternalRequestors();
  const { schedulesIsLoading } = useInitializeSchedules();
  const { iterationsIsLoading } = useInitializeIterations();
  const { priorityBucketsIsLoading } = useInitializePriorityBuckets();
  const { taskAssociationsIsLoading } = useInitializeTaskAssociations();
  const { additionalFieldsIsLoading } = useInitializeAdditionalFieldsTypes();
  const { additionalFieldsTypesWithValuesIsLoading } =
    useInitializeAdditionalFieldsTypesValues();
  const { ticketFiltersIsLoading } = useInitializeTicketFilters();

  return {
    ticketsLoading:
      additionalFieldsTypesWithValuesIsLoading ||
      additionalFieldsIsLoading ||
      statesIsLoading ||
      labelsIsLoading ||
      externalRequestorsIsLoading ||
      iterationsIsLoading ||
      priorityBucketsIsLoading ||
      taskAssociationsIsLoading ||
      schedulesIsLoading ||
      ticketFiltersIsLoading,
  };
}

export function useInitializeTicketsArray() {
  const { addPagedTickets } = useTicketStore();
  const { isLoading, data } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => TicketsService.getPaginatedTickets(0, 20),
    staleTime: 1 * (60 * 1000),
  });
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
  const { isLoading, data } = useQuery({
    queryKey: ['state'],
    queryFn: () => {
      return TicketsService.getAllStates();
    },

    staleTime: 1 * (60 * 1000),
  });
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
  const { isLoading, data } = useQuery({
    queryKey: [ticketLabelsKey],
    queryFn: () => {
      return TicketsService.getAllLabelTypes();
    },
    staleTime: Infinity,
  });
  useMemo(() => {
    if (data) {
      setLabelTypes(data);
    }
  }, [data, setLabelTypes]);

  const labelsIsLoading: boolean = isLoading;
  const labelsData = data;

  return { labelsIsLoading, labelsData };
}
export function useInitializeExternalRequestors() {
  const { setExternalRequestors } = useTicketStore();
  const { isLoading, data } = useQuery({
    queryKey: [ticketExternalRequestors],
    queryFn: () => {
      return TicketsService.getAllExternalRequestors();
    },
    staleTime: Infinity,
  });
  useMemo(() => {
    if (data) {
      setExternalRequestors(data);
    }
  }, [data, setExternalRequestors]);

  const externalRequestorsIsLoading: boolean = isLoading;
  const externalRequestorsData = data;

  return { externalRequestorsIsLoading, externalRequestorsData };
}
export function useInitializeSchedules() {
  const { setSchedules } = useTicketStore();

  const { isLoading, data } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => {
      return TicketsService.getAllSchedules();
    },
    staleTime: 1 * (60 * 1000),
  });
  useMemo(() => {
    if (data) {
      setSchedules(data);
    }
  }, [data, setSchedules]);

  const schedulesIsLoading: boolean = isLoading;
  const schedulesData = data;

  return { schedulesIsLoading, schedulesData };
}

export function useInitializeIterations() {
  const { setIterations } = useTicketStore();
  const { isLoading, data } = useQuery({
    queryKey: [ticketIterationsKey],
    queryFn: () => {
      return TicketsService.getAllIterations();
    },
    staleTime: Infinity,
  });
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
  const { isLoading, data } = useQuery({
    queryKey: ['priority-buckets'],
    queryFn: () => {
      return TicketsService.getAllPriorityBuckets();
    },
    staleTime: 1 * (60 * 1000),
  });
  useMemo(() => {
    if (data) {
      setPriorityBuckets(data);
    }
  }, [data, setPriorityBuckets]);

  const priorityBucketsIsLoading: boolean = isLoading;
  const priorityBucketsData = data;

  return { priorityBucketsIsLoading, priorityBucketsData };
}

export function useInitializeAdditionalFieldsTypes() {
  const { setAdditionalFieldTypes } = useTicketStore();
  const { isLoading, data } = useQuery({
    queryKey: ['additional-fields-types'],
    queryFn: () => {
      return TicketsService.getAllAdditionalFieldTypes();
    },
    staleTime: 1 * (60 * 1000),
  });
  useMemo(() => {
    if (data) {
      setAdditionalFieldTypes(data);
    }
  }, [data, setAdditionalFieldTypes]);

  const additionalFieldsIsLoading: boolean = isLoading;
  const additionalFields = data;

  return { additionalFieldsIsLoading, additionalFields };
}

export function useInitializeAdditionalFieldsTypesValues() {
  const { setAdditionalFieldTypesOfListType } = useTicketStore();
  const { isLoading, data } = useQuery({
    queryKey: ['additional-fields-types-values-list'],
    queryFn: () => {
      return TicketsService.getAllAdditionalFieldTypessWithValues();
    },
    staleTime: 1 * (60 * 1000),
  });
  useMemo(() => {
    if (data) {
      setAdditionalFieldTypesOfListType(data);
    }
  }, [data, setAdditionalFieldTypesOfListType]);

  const additionalFieldsTypesWithValuesIsLoading: boolean = isLoading;
  const additionalFieldsTypesWithValues = data;

  return {
    additionalFieldsTypesWithValuesIsLoading,
    additionalFieldsTypesWithValues,
  };
}

export const initializeTaskAssociationsOptions = () => {
  const queryKey = ['task-associations'];
  return queryOptions({
    queryKey,
    queryFn: () => TicketsService.getTaskAssociations(),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};

export function useInitializeTaskAssociations() {
  const { isLoading, data } = useQuery({
    ...initializeTaskAssociationsOptions(),
  });

  const taskAssociationsIsLoading: boolean = isLoading;
  const taskAssociationsData = data;

  return { taskAssociationsIsLoading, taskAssociationsData };
}

export function useInitializeTicketFilters() {
  const { setTicketFilters } = useTicketStore();
  const { isLoading, data } = useQuery({
    queryKey: ['ticket-filters'],
    queryFn: () => {
      return TicketsService.getAllTicketFilters();
    },
    staleTime: 1 * (60 * 1000),
  });
  useMemo(() => {
    if (data) {
      setTicketFilters(data);
    }
  }, [data, setTicketFilters]);

  const ticketFiltersIsLoading: boolean = isLoading;
  const ticketFiltersData = data;

  return { ticketFiltersIsLoading, ticketFiltersData };
}

export function useSearchTicketByTitle(
  title: string,
  additionalParams: string | undefined,
) {
  const safeAdditionalParams =
    additionalParams != undefined ? additionalParams : '';
  const { isLoading, data } = useQuery({
    queryKey: [`ticket-search-name-${title}`],
    queryFn: () => {
      return TicketsService.searchPaginatedTickets(
        `?title=${title + safeAdditionalParams}`,
        0,
        20,
      );
    },
    staleTime: 500,
  });

  return { isLoading, data };
}

export function useSearchTicketByTitlePost() {
  const searchTicketMutation = useMutation({
    mutationFn: (params: {
      title: string;
      defaultConditions: SearchCondition[];
    }) => {
      const { title, defaultConditions } = params;
      const titleCondition: SearchCondition = {
        key: 'title',
        operation: '=',
        condition: 'and',
        value: title,
      };
      const conditions: SearchConditionBody = {
        searchConditions: [...defaultConditions],
      };
      if (title !== undefined && title !== '') {
        conditions.searchConditions.push(titleCondition);
      }
      return TicketsService.searchPaginatedTicketsByPost(conditions, 0, 20);
    },
    onSuccess: data => {
      // Handle successful response
      console.log('Search success:', data);
    },
    onError: error => {
      // Handle error
      console.error('Search error:', error);
    },
  });

  return {
    ...searchTicketMutation,
    isLoading: searchTicketMutation.isPending,
    data: searchTicketMutation.data,
    error: searchTicketMutation.error,
  };
}
