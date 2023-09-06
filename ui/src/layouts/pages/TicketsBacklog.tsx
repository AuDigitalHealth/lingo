import { ReactNode, useEffect, useState } from 'react';
import useTicketStore from '../../stores/TicketStore';
import {
  Iteration,
  LabelType,
  PriorityBucket,
  State,
  Ticket,
} from '../../types/tickets/ticket';
import TicketsService from '../../api/TicketsService';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValueFormatterParams,
} from '@mui/x-data-grid';
import { Link } from 'react-router-dom';
import { mapToStateOptions } from '../../utils/helpers/tickets/stateUtils';
import CustomStateSelection from '../../components/tickets/CustomStateSelection';
import GravatarWithTooltip from '../../components/GravatarWithTooltip';
import useJiraUserStore from '../../stores/JiraUserStore';
import { mapToUserOptions } from '../../utils/helpers/userUtils';
import CustomTicketAssigneeSelection from '../../components/tickets/CustomTicketAssigneeSelection';
import { Card } from '@mui/material';
import { TableHeaders } from '../../components/TableHeaders';
import { mapToLabelOptions } from '../../utils/helpers/tickets/labelUtils';
import CustomTicketLabelSelection from '../../components/tickets/CustomTicketLabelSelection';
import { mapToIterationOptions } from '../../utils/helpers/tickets/iterationUtils';
import CustomIterationSelection from '../../components/tickets/CustomIterationSelection';
import { mapToPriorityOptions } from '../../utils/helpers/tickets/priorityUtils';
import CustomPrioritySelection from '../../components/tickets/CustomPrioritySelection';
import axios from 'axios';

function TicketsBacklog() {
  const {
    setTickets,
    tickets,
    setAvailableStates,
    availableStates,
    setLabelTypes,
    labelTypes,
    setIterations,
    iterations,
    priorityBuckets,
    setPriorityBuckets,
  } = useTicketStore();
  const { fetching, jiraUsers, fetchJiraUsers } = useJiraUserStore();
  const [loading, setLoading] = useState(true);

  const heading = 'Backlog';

  useEffect(() => {
    if (jiraUsers.length === 0) {
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
        }, 1000);
      })
      .catch(err => console.log(err));
    TicketsService.getAllLabelTypes()
      .then((labelTypes: LabelType[]) => {
        setLabelTypes(labelTypes);
      })
      .catch(err => {
        console.log(err);
      });

    TicketsService.getAllIterations()
      .then((iterations: Iteration[]) => {
        setIterations(iterations);
      })
      .catch(err => {
        console.log(err);
      });

    TicketsService.getAllPriorityBuckets()
      .then((buckets: PriorityBucket[]) => {
        setPriorityBuckets(buckets);
      })
      .catch(err => {
        console.log(err);
      });
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
        <GravatarWithTooltip username={params.value} userList={jiraUsers} />
      ),
    },
    {
      field: 'priorityBucket',
      headerName: 'Priority',
      minWidth: 150,
      maxWidth: 150,
      valueOptions: mapToPriorityOptions(priorityBuckets),
      type: 'singleSelect',
      valueGetter: (
        params: GridRenderCellParams<any, PriorityBucket>,
      ): string | undefined => {
        return params.value?.name;
      },
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <CustomPrioritySelection
          id={params.id as string}
          priorityBucketList={priorityBuckets}
          priorityBucket={params.value}
        />
      ),
    },
    {
      field: 'iteration',
      headerName: 'Iteration',
      minWidth: 150,
      maxWidth: 150,
      type: 'singleSelect',
      valueOptions: mapToIterationOptions(iterations),
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <CustomIterationSelection
          id={params.id as string}
          iterationList={iterations}
          iteration={params.value}
        />
      ),
      valueGetter: (
        params: GridRenderCellParams<any, Iteration>,
      ): string | undefined => {
        return params.value?.name;
      },
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
      valueGetter: (
        params: GridRenderCellParams<any, State>,
      ): string | undefined => {
        return params.value?.label;
      },
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
        );
      },
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
      valueOptions: mapToLabelOptions(labelTypes),
      // This and the value getter might look bizarre, but it is necassary to be able to filter
      // on a multi select field
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => {
        const items = params.value?.split(',');
        if (items && items[0] === '') {
          items.pop();
        }

        return (
          <CustomTicketLabelSelection
            labelTypeList={labelTypes}
            labels={items}
            id={params.id as string}
          />
        );
      },
      valueGetter: (params: GridRenderCellParams<any, LabelType[]>): string => {
        const values = params.value?.map((labelType: LabelType) => {
          return labelType?.id.toString() + '|' + labelType?.name;
        });
        if (values === undefined) return '';
        return values?.toString();
      },
    },
  ];

  return (
    <>
      {fetching || loading ? (
        <></>
      ) : (
        <Card>
          <DataGrid
            //   density={true ? 'compact' : 'standard'}
            density="compact"
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
                textDecoration: 'underline',
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
            slots={{ toolbar: TableHeaders }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
                tableName: heading,
              },
            }}
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
      )}
    </>
  );
}

export default TicketsBacklog;
