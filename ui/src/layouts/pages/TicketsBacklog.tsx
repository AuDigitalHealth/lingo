import { ReactNode, useEffect, useState } from 'react';
import useTicketStore from '../../stores/TicketStore';
import { Label, LabelBasic, LabelType, State, Ticket } from '../../types/tickets/ticket';
import TicketsService from '../../api/TicketsService';
import { DataGrid, GridColDef, GridFilterOperator, GridRenderCellParams, GridValueFormatterParams, getGridSingleSelectOperators } from '@mui/x-data-grid';
import MainCard from '../../components/MainCard';
import { Link } from 'react-router-dom';
import { mapToStateOptions } from '../../utils/helpers/stateUtils';
import CustomStateSelection from '../../components/tickets/CustomStateSelection';
import GravatarWithTooltip from '../../components/GravatarWithTooltip';
import useJiraUserStore from '../../stores/JiraUserStore';
import { minWidth } from '@mui/system';
import { mapToUserOptions } from '../../utils/helpers/userUtils';
import CustomTicketAssigneeSelection from '../../components/tickets/CustomTicketAssigneeSelection';
import { Card } from '@mui/material';
import { TableHeaders } from '../../components/TableHeaders';
import { mapToLabelOptions } from '../../utils/helpers/labelUtils';
import CustomTicketLabelSelection from '../../components/tickets/CustomTicketLabelSelection';

