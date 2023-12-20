import { DataTable, DataTableFilterEvent, DataTableFilterMeta, DataTableFilterMetaData, DataTablePageEvent } from 'primereact/datatable';
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

// import 'primeicons/primeicons.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';

import useJiraUserStore from '../../stores/JiraUserStore';
import { useCallback, useEffect, useState } from 'react';
import { AdditionalFieldValue, PagedTicket, Ticket, TicketDto } from '../../types/tickets/ticket';
import useTicketStore from '../../stores/TicketStore';
import { Link } from 'react-router-dom';
import { getPriorityValue } from '../../utils/helpers/tickets/ticketFields';
import CustomPrioritySelection from './components/grid/CustomPrioritySelection';
import CustomIterationSelection from './components/grid/CustomIterationSelection';
import CustomStateSelection from './components/grid/CustomStateSelection';
import CustomTicketLabelSelection from './components/grid/CustomTicketLabelSelection';
import CustomTicketAssigneeSelection from './components/grid/CustomTicketAssigneeSelection';
import { JiraUser } from '../../types/JiraUserResponse';
import GravatarWithTooltip from '../../components/GravatarWithTooltip';
import { ListItemText, Stack } from '@mui/material';
import { render } from 'react-dom';
import TicketsService from '../../api/TicketsService';
import { validateQueryParams } from '../../utils/helpers/queryUtils';

const smallColumnStyle = {
    maxWidth: '100px'
}

const defaultFilters: DataTableFilterMeta = {
        priorityBucket: { value: null, matchMode: FilterMatchMode.CONTAINS } ,
        title: { value: null, matchMode: FilterMatchMode.CONTAINS },
        schedule: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        iteration: { value: null, matchMode: FilterMatchMode.IN },
        state: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
        labels: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        taskAssociation: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        assignee: { value: null, matchMode: FilterMatchMode.IN },
        created: { value: null, matchMode: FilterMatchMode.BETWEEN }
}

const PAGE_SIZE = 20;

export default function TicketsBacklogPrime(){
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
        updateQueryString
      } = useTicketStore();
    const { jiraUsers } = useJiraUserStore();

    const heading = 'Backlog';
    const [paginationModel, setPaginationModel] = useState({
      page: 0,
      pageSize: PAGE_SIZE,
    });
    const [totalRecords, setTotalRecords] = useState(0);
    const [localTickets, setLocalTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 20,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: defaultFilters
    });

    const handlePagedTicketChange = useCallback(() => {
        const localPagedTickets = getPagedTicketByPageNumber(paginationModel.page);
    
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
      }, [getPagedTicketByPageNumber, lazyState.page]);

      useEffect(() => {
        handlePagedTicketChange();
      }, [handlePagedTicketChange, pagedTickets]);

    useEffect(() => {
        const localPagedTickets = getPagedTicketByPageNumber(paginationModel.page)
          ?._embedded.ticketDtoList;
        if (localPagedTickets) {
            console.log(localPagedTickets);
          setLocalTickets(localPagedTickets ? localPagedTickets : []);
        }
      }, [
        pagedTickets,
        getPagedTicketByPageNumber,
        paginationModel,
      ]);

      const getQueryPagedTickets = useCallback(() => {
        setLoading(true);
        searchPaginatedTickets(queryString, paginationModel.page, 20);
      }, [addPagedTickets, paginationModel.page, queryString]);

      const searchPaginatedTickets = (queryString: string, page: number, rowsPerPage: number) => {
        TicketsService.searchPaginatedTickets(queryString, paginationModel.page, 20)
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

      useEffect(() => {
        if(validateQueryParams(queryString)){
           getQueryPagedTickets()
        }
      }, [queryString]);

      const [globalFilterValue, setGlobalFilterValue] = useState('');

    const initFilters = () => {
        // setFilters(defaultFilters);
        setGlobalFilterValue('');
    };

    const clearFilter = () => {
        initFilters();
    }
    
    useEffect(() => {
        initFilters();
    }, [])

    const assigneeFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {        
        return (
            <>
                <div className="mb-3 font-bold">User Picker</div>
                <MultiSelect value={options.value} options={jiraUsers} itemTemplate={assigneeItemTemplate} onChange={(e: MultiSelectChangeEvent) => options.filterCallback(e.value)} optionLabel="name" placeholder="Any" className="p-column-filter" />
            </>
        );
    }

    const textFieldFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
            <>
                <div className="mb-3 font-bold">Contains</div>
                <InputText placeholder="Title" onChange={(e) => options.filterCallback(e.target.value)}/>
            </>
        );
    }

    interface TicketDataTableFilters {
        assignee?: AssigneeMetaData;
        title?: TitleMetaData;
        // Add more filter keys as needed
      }

      interface AssigneeMetaData extends DataTableFilterMetaData{
        value: JiraUser[],
      }

      interface TitleMetaData extends DataTableFilterMetaData{
        value: string,
      }

    const handleFilterChange = (event: DataTableFilterEvent) => {
        const typedFilters = event.filters as TicketDataTableFilters;
        
        let query = "?";

        let queryArray = [] as string[];
        if(typedFilters.title?.value){
            queryArray.push(`title=${typedFilters.title?.value}`);
        }

        if(typedFilters.assignee?.value){
            let userString = "assignee=";
            typedFilters.assignee?.value?.forEach(user => {
                userString += user.name;
            })
            queryArray.push(userString);
        }

        for(let i=0; i< queryArray.length; i++){
            if(i != 0){
                query += "&";
            }
            query += queryArray[i];
        }
        console.log(query);
        updateQueryString(`${query}`);
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
        // onSort={onSort} 
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
            <Column field='priorityBucket' header="Priority" sortable filter filterPlaceholder="Search by Priority" body={priorityBucketTemplate}/>
            <Column field="title" header="Title" sortable filter filterPlaceholder="Search by Title" showFilterMatchModes={false} style={{ minWidth: '14rem' }} body={titleTemplate}/>
            <Column field="schedule" header="Schedule" sortable filter filterPlaceholder="Search by Schedule" body={scheduleTemplate}/>
            <Column field="iteration" header="Release" sortable filter filterPlaceholder="Search by Release" body={iterationTemplate}/>
            <Column field="state" header="Status" sortable filter filterPlaceholder="Search by Status" body={stateTemplate}/>
            <Column field="labels" header="Labels" sortable filter filterPlaceholder="Search by Release" body={labelsTemplate}/>
            <Column field="taskAssociation" header="Task" sortable filter  filterPlaceholder="Search by Release" body={taskAssocationTemplate}/>
            <Column field="assignee" header="Assignee" sortable filter filterField='assignee' filterPlaceholder="Search by Release" filterElement={assigneeFilterTemplate} body={assigneeTemplate}
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


const assigneeItemTemplate = (user: JiraUser) => {
    const { jiraUsers } = useJiraUserStore();
    return (<>
    <Stack direction="row" spacing={2}>
    <GravatarWithTooltip username={user.name} userList={jiraUsers} />
              <ListItemText primary={user.displayName} />
            </Stack>
        

    </>)
}

const taskAssocationTemplate = (rowData: Ticket) => {
    
    return (
        <Link to={`/dashboard/tasks/edit/${rowData.taskAssociation?.id}/${rowData.id}`}>
          {rowData.taskAssociation?.id}
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

