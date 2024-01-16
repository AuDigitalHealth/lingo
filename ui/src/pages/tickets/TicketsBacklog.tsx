import {
  DataTable,
  DataTableFilterEvent,
  DataTableSortEvent,
  DataTableFilterMeta,
  DataTablePageEvent,
} from 'primereact/datatable';
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';

import useJiraUserStore from '../../stores/JiraUserStore';
import { useEffect, useState } from 'react';
import useTicketStore from '../../stores/TicketStore';
import { TicketDataTableFilters } from '../../types/tickets/table';
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
  ScheduleTemplate,
  StateItemTemplate,
  StateTemplate,
  TaskAssocationTemplate,
  TitleTemplate,
} from './components/grid/Templates';
import useLocalTickets from './components/grid/useLocalTickets';
import { generateSearchConditions } from './components/grid/GenerateSearchConditions';
import TicketsActionBar from './components/TicketsActionBar';

const defaultFilters: DataTableFilterMeta = {
  priorityBucket: { value: null, matchMode: FilterMatchMode.EQUALS },
  title: { value: null, matchMode: FilterMatchMode.CONTAINS },
  schedule: { value: null, matchMode: FilterMatchMode.EQUALS },
  iteration: { value: null, matchMode: FilterMatchMode.EQUALS },
  state: { value: null, matchMode: FilterMatchMode.EQUALS },
  labels: {
    operator: FilterOperator.AND,
    constraints: [{ value: null, matchMode: FilterMatchMode.IN }],
  },
  taskAssociation: { value: null, matchMode: FilterMatchMode.EQUALS },
  assignee: { value: null, matchMode: FilterMatchMode.EQUALS },
  created: {
    value: null,
    matchMode: FilterMatchMode.DATE_IS,
  },
};

const defaultLazyState: LazyTableState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: '',
  sortOrder: 0,
  filters: defaultFilters,
};

export interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: 0 | 1 | -1 | null | undefined;
  filters: TicketDataTableFilters;
}

export default function TicketsBacklog() {
  const {
    availableStates,
    clearPagedTickets,
    labelTypes,
    priorityBuckets,
    additionalFieldTypesOfListType,
    iterations,
    setSearchConditionsBody,
  } = useTicketStore();
  const { allTasks } = useTaskStore();
  const { jiraUsers } = useJiraUserStore();

  const [lazyState, setlazyState] = useState<LazyTableState>(defaultLazyState);
  const { loading, localTickets, totalRecords } = useLocalTickets(lazyState);

  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const debouncedGlobalFilterValue = useDebounce(globalFilterValue, 1000);

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
    return (
      <>
        <div className="mb-3 font-bold">Status Picker</div>
        <Dropdown
          // eslint-disable-next-line
          value={options.value}
          options={availableStates}
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
    return (
      <>
        <div className="mb-3 font-bold">User Picker</div>
        <MultiSelect
          // eslint-disable-next-line
          value={options.value}
          options={jiraUsers}
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
        <Dropdown
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
    const schedules = additionalFieldTypesOfListType.filter(aft => {
      return aft.typeName.toLowerCase() === 'schedule';
    })[0].values;
    return (
      <>
        <Dropdown
          // eslint-disable-next-line
          value={options.value}
          options={schedules}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          optionLabel="valueOf"
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
        <Dropdown
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
        selectionMode="range"
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
      setSearchConditionsBody(undefined);
      clearPagedTickets();
      setlazyState(defaultLazyState);
      return;
    }

    setlazyState({ ...lazyState, filters: event.filters });
  };

  useEffect(() => {
    const conditions = generateSearchConditions(
      lazyState,
      debouncedGlobalFilterValue,
    );

    setSearchConditionsBody(conditions);
  }, [lazyState, debouncedGlobalFilterValue]);

  const onSortChange = (event: DataTableSortEvent) => {
    setlazyState({
      ...lazyState,
      sortField: event.sortField,
      sortOrder: event.sortOrder,
    });
  };

  // overwrites the value for the title filter, as well as creates a comment filter
  const onGlobalFilterChange = (value: string) => {
    setGlobalFilterValue(value);
  };

  const onPaginationChange = (event: DataTablePageEvent) => {
    setlazyState({
      ...lazyState,
      page: event.page ? event.page : 0,
      first: event.first,
      rows: event.rows,
    });
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-content-between">
        <Button
          type="button"
          icon="pi pi-filter-slash"
          label="Clear"
          outlined
          onClick={clearFilter}
        />
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
    );
  };

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
        <Column
          field="created"
          header="Created"
          dataType="date"
          sortable
          filter
          filterPlaceholder="Search by Date"
          body={CreatedTemplate}
          filterElement={dateFilterTemplate}
        />
      </DataTable>
    </>
  );
}
