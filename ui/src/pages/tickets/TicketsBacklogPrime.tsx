import { DataTable, DataTableFilterEvent, DataTableSortEvent, DataTableFilterMeta, DataTablePageEvent } from 'primereact/datatable';
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import {Dropdown} from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

// import 'primeicons/primeicons.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';

import useJiraUserStore from '../../stores/JiraUserStore';
import { useCallback, useEffect, useState } from 'react';
import { AdditionalFieldTypeOfListType, AdditionalFieldValue, Iteration, LabelType, PagedTicket, State, Ticket, TicketDto } from '../../types/tickets/ticket';
import useTicketStore from '../../stores/TicketStore';
import { Link } from 'react-router-dom';
import { getPriorityValue } from '../../utils/helpers/tickets/ticketFields';
import CustomPrioritySelection from './components/grid/CustomPrioritySelection';
import CustomIterationSelection, { IterationItemDisplay } from './components/grid/CustomIterationSelection';
import CustomStateSelection, { StateItemDisplay } from './components/grid/CustomStateSelection';
import CustomTicketLabelSelection, { LabelTypeItemDisplay } from './components/grid/CustomTicketLabelSelection';
import CustomTicketAssigneeSelection from './components/grid/CustomTicketAssigneeSelection';
import { JiraUser } from '../../types/JiraUserResponse';
import GravatarWithTooltip from '../../components/GravatarWithTooltip';
import { ListItemText, Stack } from '@mui/material';
import { render } from 'react-dom';
import TicketsService from '../../api/TicketsService';
import { validateQueryParams } from '../../utils/helpers/queryUtils';
import { TypeValue } from '../../types/tickets/ticket';
import { PriorityBucket } from '../../types/tickets/ticket';
import { TicketDataTableFilters } from '../../types/tickets/table';
import useTaskStore from '../../stores/TaskStore';

const smallColumnStyle = {
    maxWidth: '100px'
}

const defaultFilters: DataTableFilterMeta = {
        priorityBucket: { value: null, matchMode: FilterMatchMode.EQUALS } ,
        title: { value: null, matchMode: FilterMatchMode.CONTAINS },
        schedule: { value:null, matchMode: FilterMatchMode.EQUALS },
        iteration: { value: null, matchMode: FilterMatchMode.EQUALS },
        state: { value:null, matchMode: FilterMatchMode.EQUALS },
        labels: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.IN }] },
        taskAssociation: { value:null, matchMode: FilterMatchMode.EQUALS },
        assignee: { value: null, matchMode: FilterMatchMode.EQUALS },
        created: { value: null, matchMode: FilterMatchMode.BETWEEN }
}

const defaultLazyState : LazyTableState = {
    first: 0,
    rows: 20,
    page: 0,
    sortField: '',
    sortOrder: 0,
    filters: defaultFilters
}

const PAGE_SIZE = 20;

interface LazyTableState {
    first: number;
    rows: number;
    page: number;
    sortField?: string;
    sortOrder?: 0 | 1 | -1 | null | undefined;
    filters: DataTableFilterMeta;
}