function TicketsBacklog() {
  const { setTickets, tickets, setAvailableStates, availableStates, setLabelTypes, labelTypes } = useTicketStore();
  const {fetching, jiraUsers, fetchJiraUsers} = useJiraUserStore();
  const[loading, setLoading] = useState(true);

  const heading = "Backlog";

  useEffect(() => {
    if(jiraUsers.length=== 0){
        fetchJiraUsers().catch(err => {
            console.log(err);
        });
    }
    TicketsService.getAllTickets()
      .then((tickets: Ticket[]) => {
        setTickets(tickets);
      })
      .catch(err => console.log(err));
    TicketsService.getAllStates()
      .then((states: State[]) => {
        setAvailableStates(states);
        setTimeout(() => {
            setLoading(false);
        }, 1000)
        
      })
      .catch(err => console.log(err));
      TicketsService.getAllLabelTypes().then((labelTypes: LabelType[]) => {
        setLabelTypes(labelTypes);
        console.log(labelTypes);
      }).catch(err => {
        console.log(err);
      })
  }, []);

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Title',
      minWidth: 90,
      flex: 1,
      maxWidth: 90,
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <Link to={`/dashboard/tasks/edit/${params.value}`}>
          {params.value!.toString()}
        </Link>
      ),
    },
    {
        field: 'description',
        headerName: 'Description',
        minWidth: 90,
        flex: 1,
        maxWidth: 200,
      },
      {
        field: 'created',
        headerName: 'Created',
        minWidth: 110,
        flex: 1,
        maxWidth: 110,
        valueFormatter: ({ value }: GridValueFormatterParams<string>) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-AU');
          },
      },
      {
        field: 'createdBy',
        headerName: 'Created By',
        minWidth: 120,
        flex: 1,
        maxWidth: 120,
        renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
            <GravatarWithTooltip username={params.value} userList={jiraUsers}/>
          ),
      },
      {
        field: 'modified',
        headerName: 'Modified',
        minWidth: 110,
        flex: 1,
        maxWidth: 110,
        valueFormatter: ({ value }: GridValueFormatterParams<string>) => {
            if (value === null) return ""; 
            const date = new Date(value);
            return date.toLocaleDateString('en-AU');
          },
      },
      {
        field: 'modifiedBy',
        headerName: 'Modified By',
        minWidth: 120,
        flex: 1,
        maxWidth: 120,
        renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
            (params.value !== null) &&
            <GravatarWithTooltip username={params.value} userList={jiraUsers}/>
          ),
      },
      {
        field: 'state',
        headerName: 'Status',
        minWidth: 150,
        flex: 1,
        maxWidth: 150,
        type: 'singleSelect',
        valueOptions: mapToStateOptions(availableStates),
        renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
            <CustomStateSelection
                id={params.id as string}
                stateList={availableStates}
                state={params.value}
            />
          ),
          valueGetter: (params: GridRenderCellParams<any, State>) : string | undefined => {
            return params.value?.label;
          }
      }, 
      {
        field: 'assignee',
        headerName: 'Assignee',
        minWidth: 200,
        flex: 1,
        maxWidth: 200,
        type: 'singleSelect',
        valueOptions: mapToUserOptions(jiraUsers),
        renderCell: (params: GridRenderCellParams<any, string>): ReactNode => {

            return (
            
          <CustomTicketAssigneeSelection
            user={params.value}
            userList={jiraUsers}
            id={params.id as string}
          />
        )},
        valueGetter: (params: GridRenderCellParams<any, string>): string => {
          return params.value as string;
        },
      },
      {
        field: 'labels',
        headerName: 'Labels',
        minWidth: 200,
        flex: 1,
        maxWidth: 300,
        // type: 'singleSelect',
        valueOptions: mapToLabelOptions(labelTypes),
        // This and the value getter might look bizarre, but it is necassary to be able to filter
        // on a multi select field
        renderCell: (params: GridRenderCellParams<any, string>): ReactNode => {
            
            const items = params.value?.split(',');
            if(items && items[0] === ''){
                items.pop();
            }
            
            const labelArray : LabelBasic[] | undefined = items?.map(item => {
                const returnVal = item.split("|");
                return {
                    id: returnVal[0],
                    labelTypeId: returnVal[1],
                    labelTypeName: returnVal[2]
                }
            })
            
            return (
                <CustomTicketLabelSelection labelTypeList={labelTypes} labels={labelArray} id={params.id as string}/>
            )
        },
        valueGetter: (params: GridRenderCellParams<any, Label[]>): string => {
            let values = params.value?.map((label: Label) => {
                return  label.id + "|" + label.labelType?.id + "|" + label.labelType?.name;
            })
            if( values === undefined ) return "";
            return values?.toString();
          },
      }
  ];
  
  return (
    <>
    {fetching || loading ? <></> : 
        <Card>
        <DataGrid
          //   density={true ? 'compact' : 'standard'}
          density='compact'
          getRowHeight={() => 'auto'}
          showColumnVerticalBorder={true}
          showCellVerticalBorder={true}
          sx={{
              fontWeight: 400,
              fontSize: 14,
              borderRadius: 0,
              border: 0,
              color: '#003665',
              '& .MuiDataGrid-row': {
                borderBottom: 1,
                borderColor: 'rgb(240, 240, 240)',
                minHeight: 'auto !important',
                maxHeight: 'none !important',
                paddingLeft: '24px',
                paddingRight: '24px',
              },
              '& .MuiDataGrid-cell': {
                  borderColor: 'rgb(240, 240, 240)',
                },
              '& .MuiDataGrid-columnHeaders': {
                border: 0,
                borderTop: 0,
                borderBottom: 1,
                borderColor: 'rgb(240, 240, 240)',
                borderRadius: 0,
                backgroundColor: 'rgb(250, 250, 250)',
                paddingLeft: '24px',
                paddingRight: '24px',
                textDecoration: 'underline'
              },
              '& .MuiDataGrid-footerContainer': {
                border: 0,
                // If you want to keep the pagination controls consistently placed page-to-page
                // marginTop: `${(pageSize - userDataList.length) * ROW_HEIGHT}px`
              },
              '& .MuiTablePagination-selectLabel': {
                color: 'rgba(0, 54, 101, 0.6)',
              },
              '& .MuiSelect-select': {
                color: '#003665',
              },
              '& .MuiTablePagination-displayedRows': {
                color: '#003665',
              },
              '& .MuiSvgIcon-root': {
                color: '#003665',
              },
            }}
          getRowId={(row: Ticket) => row.id}
          slots={{toolbar: TableHeaders}}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
              tableName: heading,
            }}}
          rows={tickets}
          columns={columns}
          hideFooterSelectedRowCount
          disableDensitySelector
          disableColumnFilter={false}
          disableColumnMenu={false}
          disableRowSelectionOnClick={false}
          hideFooter={false}
        />
      </Card>
    }
    </>
    
    
  );
}

export default TicketsBacklog;
