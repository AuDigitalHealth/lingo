import { useEffect, useRef, useState } from 'react';
import {
  TicketFilter,
  UiSearchConfiguration,
} from '../../../../types/tickets/ticket';
import { TicketsBacklogView } from './TicketsBacklogView';
import { LazyTicketTableState } from '../../../../types/tickets/table';
import {
  generateFilterConditions,
  generateOrderConditions,
} from './GenerateFilterConditions';
import useTicketStore from '../../../../stores/TicketStore';
import useTaskStore from '../../../../stores/TaskStore';
import useJiraUserStore from '../../../../stores/JiraUserStore';
import {
  DataTableFilterEvent,
  DataTablePageEvent,
  DataTableSortEvent,
} from 'primereact/datatable';
import { useLocalTicketsLazyState } from './useLocalTickets';
import { Stack } from '@mui/material';

interface UserDefinedTicketTableProps {
  uiSearchConfiguration: UiSearchConfiguration;
}

const shortendFields = ['priorityBucket', 'title', 'schedule', 'state'];

export function UserDefinedTicketTable({
  uiSearchConfiguration,
}: UserDefinedTicketTableProps) {
  const ticketStore = useTicketStore();
  const {
    availableStates,
    labelTypes,
    priorityBuckets,
    schedules,
    iterations,
  } = ticketStore;
  const { allTasks } = useTaskStore();
  const { jiraUsers } = useJiraUserStore();

  const generateFiltersFirstLoad = (
    ticketFilter: TicketFilter,
  ): LazyTicketTableState => {
    const chosenFilter = ticketFilter;

    const generatedFilters = generateFilterConditions(
      chosenFilter.filter,
      priorityBuckets,
      iterations,
      availableStates,
      labelTypes,
      allTasks,
      jiraUsers,
      schedules,
    );

    const { sortField, sortOrder } = generateOrderConditions(
      chosenFilter.filter.orderCondition,
    );

    return {
      first: 0,
      rows: 20,
      page: 0,
      filters: generatedFilters,
      sortField: sortField,
      sortOrder: sortOrder,
    };
  };

  const [lazyState, setlazyState] = useState<LazyTicketTableState>(
    generateFiltersFirstLoad(uiSearchConfiguration.filter),
  );
  const { totalRecords, localTickets, loading } = useLocalTicketsLazyState({
    lazyState,
  });

  useEffect(() => {
    if (localTickets) {
      console.log('sum tickets');
    }
  }, [localTickets]);
  const onSortChange = (event: DataTableSortEvent) => {
    setlazyState({
      ...lazyState,
      sortField: event.sortField,
      sortOrder: event.sortOrder,
    });
  };

  const handleFilterChange = (event: DataTableFilterEvent | undefined) => {
    if (event === undefined) return;
    setlazyState({ ...lazyState, filters: event.filters });
  };

  const onPaginationChange = (event: DataTablePageEvent) => {
    setlazyState({
      ...lazyState,
      page: event.page ? event.page : 0,
      first: event.first,
      rows: event.rows,
    });
  };

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Stack ref={containerRef}>
      <TicketsBacklogView
        fields={shortendFields}
        totalRecords={totalRecords}
        lazyState={lazyState}
        loading={loading}
        onSortChange={onSortChange}
        ticketStore={ticketStore}
        debouncedGlobalFilterValue=""
        // eslint-disable-next-line
        setGlobalFilterValue={() => {}}
        handleFilterChange={handleFilterChange}
        tickets={localTickets}
        jiraUsers={jiraUsers}
        allTasks={allTasks}
        onPaginationChange={onPaginationChange}
        createdCalenderAsRange={false}
        // eslint-disable-next-line
        setCreatedCalenderAsRange={() => {}}
      />
    </Stack>
  );
}
