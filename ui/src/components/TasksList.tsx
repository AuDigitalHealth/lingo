import useTaskStore from '../stores/TaskStore';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbarQuickFilter,
  GridValueFormatterParams,
} from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import {Classification, Task, UserDetails} from '../types/task';
import { Chip, Grid, Link, Stack, Tooltip } from '@mui/material';
import MainCard from './MainCard';

import { ReactNode, useState } from 'react';
import Gravatar from 'react-gravatar';
import statusToColor from '../utils/statusToColor';
import { ValidationColor } from '../types/validationColor';

import CustomTaskAutoComplete from '../utils/helpers/CustomTaskAutoComplete.tsx';
import { JiraUser } from '../types/JiraUserResponse.ts';
import TasksServices from '../api/TasksService.ts';
import taskStore from '../stores/TaskStore.ts';

interface TaskListProps {
  tasks: Task[];
  heading: string;
  dense?: boolean;
  // disable search, filter's etc
  naked?: boolean;
  jiraUsers: JiraUser[];
}

function QuickSearchToolbar() {
  return (
    <Box
      sx={{
        p: 0.5,
        pb: 0,
      }}
    >
      <GridToolbarQuickFilter
        quickFilterParser={(searchInput: string) =>
          searchInput
            .split(',')
            .map(value => value.trim())
            .filter(value => value !== '')
        }
      />
    </Box>
  );
}

function ValidationBadge(formattedValue: { params: string | undefined }) {
  // have to look up how to do an enum with the message,
  // because obviously this is something you can do with ts
  // the message should be a set of values, will have to look through snomeds doc
  // pending and completed are total guesses
  enum ValidationColor {
    Error = 'error',
    Success = 'success',
    Info = 'info',
  }
  const message = formattedValue.params;
  let type: ValidationColor;
  switch (message) {
    case 'NOT_TRIGGERED':
      type = ValidationColor.Error;
      break;
    case 'PENDING':
      type = ValidationColor.Success;
      break;
    case 'COMPLETED':
    default:
      type = ValidationColor.Info;
  }
  return (
    <>
      <Chip color={type} label={message} size="small" variant="light" />
    </>
  );
}

function TasksList({ tasks, heading, jiraUsers,
                     dense = false,
                     naked = false}: TaskListProps) {
  const columns: GridColDef[] = [
    { field: 'summary', headerName: 'Name', width: 150 },
    {
      field: 'key',
      headerName: 'Task ID',
      width: 150,
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <Link href={`/dashboard/tasks/edit/${params.value}`}>
          {params.value!.toString()}
        </Link>
      ),
    },
    {
      field: 'updated',
      headerName: 'Modified',
      width: 150,
      valueFormatter: ({ value }: GridValueFormatterParams<string>) => {
        const date = new Date(value);
        return date.toLocaleDateString('en-AU');
      },
    },
    { field: 'labels', headerName: 'Tickets', width: 150 },
    {
      field: 'branchState',
      headerName: 'Rebase',
      width: 150,
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <ValidationBadge params={params.formattedValue} />
      ),
    },
    {
      field: 'latestClassificationJson',
      headerName: 'Classification',
      width: 150,
      renderCell: (
        params: GridRenderCellParams<any, Classification>,
      ): ReactNode => <ValidationBadge params={params.value?.status} />,
    },
    {
      field: 'latestValidationStatus',
      headerName: 'Validation',
      width: 150,
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <ValidationBadge params={params.formattedValue} />
      ),
    },

    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <ValidationBadge params={params.formattedValue} />
      ),
    },
    {
      field: 'assignee',
      headerName: 'Owner',
      width: 200,
      type: 'singleSelect',
      editable: true,
      valueOptions: ['senjo.kuzhiparambiljose@csiro.au', 'shhshhs'],
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <CustomTaskAutoComplete
          user={params.value}
          userList={jiraUsers}
          //callBack={updateAssignee}
          id={params.id as string}
        />
      ),
      valueGetter: (params: GridRenderCellParams<any, UserDetails>): string => {
        return params.value?.email as string;
      },
    },
    {
      field: 'reviewers',
      headerName: 'Reviewers',
      width: 200,
      renderCell: (
        params: GridRenderCellParams<any, UserDetails[]>,
      ): ReactNode => {
        if (params.value) {
          const reviewers = params.value;
          const ordersWithLinks = reviewers.map((reviewer, index) => (
            <Tooltip
              title={reviewer.displayName}
              followCursor
              key={reviewer.email}
            >
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ p: 0.5 }}
              >
                <Gravatar
                  email={reviewer.email}
                  rating="pg"
                  default="monsterid"
                  style={{ borderRadius: '50px' }}
                  size={30}
                  className="CustomAvatar-image"
                />
              </Stack>
            </Tooltip>
          ));
          return ordersWithLinks;
        }
      },
    },
    {
      field: 'feedbackMessagesStatus',
      headerName: 'Feedback',
      width: 150,
    },
  ];
  return (
    <>
      <Grid container>
        <Grid item xs={12} lg={12}>
          <MainCard title={heading} sx={{ width: '100%' }}>
            <DataGrid
              density={dense ? 'compact' : 'standard'}
              getRowId={(row: Task) => row.key}
              rows={tasks}
              columns={columns}
              disableColumnSelector
              disableDensitySelector
              slots={!naked ? { toolbar: QuickSearchToolbar } : {}}
              slotProps={
                !naked
                  ? {
                      toolbar: {
                        showQuickFilter: true,
                        quickFilterProps: { debounceMs: 500 },
                      },
                    }
                  : {}
              }
              initialState={
                !naked
                  ? {
                      pagination: {
                        paginationModel: { page: 0, pageSize: 5 },
                      },
                    }
                  : {}
              }
              pageSizeOptions={!naked ? [5, 10, 15, 20] : []}
              disableColumnFilter={naked}
              disableColumnMenu={naked}
              disableRowSelectionOnClick={naked}
              hideFooter={naked}
            />
          </MainCard>
        </Grid>
      </Grid>
      {/* <Box sx={{ height: 400, width: 1 }}>
        <h1>{heading}</h1>
        
      </Box> */}
    </>
  );
}
export default TasksList;
