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
  const { statesIsLoading } = useAllStates();
  const { labelsIsLoading } = useAllLabels();
  const { externalRequestorsIsLoading } = useAllExternalRequestors();
  const { schedulesIsLoading } = useAllSchedules();
  const { iterationsIsLoading } = useAllIterations();
  const { priorityBucketsIsLoading } = useAllPriorityBuckets();
  const { taskAssociationsIsLoading } = useAllTaskAssociations();
  const { additionalFieldsIsLoading } = useAllAdditionalFieldsTypes();
  const { additionalFieldsTypesWithValuesIsLoading } =
    useAllAdditionalFieldsTypesValues();
  const { ticketFiltersIsLoading } = useAllTicketFilters();

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

export function useAllStates() {
  const { isLoading, data } = useQuery({
    queryKey: ['state'],
    queryFn: () => {
      return TicketsService.getAllStates();
    },

    staleTime: 1 * (60 * 1000),
  });

  const statesIsLoading: boolean = isLoading;
  const availableStates = data ?? [];
  return { statesIsLoading, availableStates };
}

export function useAllLabels() {
  const { isLoading, data } = useQuery({
    queryKey: [ticketLabelsKey],
    queryFn: () => {
      return TicketsService.getAllLabelTypes();
    },
    staleTime: Infinity,
  });

  const labelsIsLoading: boolean = isLoading;
  const labels = data
    ? [...data].sort((a, b) => {
        if (a.name.toLowerCase() < b.name.toLowerCase()) {
          return -1;
        }
        if (a.name.toLowerCase() > b.name.toLowerCase()) {
          return 1;
        }
        return 0;
      })
    : [];

  return { labelsIsLoading, labels };
}
export function useAllExternalRequestors() {
  const { isLoading, data } = useQuery({
    queryKey: [ticketExternalRequestors],
    queryFn: () => {
      return TicketsService.getAllExternalRequestors();
    },
    staleTime: Infinity,
  });

  const externalRequestorsIsLoading: boolean = isLoading;
  const externalRequestors = data
    ? [...data].sort((a, b) => {
        if (a.name.toLowerCase() < b.name.toLowerCase()) {
          return -1;
        }
        if (a.name.toLowerCase() > b.name.toLowerCase()) {
          return 1;
        }
        return 0;
      })
    : [];

  return { externalRequestorsIsLoading, externalRequestors };
}
export function useAllSchedules() {
  const { isLoading, data } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => {
      return TicketsService.getAllSchedules();
    },
    staleTime: 1 * (60 * 1000),
  });

  const schedulesIsLoading: boolean = isLoading;
  const schedules = data ?? [];

  return { schedulesIsLoading, schedules };
}

export function useAllIterations() {
  const { isLoading, data } = useQuery({
    queryKey: [ticketIterationsKey],
    queryFn: () => {
      return TicketsService.getAllIterations();
    },
    staleTime: Infinity,
  });

  const iterationsIsLoading: boolean = isLoading;
  const iterations = data
    ? [...data].sort((a, b) => a.name.localeCompare(b.name))
    : [];

  return { iterationsIsLoading, iterations };
}

export function useAllPriorityBuckets() {
  const { isLoading, data } = useQuery({
    queryKey: ['priority-buckets'],
    queryFn: () => {
      return TicketsService.getAllPriorityBuckets();
    },
    staleTime: 1 * (60 * 1000),
  });

  const priorityBucketsIsLoading: boolean = isLoading;
  const priorityBuckets = data ?? [];

  return { priorityBucketsIsLoading, priorityBuckets };
}

export function useAllAdditionalFieldsTypes() {
  const { isLoading, data } = useQuery({
    queryKey: ['additional-fields-types'],
    queryFn: () => {
      return TicketsService.getAllAdditionalFieldTypes();
    },
    staleTime: 1 * (60 * 1000),
  });

  const additionalFieldsIsLoading: boolean = isLoading;
  const additionalFieldTypes = data ? data.filter(a => a.display === true) : [];

  return { additionalFieldsIsLoading, additionalFieldTypes };
}

export function useAllAdditionalFieldsTypesValues() {
  const { isLoading, data } = useQuery({
    queryKey: ['additional-fields-types-values-list'],
    queryFn: () => {
      return TicketsService.getAllAdditionalFieldTypessWithValues();
    },
    staleTime: 1 * (60 * 1000),
  });

  const additionalFieldsTypesWithValuesIsLoading: boolean = isLoading;
  const additionalFieldsTypesWithValues = data ?? [];

  return {
    additionalFieldsTypesWithValuesIsLoading,
    additionalFieldsTypesWithValues,
  };
}

export const allTaskAssociationsOptions = () => {
  const queryKey = ['task-associations'];
  return queryOptions({
    queryKey,
    queryFn: () => TicketsService.getTaskAssociations(),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};

export function useAllTaskAssociations() {
  const { isLoading, data } = useQuery({
    ...allTaskAssociationsOptions(),
  });

  const taskAssociationsIsLoading: boolean = isLoading;
  const taskAssociationsData = data;

  return { taskAssociationsIsLoading, taskAssociationsData };
}

export function useAllTicketFilters() {
  const { isLoading, data } = useQuery({
    queryKey: ['ticket-filters'],
    queryFn: () => {
      return TicketsService.getAllTicketFilters();
    },
    staleTime: 1 * (60 * 1000),
  });

  const ticketFiltersIsLoading: boolean = isLoading;
  const ticketFilters = data ?? [];

  return { ticketFiltersIsLoading, ticketFilters };
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

export function useSearchTicketByTitleAndNumberPost() {
  const searchTicketMutation = useMutation({
    mutationFn: (params: {
      title: string;
      defaultConditions: SearchCondition[] | undefined;
    }) => {
      const { title, defaultConditions } = params;
      const titleCondition: SearchCondition = {
        key: 'title',
        operation: '=',
        condition: 'or',
        value: title,
      };
      const ticketNumberCondition: SearchCondition = {
        key: 'ticketNumber',
        operation: '=',
        condition: 'or',
        value: title,
      };
      let conditions: SearchConditionBody = { searchConditions: [] };
      if (defaultConditions) {
        conditions = { searchConditions: [...defaultConditions] };
      }
      if (title !== undefined && title !== '') {
        conditions.searchConditions.push(titleCondition, ticketNumberCondition);
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