export default function TicketsBacklogPrime(){
    const {
        availableStates,
        clearPagedTickets,
        updateQueryString,
        labelTypes,
        priorityBuckets, 
        additionalFieldTypesOfListType,
        iterations,
        setSearchConditionsBody
      } = useTicketStore();
      const {allTasks} = useTaskStore();
    const { jiraUsers } = useJiraUserStore();

    const [lazyState, setlazyState] = useState<LazyTableState>(defaultLazyState);
    const {loading, localTickets, totalRecords} = useLocalTickets(lazyState);

    const [globalFilterValue, setGlobalFilterValue] = useState('');

    const initFilters = () => {
        // setFilters(defaultFilters);
        setGlobalFilterValue('');
    };

    const clearFilter = () => {
        handleFilterChange(undefined);
        initFilters();
    }
    
    useEffect(() => {
        initFilters();
    }, []);

    const labelFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {        
        return (
            <>
                <div className="mb-3 font-bold">Status Picker</div>
                <MultiSelect value={options.value} options={labelTypes} itemTemplate={labelItemTemplate} onChange={(e: MultiSelectChangeEvent) => options.filterCallback(e.value)} optionLabel="name" placeholder="Any" className="p-column-filter" />
            </>
        );
    };

    const stateFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {        
        return (
            <>
                <div className="mb-3 font-bold">Status Picker</div>
                <Dropdown value={options.value} options={availableStates} itemTemplate={stateItemTemplate} onChange={(e: MultiSelectChangeEvent) => options.filterCallback(e.value)} optionLabel="label" placeholder="Any" className="p-column-filter" />
            </>
        );
    };

    const assigneeFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {        
        return (
            <>
                <div className="mb-3 font-bold">User Picker</div>
                <MultiSelect value={options.value} options={jiraUsers} itemTemplate={assigneeItemTemplate} onChange={(e: MultiSelectChangeEvent) => options.filterCallback(e.value)} optionLabel="name" placeholder="Any" className="p-column-filter" />
            </>
        );
    }

    const priorityFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
            <>
                <Dropdown value={options.value} options={priorityBuckets} onChange={(e: MultiSelectChangeEvent) => options.filterCallback(e.value)} optionLabel="name" placeholder="Any" className="p-column-filter" />
            </>
        )
    }

    const scheduleFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        const schedules = additionalFieldTypesOfListType.filter((aft) => {
            return aft.typeName.toLowerCase() === "schedule";
        })[0].values;
        return (
            <>
                <Dropdown value={options.value} options={schedules} onChange={(e: MultiSelectChangeEvent) => options.filterCallback(e.value)} optionLabel="valueOf" placeholder="Any" className="p-column-filter" />
            </>
        )
    }

    const iterationFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
            <>
                <Dropdown value={options.value} options={iterations} itemTemplate={iterationItemTemplate} onChange={(e: MultiSelectChangeEvent) => options.filterCallback(e.value)} optionLabel="name" placeholder="Any" className="p-column-filter" />
            </>
        );
    }

    const taskAssociationFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        
        return (
            <>
                <Dropdown value={options.value} options={allTasks} onChange={(e: MultiSelectChangeEvent) => options.filterCallback(e.value)} optionLabel="key" placeholder="Task" className="p-column-filter" />
            </>
        );
    }

    

    const handleFilterChange = (event: DataTableFilterEvent | undefined) => {
        if(event == undefined){
            initFilters();
            setSearchConditionsBody(undefined);
            clearPagedTickets();
            setlazyState(defaultLazyState)
            return;
        }

        setlazyState({...lazyState, filters: event.filters});

        
    }

    useEffect(() => {
        
        let conditions = generateSearchConditions(lazyState);

        setSearchConditionsBody(conditions);
        // updateQueryString(`${query}`);
        clearPagedTickets();
    }, [lazyState]);

    const onSortChange = (event: DataTableSortEvent) => {
        setlazyState({...lazyState, sortField: event.sortField, sortOrder: event.sortOrder})
        console.log(event);
    }

    const onGlobalFilterChange = () => {

    }

    const onPaginationChange = (event: DataTablePageEvent) => {
        setlazyState({...lazyState, page: event.page ? event.page : 0, first: event.first, rows: event.rows})
    }

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between">
                <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined onClick={clearFilter} />
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Keyword Search" />
                </span>
            </div>
        );
    };

    const header = renderHeader();
    console.log(totalRecords);
    return (
        <DataTable 
        value={localTickets} 
        lazy
        dataKey='id'
        paginator
        first={lazyState.first}
        rows={20}
        totalRecords={totalRecords}
        size='small'
        onSort={onSortChange} 
        sortField={lazyState.sortField} 
        sortOrder={lazyState.sortOrder}
        // sortField={lazyState.sortField} 
        // sortOrder={lazyState.sortOrder}
        onFilter={handleFilterChange}
        filters={lazyState.filters}
        loading={loading}
        onPage={onPaginationChange}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        emptyMessage="No Tickets Found"
        header={header}
        // filterDisplay='row'
        >
            <Column field='priorityBucket.name' header="Priority" sortable filter filterPlaceholder="Search by Priority" body={priorityBucketTemplate} filterElement={priorityFilterTemplate} showFilterMatchModes={false}/>
            <Column field="title" header="Title" sortable filter filterPlaceholder="Search by Title" showFilterMatchModes={false} style={{ minWidth: '14rem' }} body={titleTemplate}/>
            <Column field="schedule" header="Schedule" filter filterPlaceholder="Search by Schedule" body={scheduleTemplate} filterElement={scheduleFilterTemplate} showFilterMatchModes={false} />
            <Column field="iteration.name" header="Release" sortable filter filterPlaceholder="Search by Release" body={iterationTemplate} filterElement={iterationFilterTemplate} showFilterMatchModes={false}/>
            <Column field="state.label" header="Status" sortable filter filterPlaceholder="Search by Status" filterField='state' body={stateTemplate} filterElement={stateFilterTemplate} showFilterMatchModes={false}/>
            <Column field="labels" header="Labels" filter filterPlaceholder="Search by Release" body={labelsTemplate} filterElement={labelFilterTemplate} showFilterMatchModes={false}/>
            <Column field="taskAssociation.taskId" header="Task" sortable filter  filterPlaceholder="Search by Release" body={taskAssocationTemplate} showFilterMatchModes={false} filterElement={taskAssociationFilterTemplate}/>
            <Column field="assignee" header="Assignee" sortable filter filterField='assignee' filterPlaceholder="Search by Assignee" filterElement={assigneeFilterTemplate} body={assigneeTemplate}
            showFilterMatchModes={false} filterMenuStyle={{ width: '14rem' }} style={{ minWidth: '14rem' }}
            />
            <Column field="created" header="Created" sortable filter filterPlaceholder="Search by Release" body={createdTemplate}/>
        </DataTable>
    )
}

