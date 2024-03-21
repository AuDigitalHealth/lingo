import {
  DataTableFilterEvent,
  DataTableSortEvent,
  DataTablePageEvent,
} from 'primereact/datatable';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';

import useJiraUserStore from '../../stores/JiraUserStore';
import { SyntheticEvent, useCallback, useEffect, useState } from 'react';
import useTicketStore from '../../stores/TicketStore';
import {
  LazyTicketTableState,
  generateDefaultTicketTableLazyState,
  hasFiltersChanged,
  hasSortChanged,
} from '../../types/tickets/table';
import useTaskStore from '../../stores/TaskStore';
import useDebounce from '../../hooks/useDebounce';
import useLocalTickets from './components/grid/useLocalTickets';
import { generateSearchConditions } from './components/grid/GenerateSearchConditions';
import TicketsActionBar from './components/TicketsActionBar';
import { Box, Stack } from '@mui/system';
import BaseModal from '../../components/modal/BaseModal';
import BaseModalHeader from '../../components/modal/BaseModalHeader';
import BaseModalBody from '../../components/modal/BaseModalBody';
import {
  Autocomplete,
  AutocompleteInputChangeReason,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Button as MuiButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import BaseModalFooter from '../../components/modal/BaseModalFooter';
import {
  AutocompleteGroupOption,
  AutocompleteGroupOptionType,
  TicketFilter,
} from '../../types/tickets/ticket';
import {
  useCreateTicketFilter,
  useUpdateTicketFilter,
} from '../../hooks/api/tickets/useUpdateTicketFilters';
import { useQueryClient } from '@tanstack/react-query';
import { snomioErrorHandler } from '../../types/ErrorHandler';
import {
  generateFilterConditions,
  generateOrderConditions,
} from './components/grid/GenerateFilterConditions';
import { SearchConditionBody } from '../../types/tickets/search';
import { TicketsBacklogView } from './components/grid/TicketsBacklogView';

const defaultFields = [
  'priorityBucket',
  'title',
  'schedule',
  'iteration',
  'state',
  'labels',
  'taskAssociation',
  'assignee',
  'created',
];

export default function TicketsBacklog() {
  const ticketStore = useTicketStore();
  const {
    availableStates,
    clearPagedTickets,
    labelTypes,
    priorityBuckets,
    schedules,
    iterations,
    setSearchConditionsBody,
    searchConditionsBody,
  } = ticketStore;
  const { allTasks } = useTaskStore();
  const { jiraUsers } = useJiraUserStore();

  const [lazyState, setlazyState] = useState<LazyTicketTableState>(
    generateDefaultTicketTableLazyState(),
  );
  const { loading, localTickets, totalRecords } = useLocalTickets(lazyState);

  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const debouncedGlobalFilterValue = useDebounce(globalFilterValue, 1000);

  const [disabled, setDisabled] = useState(true);

  const [createdCalenderAsRange, setCreatedCalenderAsRange] = useState(true);

  useEffect(() => {
    const filters = lazyState.filters;
    setDisabled(
      !(
        hasFiltersChanged(filters) ||
        hasSortChanged(lazyState.sortField, lazyState.sortOrder)
      ),
    );
  }, [lazyState]);

  const initFilters = () => {
    setGlobalFilterValue('');
  };

  const clearFilter = useCallback(() => {
    handleFilterChange(undefined);
    initFilters();
  }, []);

  useEffect(() => {
    initFilters();
  }, []);

  const handleFilterChange = (event: DataTableFilterEvent | undefined) => {
    if (event == undefined) {
      initFilters();
      setSearchConditionsBody({ searchConditions: [] });
      clearPagedTickets();
      setlazyState(generateDefaultTicketTableLazyState());
      return;
    }

    setlazyState({ ...lazyState, filters: event.filters });
  };

  useEffect(() => {
    const conditions = generateSearchConditions(
      lazyState,
      debouncedGlobalFilterValue,
    );

    console.log(lazyState.filters);

    setSearchConditionsBody(conditions);
  }, [lazyState, debouncedGlobalFilterValue, setSearchConditionsBody]);

  const onSortChange = (event: DataTableSortEvent) => {
    setlazyState({
      ...lazyState,
      sortField: event.sortField,
      sortOrder: event.sortOrder,
    });
  };

  // overwrites the value for the title filter, as well as creates a comment filter
  const onGlobalFilterChange = useCallback(
    (value: string) => {
      setGlobalFilterValue(value);
    },
    [setGlobalFilterValue],
  );

  const onPaginationChange = (event: DataTablePageEvent) => {
    setlazyState({
      ...lazyState,
      page: event.page ? event.page : 0,
      first: event.first,
      rows: event.rows,
    });
  };

  const handleSavedFilterLoad = useCallback((ticketFilter: TicketFilter) => {
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
    setlazyState({
      ...lazyState,
      filters: generatedFilters,
      sortField: sortField,
      sortOrder: sortOrder,
    });
  }, []);

  const renderHeader = useCallback(() => {
    return (
      <TicketTableHeader
        disabled={disabled}
        clearFilter={clearFilter}
        globalFilterValue={globalFilterValue}
        onGlobalFilterChange={onGlobalFilterChange}
        filters={searchConditionsBody}
        loadSavedFilter={handleSavedFilterLoad}
      />
    );
  }, [
    globalFilterValue,
    disabled,
    clearFilter,
    onGlobalFilterChange,
    searchConditionsBody,
    handleSavedFilterLoad,
  ]);

  const header = renderHeader();
  console.log(lazyState);
  return (
    <>
      <TicketsActionBar />
      <TicketsBacklogView
        fields={defaultFields}
        tickets={localTickets}
        totalRecords={totalRecords}
        loading={loading}
        lazyState={lazyState}
        onSortChange={onSortChange}
        handleFilterChange={handleFilterChange}
        onPaginationChange={onPaginationChange}
        header={header}
        ticketStore={ticketStore}
        debouncedGlobalFilterValue={debouncedGlobalFilterValue}
        setGlobalFilterValue={setGlobalFilterValue}
        createdCalenderAsRange={createdCalenderAsRange}
        setCreatedCalenderAsRange={setCreatedCalenderAsRange}
        jiraUsers={jiraUsers}
        allTasks={allTasks}
      />
      {/* <UserDefinedTables /> */}
    </>
  );
}

interface TicketTableHeaderProps {
  disabled: boolean;
  clearFilter: () => void;
  globalFilterValue: string;
  onGlobalFilterChange: (value: string) => void;
  filters?: SearchConditionBody;
  loadSavedFilter: (ticketFilter: TicketFilter) => void;
}

// should maybe handle the disabled state internally
function TicketTableHeader({
  disabled,
  clearFilter,
  globalFilterValue,
  onGlobalFilterChange,
  filters,
  loadSavedFilter,
}: TicketTableHeaderProps) {
  const [saveFilterModalOpen, setSaveFilterModalOpen] = useState(false);
  const [loadFilterModalOpen, setLoadFilterModalOpen] = useState(false);

  return (
    <>
      {saveFilterModalOpen && (
        <SaveFilterModal
          modalOpen={saveFilterModalOpen}
          setModalOpen={setSaveFilterModalOpen}
          filters={filters}
        />
      )}
      {loadFilterModalOpen && (
        <LoadFilterModal
          modalOpen={loadFilterModalOpen}
          setModalOpen={setLoadFilterModalOpen}
          loadSavedFilter={loadSavedFilter}
        />
      )}

      <div className="flex justify-content-between">
        <Stack flexDirection={'row'} gap={1}>
          <Button
            type="button"
            icon="pi pi-filter-slash"
            label="Clear"
            disabled={disabled}
            outlined
            onClick={clearFilter}
          />
          <Button
            type="button"
            icon="pi pi-save"
            label="Load Filter"
            // disabled={disabled}
            outlined
            onClick={() => setLoadFilterModalOpen(!loadFilterModalOpen)}
          />
          <Button
            type="button"
            icon="pi pi-save"
            label="Save Filter"
            disabled={disabled}
            outlined
            onClick={() => setSaveFilterModalOpen(!saveFilterModalOpen)}
          />
        </Stack>
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onGlobalFilterChange(e.target.value)
            }
            placeholder="Quick Search"
          />
        </span>
      </div>
    </>
  );
}

