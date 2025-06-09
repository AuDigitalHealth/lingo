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
  ExternalRequestor,
  LabelType,
  Ticket,
} from '../../../../types/tickets/ticket';
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
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
  TicketNumberTemplate,
  TitleTemplate,
} from './Templates';
import { TicketStoreConfig } from '../../../../stores/TicketStore';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import useAllBacklogFields from '../../../../hooks/api/tickets/useAllBacklogFields';

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
  width?: number;
  selectedTickets: Ticket[] | null;
  setSelectedTickets?: Dispatch<SetStateAction<Ticket[] | null>>;
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
  createdCalenderAsRange,
  setCreatedCalenderAsRange,

  width,
}: TicketsBacklogViewProps) {
  const {
    availableStates,
    labels,
    externalRequestors,
    priorityBuckets,
    schedules,
    iterations,
    jiraUsers,
    allTasks,
  } = useAllBacklogFields();

  const titleFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
    return (
      <>
        <InputText
          data-testid="title-filter-input"
          value={options.value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            options.filterCallback(e.target.value);
          }}
          placeholder="Title Search"
        />
      </>
    );
  };

  const ticketNumberFilterTemplate = (
    options: ColumnFilterElementTemplateOptions,
  ) => {
    return (
      <>
        <InputText
          data-testid="ticket-number-filter-input"
          value={options.value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            options.filterCallback(e.target.value);
          }}
          placeholder="Ticket Number Search"
        />
      </>
    );
  };

  const [labelFilterOperatorMode, setLabelFilterOperatorMode] = useState<
    string | undefined
  >(lazyState.filters.labels?.operator);

  const labelFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
    return (
      <>
        <div className="mb-3 font-bold">Label Picker</div>
        <MultiSelect
          filter
          data-testid="label-filter-input"
          value={options.value}
          optionDisabled={(option: LabelType) => {
            if (labelFilterOperatorMode === 'and') {
              const selectedValues = options.value as LabelType[] | null;
              if (!selectedValues) return false;
              const isUnassignedSelected = selectedValues?.some(
                val => val.id === -1,
              );
              const otherOptionsSelected =
                selectedValues.length > 0 && !isUnassignedSelected;

              if (option.id === -1) {
                return otherOptionsSelected;
              } else {
                return isUnassignedSelected;
              }
            }
            return false;
          }}
          options={labels}
          itemTemplate={LabelItemTemplate}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          display="chip"
          optionLabel="name"
          placeholder="Any"
          className="p-column-filter w-full max-w-20rem"
        />
      </>
    );
  };

  const [
    externalRequestorFilterOperatorMode,
    setExternalRequestorFilterOperatorMode,
  ] = useState<string | undefined>(
    lazyState.filters.externalRequestors?.operator,
  );

  const externalRequestorFilterTemplate = (
    options: ColumnFilterElementTemplateOptions,
  ) => {
    return (
      <>
        <div className="mb-3 font-bold">External Requester Picker</div>
        <MultiSelect
          data-testid="external-requestor-filter-input"
          value={options.value}
          optionDisabled={(option: ExternalRequestor) => {
            if (externalRequestorFilterOperatorMode === 'and') {
              const selectedValues = options.value as
                | ExternalRequestor[]
                | null;
              if (!selectedValues) return false;
              const isUnassignedSelected = selectedValues.some(
                val => val.id === -1,
              );
              const otherOptionsSelected =
                selectedValues.length > 0 && !isUnassignedSelected;

              if (option.id === -1) {
                return otherOptionsSelected;
              } else {
                return isUnassignedSelected;
              }
            }
            return false;
          }}
          options={externalRequestors}
          itemTemplate={ExternalRequestorItemTemplate}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          filter
          display="chip"
          optionLabel="name"
          placeholder="Any"
          className="p-column-filter w-full max-w-20rem"
          maxSelectedLabels={4}
        />
      </>
    );
  };

  const stateFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
    return (
      <>
        <div className="mb-3 font-bold">Status Picker</div>
        <MultiSelect
          display="chip"
          filter
          data-testid="state-filter-input"
          value={options.value}
          options={availableStates}
          itemTemplate={StateItemTemplate}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          optionLabel="label"
          placeholder="Any"
          className="p-column-filter w-full max-w-20rem"
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
          filter
          display="chip"
          filterBy="displayName"
          data-testid="assignee-filter-input"
          value={options.value}
          options={jiraUsers}
          itemTemplate={AssigneeItemTemplate}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          optionLabel="name"
          placeholder="Any"
          className="p-column-filter w-full max-w-20rem"
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
          filter
          display="chip"
          data-testid="priority-filter-input"
          value={options.value}
          options={priorityBuckets}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          optionLabel="name"
          placeholder="Any"
          className="p-column-filter w-full max-w-20rem"
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
          filter
          display="chip"
          data-testid="schedule-filter-input"
          value={options.value}
          options={schedules}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          itemTemplate={ScheduleItemTemplate}
          optionLabel="name"
          placeholder="Any"
          className="p-column-filter w-full max-w-20rem"
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
          filter
          display="chip"
          data-testid="iteration-filter-input"
          value={options.value}
          options={iterations}
          itemTemplate={IterationItemTemplate}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          optionLabel="name"
          placeholder="Any"
          className="p-column-filter w-full max-w-20rem"
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
          filter
          data-testid="task-filter-input"
          value={options.value}
          options={allTasks}
          onChange={(e: MultiSelectChangeEvent) =>
            options.filterCallback(e.value)
          }
          optionLabel="key"
          placeholder="Task"
          className="p-column-filter w-full max-w-20rem"
        />
      </>
    );
  };

  const dateFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
    return (
      <Calendar
        data-testid="date-filter-input"
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
      selection={selectedTickets!}
      selectionPageOnly={true}
      isDataSelectable={isRowSelectable}
      onSelectionChange={(
        e: DataTableSelectionMultipleChangeEvent<Ticket[]>,
      ) => {
        // TODO: this might need some work, in terms of having a better method of adding to the list of the selected tickets
        // this is as temp work around while i keep building
        // i.e deleted tickets etc
        if (setSelectedTickets) {
          setSelectedTickets(e.value);
        }
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
          showFilterMatchModes={true}
          filterMatchModeOptions={[
            { label: 'Equals', value: FilterMatchMode.EQUALS },
            { label: 'Not Equals', value: FilterMatchMode.NOT_EQUALS },
          ]}
        />
      )}
      {fieldsContains('ticketNumber') && (
        <Column
          field="ticketNumber"
          header="Ticket"
          sortable={!minimal}
          filter={!minimal}
          filterPlaceholder="Search by Ticket Number"
          showFilterMatchModes={false}
          style={{ width: width ? '20%' : 'auto' }}
          body={TicketNumberTemplate}
          filterElement={ticketNumberFilterTemplate}
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
          showFilterMatchModes={true}
          filterMatchModeOptions={[
            { label: 'Equals', value: FilterMatchMode.EQUALS },
            { label: 'Not Equals', value: FilterMatchMode.NOT_EQUALS },
          ]}
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
          showFilterMatchModes={true}
          filterMatchModeOptions={[
            { label: 'Equals', value: FilterMatchMode.EQUALS },
            { label: 'Not Equals', value: FilterMatchMode.NOT_EQUALS },
          ]}
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
          showFilterMatchModes={true}
          filterMatchModeOptions={[
            { label: 'Equals', value: FilterMatchMode.EQUALS },
            { label: 'Not Equals', value: FilterMatchMode.NOT_EQUALS },
          ]}
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
          showFilterMatchModes={true}
          filterMatchModeOptions={[
            { label: 'Equals', value: FilterMatchMode.EQUALS },
            { label: 'Not Equals', value: FilterMatchMode.NOT_EQUALS },
          ]}
          onFilterOperatorChange={event => {
            setLabelFilterOperatorMode(event.operator);
          }}
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
          showFilterMatchModes={true}
          filterMatchModeOptions={[
            { label: 'Equals', value: FilterMatchMode.EQUALS },
            { label: 'Not Equals', value: FilterMatchMode.NOT_EQUALS },
          ]}
          onFilterOperatorChange={event => {
            setExternalRequestorFilterOperatorMode(event.operator);
          }}
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
          showFilterMatchModes={true}
          filterMatchModeOptions={[
            { label: 'Equals', value: FilterMatchMode.EQUALS },
            { label: 'Not Equals', value: FilterMatchMode.NOT_EQUALS },
          ]}
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
          showFilterMatchModes={true}
          filterMatchModeOptions={[
            { label: 'Equals', value: FilterMatchMode.EQUALS },
            { label: 'Not Equals', value: FilterMatchMode.NOT_EQUALS },
          ]}
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