const titleTemplate = (rowData: TicketDto) => {

    return (
        <Link
            to={`/dashboard/tickets/individual/${rowData.id}`}
            className="link"
          >
            {rowData.title}
          </Link>
    )
}

const priorityBucketTemplate = (rowData: TicketDto) => {
    const {
        priorityBuckets,
      } = useTicketStore();
    // const priorityBucket = getPriorityValue(rowData.priorityBucket, priorityBuckets);
    return (
        <CustomPrioritySelection
            id={rowData.id.toString()}
            priorityBucket={rowData.priorityBucket}
            priorityBucketList={priorityBuckets}
          />
    )
}

const scheduleTemplate = (rowData: TicketDto) => {
    const thisAdditionalFieldTypeValue = mapAdditionalFieldValueToType(
        rowData['ticket-additional-fields'],
        'Schedule',
      );

      return (
        <>{thisAdditionalFieldTypeValue?.valueOf}</>
      )
}

const mapAdditionalFieldValueToType = (
    value: AdditionalFieldValue[] | undefined,
    fieldType: string,
  ): AdditionalFieldValue | undefined => {
    return value?.find(item => {
      return (
        item.additionalFieldType.name.toLowerCase() == fieldType.toLowerCase()
      );
    });
  };

const iterationTemplate = (rowData: TicketDto) => {
    const {
        iterations
      } = useTicketStore();
    return (
        <CustomIterationSelection
            id={rowData.id.toString()}
            iterationList={iterations}
            iteration={rowData.iteration}
          />
    )
}

const stateTemplate = (rowData: TicketDto) => {
    const {
        availableStates
      } = useTicketStore();
    return (
        <CustomStateSelection
          id={rowData.id.toString()}
          stateList={availableStates}
          state={rowData.state}
        />
      );
}

const labelsTemplate = (rowData: TicketDto) => {
    const {
        labelTypes
      } = useTicketStore();
    return (
        <CustomTicketLabelSelection
          labelTypeList={labelTypes}
          typedLabels={rowData.labels}
          id={rowData.id.toString()}
        />
      );
}

const assigneeTemplate = (rowData: TicketDto) => {
    
    const { jiraUsers } = useJiraUserStore();

    return (
        
        <CustomTicketAssigneeSelection
          id={rowData.id.toString()}
          user={rowData.assignee}
          userList={jiraUsers}
        />
    )
}

const labelItemTemplate = (labelType: LabelType) => {
    return (
        <LabelTypeItemDisplay labelType={labelType}/>
    )
}

const stateItemTemplate = (state: State) => {
    return (
        <StateItemDisplay localState={state}/>
    )
}

const assigneeItemTemplate = (user: JiraUser) => {
    const { jiraUsers } = useJiraUserStore();
    return (<>
    <Stack direction="row" spacing={2}>
    <GravatarWithTooltip username={user.name} userList={jiraUsers} />
              <ListItemText primary={user.displayName} />
            </Stack>
        

    </>)
}

const iterationItemTemplate = (iteration: Iteration) => {
    return (<>
    <IterationItemDisplay iteration={iteration}/>
        

    </>)
}


const taskAssocationTemplate = (rowData: Ticket) => {
    
    return (
        <Link to={`/dashboard/tasks/edit/${rowData.taskAssociation?.taskId}/${rowData.id}`}>
          {rowData.taskAssociation?.taskId}
        </Link>
      );
}

const createdTemplate = (rowData: TicketDto) => {
    
    const date = new Date(rowData.created);
        return date.toLocaleDateString('en-AU', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        });

}