interface SaveFilterModalProps {
  modalOpen: boolean;
  setModalOpen: (modalOpen: boolean) => void;
  filters?: SearchConditionBody;
}
function SaveFilterModal({
  modalOpen,
  setModalOpen,
  filters,
}: SaveFilterModalProps) {
  const [value, setValue] = useState<AutocompleteGroupOption>({
    name: '',
    group: AutocompleteGroupOptionType.New,
  });
  const { ticketFilters } = useTicketStore();
  const postMutation = useCreateTicketFilter();
  const { data: postData, isError: postIsError } = postMutation;
  const putMutation = useUpdateTicketFilter();
  const { data: putData, isError: putIsError } = putMutation;

  const theme = useTheme();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (postIsError) {
      snomioErrorHandler({
        status: 204,
        title: '',
        type: '',
        detail: '',
        message: '',
        name: '',
      });
    }
    if (postData) {
      void queryClient.invalidateQueries({ queryKey: ['ticket-filters'] });
      setModalOpen(false);
    }
  }, [postData, postIsError, queryClient, setModalOpen]);

  useEffect(() => {
    if (putIsError) {
      snomioErrorHandler({
        status: 204,
        title: '',
        type: '',
        detail: '',
        message: '',
        name: '',
      });
    }
    if (putData) {
      void queryClient.invalidateQueries({ queryKey: ['ticket-filters'] });
      setModalOpen(false);
    }
  }, [putData, putIsError, queryClient, setModalOpen]);

  const saveFilter = () => {
    const existing = ticketFilters.find(filter => {
      return filter.name === value.name;
    });

    if (existing === undefined) {
      postMutation.mutate({
        name: value.name,
        filter: filters as SearchConditionBody,
      });
    } else {
      existing.filter = filters as SearchConditionBody;
      putMutation.mutate({ id: existing.id, ticketFilter: existing });
    }
  };

  const onChange = (
    e: SyntheticEvent<Element, Event>,
    newValue: string | AutocompleteGroupOption | null,
  ) => {
    if (typeof newValue === 'string') {
      setValue({ name: newValue, group: AutocompleteGroupOptionType.New });
    } else {
      if (newValue?.name === undefined) {
        return;
      }
      setValue({
        name: newValue?.name,
        group: AutocompleteGroupOptionType.Existing,
      });
    }
  };

  const onInputChange = (
    event: SyntheticEvent<Element, Event>,
    value: string,
    // eslint-disable-next-line
    reason: AutocompleteInputChangeReason,
  ) => {
    setValue({ name: value, group: AutocompleteGroupOptionType.New });
  };

  const mapToFilterOptions = (ticketFilters: TicketFilter[]) => {
    return ticketFilters.map(filter => {
      return {
        name: filter.name,
        group: AutocompleteGroupOptionType.Existing,
      };
    });
  };

  const isExistingName = () => {
    return (
      value.name !== '' &&
      ticketFilters?.find(filter => {
        return filter.name === value.name;
      }) !== undefined
    );
  };
  return (
    <BaseModal open={modalOpen} handleClose={() => setModalOpen(!modalOpen)}>
      <BaseModalHeader title={'Save Filter'} />
      <BaseModalBody sx={{ paddingTop: '2.5em', paddingBottom: '2.5em' }}>
        {!filters ? (
          <Typography>No Filters selected</Typography>
        ) : (
          <Autocomplete
            autoSelect
            freeSolo
            sx={{ width: '100%' }}
            groupBy={option => option.group}
            options={mapToFilterOptions(ticketFilters)}
            getOptionLabel={option => {
              if (typeof option === 'string') {
                return option;
              } else {
                return option.name;
              }
            }}
            value={value}
            onChange={onChange}
            onInputChange={onInputChange}
            renderInput={params => (
              <TextField
                {...params}
                label={'Select or enter a new filter name'}
              />
            )}
          />
        )}
        <Box p={1}>
          {isExistingName() ? (
            <Box>
              <span style={{ color: `${theme.palette.warning.darker}` }}>
                Warning!: This will override the existing data{' '}
              </span>
            </Box>
          ) : (
            <div />
          )}
        </Box>
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <MuiButton
            color={isExistingName() ? 'warning' : 'primary'}
            size="small"
            variant="contained"
            onClick={saveFilter}
            disabled={value.name === ''}
          >
            {isExistingName() ? 'Update ' : 'Add '}Filter
          </MuiButton>
        }
      />
    </BaseModal>
  );
}

