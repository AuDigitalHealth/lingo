import {
  DataTable,
  DataTableFilterEvent,
  DataTableSortEvent,
  DataTablePageEvent,
} from 'primereact/datatable';
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';

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
import {
  AssigneeItemTemplate,
  AssigneeTemplate,
  CreatedTemplate,
  IterationItemTemplate,
  IterationTemplate,
  LabelItemTemplate,
  LabelsTemplate,
  PriorityBucketTemplate,
  ScheduleItemTemplate,
  ScheduleTemplate,
  StateItemTemplate,
  StateTemplate,
  TaskAssocationTemplate,
  TitleTemplate,
} from './components/grid/Templates';
import useLocalTickets from './components/grid/useLocalTickets';
import { generateSearchConditions } from './components/grid/GenerateSearchConditions';
import TicketsActionBar from './components/TicketsActionBar';
import { JiraUser } from '../../types/JiraUserResponse';
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
  State,
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

export default function TicketsBacklog() {
  const {
    availableStates,
    clearPagedTickets,
    labelTypes,
    priorityBuckets,
    additionalFieldTypesOfListType,
    schedules,
    iterations,
    setSearchConditionsBody,
    searchConditionsBody,
  } = useTicketStore();
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

  const clearFilter = () => {
    handleFilterChange(undefined);
    initFilters();
  };

  useEffect(() => {
    initFilters();
  }, []);

  // These filter templates need to be here, it might appear as if they can be moved to their own files -
  // but, if they call hooks themselves, they create a render loop. So here they live.

  const titleFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
    return (
      <>
        <InputText
          value={
            // eslint-disable-next-line
            debouncedGlobalFilterValue != ''
              ? debouncedGlobalFilterValue
              : options.value
          }
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setGlobalFilterValue('');
            options.filterCallback(e.target.value);
          }}
          placeholder="Title Search"
        />
      </>
    );
  };

  const labelFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
    return (
      <>
        <div className="mb-3 font-bold">Label Picker</div>
        <MultiSelect
          // eslint-disable-next-line
          value={options.value}
          options={labelTypes}
          itemTemplate={LabelItemTemplate}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          optionLabel="name"
          placeholder="Any"
          className="p-column-filter"
        />
      </>
    );
  };

  const stateFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
    // push an empty element to the first part of the array
    const empty: State = {
      label:"Unassigned",
      description: "",
      id: -1,
      created: '',
      createdBy: ''
    };
    const statesWithEmpty = [...availableStates];
    if (
      statesWithEmpty.length > 0 &&
      statesWithEmpty[0].label !== ''
    ) {
      statesWithEmpty.unshift(empty);
    }
    return (
      <>
        <div className="mb-3 font-bold">Status Picker</div>
        <MultiSelect
          // eslint-disable-next-line
          value={options.value}
          options={statesWithEmpty}
          itemTemplate={StateItemTemplate}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          optionLabel="label"
          placeholder="Any"
          className="p-column-filter"
        />
      </>
    );
  };

  const assigneeFilterTemplate = (
    options: ColumnFilterElementTemplateOptions,
  ) => {
    // push an empty element to the first part of the array
    const empty: JiraUser = {
      emailAddress: '',
      displayName: '',
      active: false,
      key: '',
      name: 'Unassigned',
      avatarUrls: {
        '48x48': '',
        '24x24': '',
        '16x16': false,
        '32x32': '',
      },
    };
    const jiraUsersWithEmpty = [...jiraUsers];
    if (
      jiraUsersWithEmpty.length > 0 &&
      jiraUsersWithEmpty[0].displayName !== ''
    ) {
      jiraUsersWithEmpty.unshift(empty);
    }

    return (
      <>
        <div className="mb-3 font-bold">User Picker</div>
        <MultiSelect
          // eslint-disable-next-line
          value={options.value}
          options={jiraUsersWithEmpty}
          itemTemplate={AssigneeItemTemplate}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          optionLabel="name"
          placeholder="Any"
          className="p-column-filter"
        />
      </>
    );
  };

  const priorityFilterTemplate = (
    options: ColumnFilterElementTemplateOptions,
  ) => {
    return (
      <>
        <MultiSelect
          // eslint-disable-next-line
          value={options.value}
          options={priorityBuckets}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          optionLabel="name"
          placeholder="Any"
          className="p-column-filter"
        />
      </>
    );
  };

  const scheduleFilterTemplate = (
    options: ColumnFilterElementTemplateOptions,
  ) => {
    return (
      <>
        <MultiSelect
          // eslint-disable-next-line
          value={options.value}
          options={schedules}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          itemTemplate={ScheduleItemTemplate}
          optionLabel="name"
          placeholder="Any"
          className="p-column-filter"
        />
      </>
    );
  };

  const iterationFilterTemplate = (
    options: ColumnFilterElementTemplateOptions,
  ) => {
    return (
      <>
        <MultiSelect
          // eslint-disable-next-line
          value={options.value}
          options={iterations}
          itemTemplate={IterationItemTemplate}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          optionLabel="name"
          placeholder="Any"
          className="p-column-filter"
        />
      </>
    );
  };

  const taskAssociationFilterTemplate = (
    options: ColumnFilterElementTemplateOptions,
  ) => {
    return (
      <>
        <Dropdown
          // eslint-disable-next-line
          value={options.value}
          options={allTasks}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          optionLabel="key"
          placeholder="Task"
          className="p-column-filter"
        />
      </>
    );
  };

  const dateFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
    return (
      <Calendar
        // eslint-disable-next-line
        value={options.value}
        onChange={e => options.filterCallback(e.value, options.index)}
        selectionMode={'single'}
        readOnlyInput
        dateFormat="dd/mm/yy"
        placeholder="dd/mm/yyyy"
        mask="99/99/9999"
      />
    );
  };

  const dateFilterTemplateRange = (
    options: ColumnFilterElementTemplateOptions,
  ) => {
    return (
      <Calendar
        // eslint-disable-next-line
        value={options.value}
        onChange={e => options.filterCallback(e.value, options.index)}
        selectionMode={'range'}
        readOnlyInput
        dateFormat="dd/mm/yy"
        placeholder="dd/mm/yyyy"
        mask="99/99/9999"
      />
    );
  };

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

  return (
    <>
      <TicketsActionBar />
      <DataTable
        value={localTickets}
        lazy
        dataKey="id"
        paginator
        first={lazyState.first}
        rows={20}
        totalRecords={totalRecords}
        size="small"
        onSort={onSortChange}
        sortField={lazyState.sortField}
        sortOrder={lazyState.sortOrder}
        onFilter={handleFilterChange}
        filters={lazyState.filters}
        loading={loading}
        onPage={onPaginationChange}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        emptyMessage="No Tickets Found"
        header={header}
      >
        <Column
          field="priorityBucket"
          header="Priority"
          sortable
          filter
          filterPlaceholder="Search by Priority"
          body={PriorityBucketTemplate}
          filterElement={priorityFilterTemplate}
          showFilterMatchModes={false}
        />
        <Column
          field="title"
          header="Title"
          sortable
          filter
          filterPlaceholder="Search by Title"
          showFilterMatchModes={false}
          style={{ minWidth: '14rem' }}
          body={TitleTemplate}
          filterElement={titleFilterTemplate}
        />
        <Column
          field="schedule"
          header="Schedule"
          sortable
          filter
          filterPlaceholder="Search by Schedule"
          body={ScheduleTemplate}
          filterElement={scheduleFilterTemplate}
          showFilterMatchModes={false}
        />
        <Column
          field="iteration"
          header="Release"
          sortable
          filter
          filterPlaceholder="Search by Release"
          body={IterationTemplate}
          filterElement={iterationFilterTemplate}
          showFilterMatchModes={false}
        />
        <Column
          field="state"
          header="Status"
          sortable
          filter
          filterPlaceholder="Search by Status"
          filterField="state"
          body={StateTemplate}
          filterElement={stateFilterTemplate}
          showFilterMatchModes={false}
        />
        <Column
          field="labels"
          header="Labels"
          filter
          filterPlaceholder="Search by Label"
          maxConstraints={1}
          body={LabelsTemplate}
          filterElement={labelFilterTemplate}
          showFilterMatchModes={false}
        />
        <Column
          field="taskAssociation"
          header="Task"
          sortable
          filter
          filterPlaceholder="Search by Task"
          body={TaskAssocationTemplate}
          showFilterMatchModes={false}
          filterElement={taskAssociationFilterTemplate}
        />
        <Column
          field="assignee"
          header="Assignee"
          sortable
          filter
          filterField="assignee"
          filterPlaceholder="Search by Assignee"
          filterElement={assigneeFilterTemplate}
          body={AssigneeTemplate}
          showFilterMatchModes={false}
          filterMenuStyle={{ width: '14rem' }}
          style={{ minWidth: '14rem' }}
        />
        {createdCalenderAsRange ? (
          <Column
            field="created"
            header="Created"
            dataType="date"
            sortable
            filter
            filterPlaceholder="Search by Date"
            body={CreatedTemplate}
            filterElement={dateFilterTemplateRange}
            onFilterMatchModeChange={e => {
              if (
                e.matchMode === FilterMatchMode.DATE_IS ||
                e.matchMode === FilterMatchMode.DATE_IS_NOT
              ) {
                setCreatedCalenderAsRange(true);
              } else {
                setCreatedCalenderAsRange(false);
              }
            }}
          />
        ) : (
          <Column
            field="created"
            header="Created"
            dataType="date"
            sortable
            filter
            filterPlaceholder="Search by Date"
            body={CreatedTemplate}
            filterElement={dateFilterTemplate}
            onFilterMatchModeChange={e => {
              if (e.matchMode !== FilterMatchMode.EQUALS) {
                setCreatedCalenderAsRange(false);
              } else {
                setCreatedCalenderAsRange(true);
              }
            }}
          />
        )}
      </DataTable>
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