const useLocalTickets = (lazyState: LazyTableState) => {

    const {
        addPagedTickets,
        clearPagedTickets,
        pagedTickets,
        availableStates,
        labelTypes,
        iterations,
        priorityBuckets,
        getPagedTicketByPageNumber,
        queryString,
        updateQueryString,
        searchConditionsBody
      } = useTicketStore();
    const { jiraUsers } = useJiraUserStore();

    const [totalRecords, setTotalRecords] = useState(0);
    const [localTickets, setLocalTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);

    const handlePagedTicketChange = useCallback(() => {
        const localPagedTickets = getPagedTicketByPageNumber(lazyState.page);
        
        if(localPagedTickets){
            setTotalRecords(
                localPagedTickets?.page.totalElements
                  ? localPagedTickets?.page.totalElements
                  : 0,
              );
          
              setLocalTickets(
                localPagedTickets?._embedded.ticketDtoList
                  ? localPagedTickets?._embedded.ticketDtoList
                  : [],
              );
        } else {
            searchPaginatedTickets(searchConditionsBody, lazyState.page, 20);
        }
        
      }, [getPagedTicketByPageNumber, lazyState.page, searchConditionsBody]);

      useEffect(() => {
        handlePagedTicketChange();
      }, [handlePagedTicketChange, pagedTickets]);

      useEffect(() => {
        searchPaginatedTickets(searchConditionsBody, lazyState.page, 20);
        
      }, [])


      const searchPaginatedTickets = (searchConditions: SearchConditionBody | undefined, page: number, rowsPerPage: number) => {
        TicketsService.searchPaginatedTicketsByPost(searchConditions, lazyState.page, 20)
          .then((returnPagedTickets: PagedTicket) => {
            setLoading(false);
            if (returnPagedTickets.page.totalElements > 0) {
              addPagedTickets(returnPagedTickets);
            } else if (
              returnPagedTickets.page.totalElements === 0 &&
              pagedTickets[0].page.totalElements > 0
            ) {
              clearPagedTickets();
            }
          })
          .catch(err => console.log(err));
      }

      return {loading, localTickets, totalRecords};
}



  const generateSearchConditions = (lazyState: LazyTableState) => {
    const filters = lazyState.filters as TicketDataTableFilters;
    let searchConditions : SearchCondition[] = [];
    const orderConditions = generateOrderCondition(lazyState);
    let returnSearchConditionsBody : SearchConditionBody = {
        searchConditions: searchConditions,
        orderCondition: orderConditions
    };
    
        if(filters.title?.value){
            let titleCondition : SearchCondition = {
                key: 'title',
                operation: "=",
                condition: "and",
                value: filters.title?.value
            }
            searchConditions.push(titleCondition);
        }

        if(filters.assignee?.value){
            let assigneeCondition : SearchCondition = {
                key: 'assignee',
                operation: '=',
                condition: 'and',
                valueIn: []
            }
            
            filters.assignee?.value?.forEach((user, index) => {
                assigneeCondition.valueIn?.push(user.name);
            })
            searchConditions.push(assigneeCondition);
        }

        if(filters.labels?.constraints[0]){

            let labelCondition : SearchCondition = {
                key: 'labels.name',
                operation: '=',
                condition: filters.labels.operator,
                valueIn: []
            }

            filters.labels?.constraints.forEach(constraint => {
                let labels : string[] = [];

                constraint.value?.forEach((label, index) => {
                    labels.push(label.name);
                })
                if(labels.length > 0) {
                    labelCondition.valueIn = labels;
                    searchConditions.push(labelCondition);
                }
                
            })
            
            
        }

        if(filters.state?.value){
            let stateCondition : SearchCondition = {
                key: 'state.label',
                operation: '=',
                condition: 'and',
                value: filters.state?.value.label
            }
            searchConditions.push(stateCondition);
        }

        if(filters.state?.value){
            let stateCondition : SearchCondition = {
                key: 'state.label',
                operation: '=',
                condition: 'and',
                value: filters.state?.value.label
            }
            searchConditions.push(stateCondition);
        }

        if(filters.iteration?.value){
            let iterationCondition : SearchCondition = {
                key: 'iteration.name',
                operation: '=',
                condition: 'and',
                value: filters.iteration?.value.name
            }
            searchConditions.push(iterationCondition);
        }

        if(filters.schedule?.value){
            let scheduleCondition : SearchCondition = {
                key: 'additionalFieldValues.valueOf',
                operation: '=',
                condition: 'and',
                value: filters.schedule?.value.valueOf
            }
            searchConditions.push(scheduleCondition);
        }

        if(filters.priorityBucket?.value){
            let priorityCondition : SearchCondition = {
                key: 'priorityBucket.name',
                operation: '=',
                condition: 'and',
                value: filters.priorityBucket?.value.name
            }
            searchConditions.push(priorityCondition);
        }

        if(filters.taskAssociation?.value){
            let taskAssocationCondition : SearchCondition = {
                key: 'taskAssociation.taskId',
                operation: '=',
                condition: 'and',
                value: filters.taskAssociation?.value.key,
            }
            searchConditions.push(taskAssocationCondition);
        }
        returnSearchConditionsBody.searchConditions = searchConditions;
        return returnSearchConditionsBody;
  }

  const generateOrderCondition = (lazyState: LazyTableState) => {

    if(lazyState.sortField !== undefined && lazyState.sortField !== "" && lazyState.sortOrder !== null && lazyState.sortOrder !== undefined){
        const orderCondition : OrderCondition =  {
            fieldName: lazyState.sortField,
            order: lazyState.sortOrder
        } 
        return orderCondition;
    }
    return undefined;
  }
