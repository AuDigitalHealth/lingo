import {
  ChangeEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import {
  generateDefaultTicketTableLazyState,
  LazyTicketTableState,
} from '../../types/tickets/table';
import { TicketsBacklogView } from './components/grid/TicketsBacklogView';
import { useSearchTickets } from './components/grid/useLocalTickets';
import useTicketStore from '../../stores/TicketStore';
import { useJiraUsers } from '../../hooks/api/useInitializeJiraUsers';
import {
  DataTableFilterEvent,
  DataTablePageEvent,
  DataTableSortEvent,
} from 'primereact/datatable';
import { useAllStates } from '../../hooks/api/useInitializeTickets';
import useUserStore from '../../stores/UserStore';
import { InputText } from 'primereact/inputtext';
import { Box, Stack, Typography } from '@mui/material';
import useDebounce from '../../hooks/useDebounce';
import TicketsActionBar from './components/TicketsActionBar';
import { Route, Routes } from 'react-router-dom';
import TicketDrawer from './components/grid/TicketDrawer';
import { Button } from 'primereact/button';
import { defaultTableFields } from './helpers/backlog';

// a pre filtered list for open tickets where the logged in user is the assignee
export default function MyBacklog() {
  const ticketStore = useTicketStore();
  const { searchTickets, loading, localTickets, totalRecords } =
    useSearchTickets();
  const { availableStates } = useAllStates();
  const { jiraUsers } = useJiraUsers();
  const { login } = useUserStore();

  const defaultLazyState = useMemo(() => {
    const tempLazyState = generateDefaultTicketTableLazyState();
    const user = jiraUsers.find(user => {
      return user.name === login;
    });
    const closedState = availableStates.find(state => {
      return state.label.toLowerCase() === 'closed';
    });
    if (tempLazyState.filters.assignee && user) {
      tempLazyState.filters.assignee.value = [user];
    }
    if (tempLazyState.filters.state && closedState) {
      tempLazyState.filters.state.matchMode = 'notEquals';
      tempLazyState.filters.state.value = [closedState];
    }

    tempLazyState.sortField = 'ticketNumber';
    tempLazyState.sortOrder = -1;

    return tempLazyState;
  }, [jiraUsers, login, availableStates]);

  const [lazyState, setlazyState] =
    useState<LazyTicketTableState>(defaultLazyState);

  const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
  const debouncedGlobalFilterValue = useDebounce(globalFilterValue, 400);

  // Refs for height calculation
  const containerRef = useRef<HTMLDivElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const actionBarRef = useRef<HTMLDivElement>(null);
  const tableHeaderRef = useRef<HTMLDivElement>(null);
  const [backlogHeight, setBacklogHeight] = useState(0);

  useLayoutEffect(() => {
    if (
      containerRef.current &&
      titleContainerRef.current &&
      actionBarRef.current &&
      tableHeaderRef.current
    ) {
      const containerHeight = containerRef.current.clientHeight;
      const actionBarHeight = actionBarRef.current.clientHeight;
      const tableHeaderHeight = tableHeaderRef.current.clientHeight;

      // Get the title height including margin
      const titleHeight = titleContainerRef.current.offsetHeight;
      const titleStyles = window.getComputedStyle(titleContainerRef.current);
      const titleMarginBottom = parseInt(titleStyles.marginBottom);

      setBacklogHeight(
        containerHeight -
          actionBarHeight -
          tableHeaderHeight -
          titleHeight -
          titleMarginBottom,
      );
    }
  }, [containerRef, titleContainerRef, actionBarRef, tableHeaderRef]);

  // to search once on initial load
  useEffect(() => {
    searchTickets(lazyState, debouncedGlobalFilterValue);
    // eslint-disable-next-line
  }, [debouncedGlobalFilterValue]);

  const onGlobalFilterChange = useCallback(
    (value: string) => {
      setGlobalFilterValue(value);
    },
    [setGlobalFilterValue],
  );

  const onSortChange = (event: DataTableSortEvent) => {
    const tempLazyState = {
      ...lazyState,
      sortField: event.sortField,
      sortOrder: event.sortOrder,
    };
    setlazyState(tempLazyState);
    searchTickets(tempLazyState, debouncedGlobalFilterValue);
  };

  const onPaginationChange = (event: DataTablePageEvent) => {
    const tempLazyState = {
      ...lazyState,
      page: event.page ? event.page : 0,
      first: event.first,
      rows: event.rows,
    };
    setlazyState(tempLazyState);
    searchTickets(tempLazyState, debouncedGlobalFilterValue);
  };

  const clearFilter = useCallback(() => {
    handleFilterChange(undefined);
    // eslint-disable-next-line
  }, []);

  const handleFilterChange = (event: DataTableFilterEvent | undefined) => {
    if (event == undefined) {
      ticketStore.clearPagedTickets();
      setlazyState(defaultLazyState);
      searchTickets(defaultLazyState, debouncedGlobalFilterValue);
      return;
    }
    const tempLazyState = { ...lazyState, filters: event.filters };
    setlazyState(tempLazyState);
    searchTickets(tempLazyState, debouncedGlobalFilterValue);
  };

  const header = useMemo(() => {
    return (
      <div ref={tableHeaderRef}>
        <MyBacklogHeader
          onGlobalFilterChange={onGlobalFilterChange}
          globalFilterValue={globalFilterValue}
          clearFilter={clearFilter}
        />
      </div>
    );
  }, [onGlobalFilterChange, globalFilterValue, clearFilter]);

  return (
    <>
      <Stack sx={{ height: '100%' }} ref={containerRef}>
        <Box ref={titleContainerRef} sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            My Backlog
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tickets assigned to me (excluding closed tickets)
          </Typography>
        </Box>
        <div ref={actionBarRef}>
          <TicketsActionBar createTaskEnabled createTicketEnabled />
        </div>

        <TicketsBacklogView
          height={backlogHeight}
          header={header}
          ticketStore={ticketStore}
          fields={defaultTableFields}
          selectable={false}
          totalRecords={totalRecords}
          tickets={localTickets}
          loading={loading}
          lazyState={lazyState}
          selectedTickets={null}
          onSortChange={onSortChange}
          debouncedGlobalFilterValue={debouncedGlobalFilterValue}
          setGlobalFilterValue={() => {
            return;
          }}
          handleFilterChange={handleFilterChange}
          onPaginationChange={onPaginationChange}
          createdCalenderAsRange={false}
          setCreatedCalenderAsRange={() => {
            return;
          }}
        />
      </Stack>
      <Routes>
        <Route path="/individual/:ticketNumber" element={<TicketDrawer />} />
        <Route path="" element={<></>} />
      </Routes>
    </>
  );
}

interface MyBacklogHeaderProps {
  globalFilterValue: string;
  onGlobalFilterChange: (event: ChangeEvent<HTMLInputElement>) => void;
  clearFilter: () => void;
}

const MyBacklogHeader = ({
  globalFilterValue,
  onGlobalFilterChange,
  clearFilter,
}: MyBacklogHeaderProps) => {
  return (
    <>
      <Stack flexDirection={'row'} gap={1}>
        <Button
          data-testid="backlog-filter-clear"
          type="button"
          icon="pi pi-filter-slash"
          label="Clear"
          disabled={false}
          outlined
          onClick={clearFilter}
        />

        <IconField iconPosition="left" style={{ marginLeft: 'auto' }}>
          <InputIcon className="pi pi-search" />
          <InputText
            id="my-backlog-quick-search"
            value={globalFilterValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onGlobalFilterChange(e.target.value)
            }
            placeholder="Quick Search"
          />
        </IconField>
      </Stack>
    </>
  );
};