interface LoadFilterModalProps {
  modalOpen: boolean;
  setModalOpen: (modalOpen: boolean) => void;
  loadSavedFilter: (filter: TicketFilter) => void;
}

function LoadFilterModal({
  modalOpen,
  setModalOpen,
  loadSavedFilter,
}: LoadFilterModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const { ticketFilters } = useTicketStore();

  const handleApplyFilter = () => {
    if (selectedFilter === '') return;

    const newFilter = ticketFilters.find(filter => {
      return filter.name === selectedFilter;
    });
    if (newFilter === undefined) return;

    loadSavedFilter(newFilter);
    setModalOpen(false);
  };

  return (
    <BaseModal open={modalOpen} handleClose={() => setModalOpen(!modalOpen)}>
      <BaseModalHeader title={'Save Filter'} />
      <BaseModalBody sx={{ paddingTop: '2.5em', paddingBottom: '2.5em' }}>
        <Select
          value={selectedFilter || ''}
          onChange={e => setSelectedFilter(e.target.value)}
          sx={{ width: '100%' }}
        >
          {ticketFilters.map((filter, index) => (
            <MenuItem key={index} value={filter.name}>
              {filter.name}
            </MenuItem>
          ))}
        </Select>
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <MuiButton
            color={'primary'}
            size="small"
            variant="contained"
            onClick={handleApplyFilter}
            disabled={selectedFilter === ''}
          >
            Apply Filter
          </MuiButton>
        }
      />
    </BaseModal>
  );
}
