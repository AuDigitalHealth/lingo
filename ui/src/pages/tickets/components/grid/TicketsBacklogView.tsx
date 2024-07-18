import {
  DataTable,
  DataTableDataSelectableEvent,
  DataTableFilterEvent,
  DataTablePageEvent,
  DataTableSelectionMultipleChangeEvent,
  DataTableSortEvent,
} from 'primereact/datatable';
import { LazyTicketTableState } from '../../../../types/tickets/table';
import {
  Iteration,
  PriorityBucket,
  Schedule,
  State,
  Ticket,
} from '../../../../types/tickets/ticket';
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { Task } from '../../../../types/task';
import {
  AssigneeItemTemplate,
  AssigneeTemplate,
  CreatedTemplate,
  ExternalRequestorItemTemplate,
  ExternalRequestorsTemplate,
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
} from './Templates';
import { JiraUser } from '../../../../types/JiraUserResponse';
import { TicketStoreConfig } from '../../../../stores/TicketStore';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { Dispatch, SetStateAction, useCallback } from 'react';

interface TicketsBacklogViewProps {
  // the ref of the parent container
  height?: number;
  // whethere the table's rows can be selected or not
  selectable: boolean;
  // what columns to render
  fields: string[];
  // whether to render pagination, filters, sorts etc
  minimal?: boolean;
  // tickets & paged information
  tickets?: Ticket[];
  totalRecords: number;
  loading: boolean;
  // datatable specific items, mostly for expanded view
  lazyState: LazyTicketTableState;
  onSortChange: (event: DataTableSortEvent) => void;
  handleFilterChange: (event: DataTableFilterEvent | undefined) => void;
  onPaginationChange: (event: DataTablePageEvent) => void;
  header?: JSX.Element;
  //
  ticketStore: TicketStoreConfig;
  debouncedGlobalFilterValue: string;
  setGlobalFilterValue: (val: string) => void;
  createdCalenderAsRange: boolean;
  setCreatedCalenderAsRange: (val: boolean) => void;
  jiraUsers: JiraUser[];
  allTasks: Task[];
  width?: number;
  selectedTickets: Ticket[] | null;
  setSelectedTickets: Dispatch<SetStateAction<Ticket[] | null>>;
}

export function TicketsBacklogView({
  height,
  selectable,
  selectedTickets,
  setSelectedTickets,
  fields,
  minimal = false,
  tickets,
  totalRecords,
  loading,
  lazyState,
  onSortChange,
  handleFilterChange,
  onPaginationChange,
  header,
  ticketStore,
  debouncedGlobalFilterValue,
  createdCalenderAsRange,
  setCreatedCalenderAsRange,
  jiraUsers,
  allTasks,
  width,
}: TicketsBacklogViewProps) {
  const {
    availableStates,
    labelTypes,
    priorityBuckets,
    schedules,
    iterations,
    externalRequestors,
  } = ticketStore;

  const titleFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
    return (
      <>
        <InputText
          data-testid="title-filter-input"
          value={
            // eslint-disable-next-line
            debouncedGlobalFilterValue != ''
              ? debouncedGlobalFilterValue
              : options.value
          }
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            // setGlobalFilterValue('');
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
          filter
          data-testid="label-filter-input"
          // eslint-disable-next-line
          value={options.value}
          options={labelTypes}
          itemTemplate={LabelItemTemplate}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          display="chip"
          optionLabel="name"
          placeholder="Any"
          className="p-column-filter"
        />
      </>
    );
  };
  const externalRequestorFilterTemplate = (
    options: ColumnFilterElementTemplateOptions,
  ) => {
    return (
      <>
        <div className="mb-3 font-bold">External Requester Picker</div>
        <MultiSelect
          data-testid="external-requestor-filter-input"
          // eslint-disable-next-line
          value={options.value}
          options={externalRequestors}
          itemTemplate={ExternalRequestorItemTemplate}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          filter
          display="chip"
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
      label: 'Unassigned',
      description: '',
      id: -1,
      created: '',
      createdBy: '',
    };
    const statesWithEmpty = [...availableStates];
    if (
      statesWithEmpty.length > 0 &&
      statesWithEmpty[0].label !== 'Unassigned'
    ) {
      statesWithEmpty.unshift(empty);
    }
    return (
      <>
        <div className="mb-3 font-bold">Status Picker</div>
        <MultiSelect
          display="chip"
          filter
          data-testid="state-filter-input"
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
          filter
          display="chip"
          filterBy="displayName"
          data-testid="assignee-filter-input"
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
    const empty: PriorityBucket = {
      name: 'Unassigned',
      description: '',
      orderIndex: -1,
      id: -1,
      created: '',
      createdBy: '',
    };
    const priorityBucketsWithEmpty = [...priorityBuckets];
    if (
      priorityBucketsWithEmpty.length > 0 &&
      priorityBucketsWithEmpty[0].name !== 'Unassigned'
    ) {
      priorityBucketsWithEmpty.unshift(empty);
    }
    return (
      <>
        <MultiSelect
          filter
          display="chip"
          data-testid="priority-filter-input"
          // eslint-disable-next-line
          value={options.value}
          options={priorityBucketsWithEmpty}
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
    const empty: Schedule = {
      name: 'Unassigned',
      description: '',
      grouping: -1,
      id: -1,
      created: '',
      createdBy: '',
    };
    const schedulesWithEmpty = [...schedules];
    if (
      schedulesWithEmpty.length > 0 &&
      schedulesWithEmpty[0].name !== 'Unassigned'
    ) {
      schedulesWithEmpty.unshift(empty);
    }

    return (
      <>
        <MultiSelect
          filter
          display="chip"
          data-testid="schedule-filter-input"
          // eslint-disable-next-line
          value={options.value}
          options={schedulesWithEmpty}
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
    const empty: Iteration = {
      name: 'Unassigned',
      startDate: '',
      active: false,
      completed: false,
      id: -1,
      created: '',
      createdBy: '',
    };
    const iterationsWithEmpty = [...iterations];
    if (
      iterationsWithEmpty.length > 0 &&
      iterationsWithEmpty[0].name !== 'Unassigned'
    ) {
      iterationsWithEmpty.unshift(empty);
    }
    return (
      <>
        <MultiSelect
          filter
          display="chip"
          data-testid="iteration-filter-input"
          // eslint-disable-next-line
          value={options.value}
          options={iterationsWithEmpty}
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
    const empty: Task = {
      assignee: {
        username: '',
        avatarUrl: '',
        email: '',
        displayName: '',
      },
      branchBaseTimeStamp: -1,
      branchHeadTimeStamp: -1,
      branchPath: '',
      branchState: '',
      created: '',
      description: '',
      feedBackMessageStatus: '',
      key: 'Unassigned',
      projectKey: '',
      reviewers: [],
      summary: '',
      updated: '',
    };
    const allTasksWithEmpty = [...allTasks];
    if (
      allTasksWithEmpty.length > 0 &&
      allTasksWithEmpty[0].key !== 'Unassigned'
    ) {
      allTasksWithEmpty.unshift(empty);
    }
    return (
      <>
        <Dropdown
          filter
          data-testid="task-filter-input"
          // eslint-disable-next-line
          value={options.value}
          options={allTasksWithEmpty}
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
        data-testid="date-filter-input"
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
        data-testid="date-range-filter-input"
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

  const isSelectable = (ticket: Ticket) => {
    if (ticket.state?.label !== 'Closed') return true;
    return false;
  };

  const isRowSelectable = (event: DataTableDataSelectableEvent) => {
    return event.data ? isSelectable(event.data as Ticket) : true;
  };

  const fieldsContains = useCallback(
    (val: string) => {
      return fields.indexOf(val) !== -1;
    },
    [fields],
  );

  // 70 is a magic number for the paginator - it is difficult to get a ref of it
  const scrollableHeight = height ? `${height - 70}px` : undefined;

  return (
    <DataTable
      tableStyle={{
        minHeight: '100%',
        maxHeight: '100%',
        width: width ? `${width - 100}px` : '100%',
      }}
      scrollable
      scrollHeight={scrollableHeight ? scrollableHeight : undefined}
      value={tickets}
      lazy
      dataKey="id"
      paginator={true}
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
      pageLinkSize={10}
      emptyMessage="No Tickets Found"
      header={header}
      selectionMode={selectable ? 'checkbox' : null}
      // eslint-disable-next-line
      selection={selectedTickets!}
      selectionPageOnly={true}
      isDataSelectable={isRowSelectable}
      onSelectionChange={(
        e: DataTableSelectionMultipleChangeEvent<Ticket[]>,
      ) => {
        // TODO: this might need some work, in terms of having a better method of adding to the list of the selected tickets
        // this is as temp work around while i keep building
        // i.e deleted tickets etc
        setSelectedTickets(e.value);
      }}
    >
      {selectable && (
        <Column
          selectionMode="multiple"
          headerStyle={{ width: '3rem' }}
        ></Column>
      )}
      {fieldsContains('priorityBucket') && (
        <Column
          field="priorityBucket"
          header="Priority"
          style={{ width: width ? '20%' : 'auto' }}
          sortable={!minimal}
          filter={!minimal}
          filterPlaceholder="Search by Priority"
          body={PriorityBucketTemplate}
          filterElement={priorityFilterTemplate}
          showFilterMatchModes={false}
        />
      )}
      {fieldsContains('title') && (
        <Column
          field="title"
          header="Title"
          sortable={!minimal}
          filter={!minimal}
          filterPlaceholder="Search by Title"
          showFilterMatchModes={false}
          style={{ width: width ? '20%' : 'auto' }}
          body={TitleTemplate}
          filterElement={titleFilterTemplate}
        />
      )}
      {fieldsContains('schedule') && (
        <Column
          field="schedule"
          header="Schedule"
          sortable={!minimal}
          filter={!minimal}
          style={{ width: width ? '20%' : 'auto' }}
          filterPlaceholder="Search by Schedule"
          body={ScheduleTemplate}
          filterElement={scheduleFilterTemplate}
          showFilterMatchModes={false}
        />
      )}
      {fieldsContains('iteration') && (
        <Column
          field="iteration"
          header="Release"
          sortable={!minimal}
          filter={!minimal}
          filterPlaceholder="Search by Release"
          body={IterationTemplate}
          filterElement={iterationFilterTemplate}
          showFilterMatchModes={false}
        />
      )}
      {fieldsContains('state') && (
        <Column
          field="state"
          header="Status"
          sortable={!minimal}
          filter={!minimal}
          style={{ width: width ? '20%' : 'auto' }}
          filterPlaceholder="Search by Status"
          filterField="state"
          body={StateTemplate}
          filterElement={stateFilterTemplate}
          showFilterMatchModes={false}
        />
      )}
      {fieldsContains('labels') && (
        <Column
          field="labels"
          header="Labels"
          filter={!minimal}
          filterPlaceholder="Search by Label"
          maxConstraints={1}
          body={LabelsTemplate}
          filterElement={labelFilterTemplate}
          showFilterMatchModes={false}
        />
      )}
      {fieldsContains('externalRequestors') && (
        <Column
          field="externalRequestors"
          header="External Requesters"
          filter={!minimal}
          filterPlaceholder="Search by External Requester"
          maxConstraints={1}
          body={ExternalRequestorsTemplate}
          filterElement={externalRequestorFilterTemplate}
          showFilterMatchModes={false}
        />
      )}
      {fieldsContains('taskAssociation') && (
        <Column
          field="taskAssociation"
          header="Task"
          sortable={!minimal}
          filter={!minimal}
          filterPlaceholder="Search by Task"
          body={TaskAssocationTemplate}
          showFilterMatchModes={false}
          filterElement={taskAssociationFilterTemplate}
        />
      )}
      {fieldsContains('assignee') && (
        <Column
          field="assignee"
          header="Assignee"
          sortable={!minimal}
          filter={!minimal}
          filterField="assignee"
          filterPlaceholder="Search by Assignee"
          filterElement={assigneeFilterTemplate}
          body={AssigneeTemplate}
          showFilterMatchModes={false}
          filterMenuStyle={{ width: '14rem' }}
          style={{ minWidth: '14rem' }}
        />
      )}
      {fieldsContains('created') && createdCalenderAsRange ? (
        <Column
          field="created"
          header="Created"
          dataType="date"
          sortable={!minimal}
          filter={!minimal}
          style={{ width: width ? '20%' : 'auto' }}
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
          sortable={!minimal}
          filter={!minimal}
          style={{ width: width ? '20%' : 'auto' }}
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
  );
}
