import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbarQuickFilter,
  GridToolbarQuickFilterProps,
  GridValueFormatterParams,
} from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import {
  Classification,
  ClassificationStatus,
  FeedbackStatus,
  RebaseStatus,
  Task,
  TaskStatus,
  UserDetails,
  ValidationStatus,
} from '../types/task';
import { Chip, Grid, Stack, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import MainCard from './MainCard';

import { ReactNode, useState } from 'react';
import statusToColor from '../utils/statusToColor';
import { ValidationColor } from '../types/validationColor';
import { JiraUser } from '../types/JiraUserResponse.ts';

import {
  mapToUserNameArray,
  mapToUserOptions,
} from '../utils/helpers/userUtils.ts';
import CustomTaskAssigneeSelection from './tasks/CustomTaskAssigneeSelection.tsx';
import CustomTaskReviewerSelection from './tasks/CustomTaskReviewerSelection.tsx';
import { Typography } from '@mui/material';
import { CSSObject } from '@emotion/react';

interface TaskListProps {
  tasks: Task[];
  heading: string;
  dense?: boolean;
  // disable search, filter's etc
  naked?: boolean;
  jiraUsers: JiraUser[];
}

interface TableHeadersProps {
  tableName: string;
  showQuickFilter: boolean;
  quickFilterProps: GridToolbarQuickFilterProps;
}

function TableHeaders({ tableName }: TableHeadersProps) {
  return (
    <Stack direction={'row'} sx={{ padding: '1rem', alignItems: 'center' }}>
      <Typography
        variant="h1"
        sx={{ paddingRight: '1em', fontSize: '1.25rem' }}
      >
        {tableName}
      </Typography>
      <QuickSearchToolbar sx={{ marginLeft: 'auto' }} />
    </Stack>
  );
}

function QuickSearchToolbar(sx: CSSObject) {
  return (
    <Box
      sx={{
        p: 0.5,
        pb: 0,
        marginLeft: 'auto',
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
  if (formattedValue.params === undefined || formattedValue.params === '') {
    return <></>;
  }
  const message = formattedValue.params;
  const type: ValidationColor = statusToColor(message);

  return (
    <>
      <Chip color={type} label={message} size="small" variant="light" />
    </>
  );
}

function TasksList({
  tasks,
  heading,
  jiraUsers,
  dense = false,
  naked = false,
}: TaskListProps) {
  const columns: GridColDef[] = [
    {
      field: 'summary',
      headerName: 'Name',
      width: 150,
    },
    {
      field: 'key',
      headerName: 'Task ID',
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
      field: 'updated',
      headerName: 'Modified',
      minWidth: 100,
      flex: 1,
      maxWidth: 100,
      valueFormatter: ({ value }: GridValueFormatterParams<string>) => {
        const date = new Date(value);
        return date.toLocaleDateString('en-AU');
      },
    },
    { field: 'labels', headerName: 'Tickets', width: 150 },
    {
      field: 'branchState',
      headerName: 'Rebase',
      minWidth: 100,
      flex: 1,
      maxWidth: 200,
      valueOptions: Object.values(RebaseStatus),
      type: 'singleSelect',
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <ValidationBadge params={params.formattedValue} />
      ),
    },
    {
      field: 'latestClassificationJson',
      headerName: 'Classification',
      minWidth: 100,
      flex: 1,
      maxWidth: 200,
      valueOptions: Object.values(ClassificationStatus),
      type: 'singleSelect',

      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <ValidationBadge params={params.value} />
      ),

      valueGetter: (
        params: GridRenderCellParams<any, Classification>,
      ): string => {
        return params.value?.status as string;
      },
    },
    {
      field: 'latestValidationStatus',
      headerName: 'Validation',
      minWidth: 100,
      flex: 1,
      maxWidth: 200,
      valueOptions: Object.values(ValidationStatus),
      type: 'singleSelect',
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <ValidationBadge params={params.formattedValue} />
      ),
    },

    {
      field: 'status',
      headerName: 'Status',
      minWidth: 100,
      flex: 1,
      maxWidth: 200,
      valueOptions: Object.values(TaskStatus),
      type: 'singleSelect',
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <ValidationBadge params={params.formattedValue} />
      ),
    },
    {
      field: 'feedbackMessagesStatus',
      headerName: 'Feedback',
      width: 150,
      valueOptions: Object.values(FeedbackStatus),
      type: 'singleSelect',
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <ValidationBadge params={params.formattedValue} />
      ),
    },
    {
      field: 'assignee',
      headerName: 'Owner',
      minWidth: 200,
      flex: 1,
      maxWidth: 200,
      type: 'singleSelect',
      valueOptions: mapToUserOptions(jiraUsers),
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <CustomTaskAssigneeSelection
          user={params.value}
          userList={jiraUsers}
          id={params.id as string}
        />
      ),
      valueGetter: (params: GridRenderCellParams<any, UserDetails>): string => {
        return params.value?.username as string;
      },
    },
    {
      field: 'reviewers',
      headerName: 'Reviewers',
      width: 300,
      type: 'singleSelect',
      filterable: false,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams<any, string[]>): ReactNode => (
        <CustomTaskReviewerSelection
          user={params.value}
          userList={jiraUsers}
          //callBack={updateAssignee}
          id={params.id as string}
        />
      ),
      valueGetter: (
        params: GridRenderCellParams<any, UserDetails[]>,
      ): string[] => {
        return params?.value ? mapToUserNameArray(params?.value) : [];
      },
    },
  ];
  return (
    <>
      <Grid container>
        <Grid item xs={12} lg={12}>
          <MainCard
            sx={{ width: '100%' }}
            contentSx={{ padding: 0, border: '1px solid red' }}
          >
            <DataGrid
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
                '& .MuiDataGrid-columnHeaders': {
                  border: 0,
                  borderTop: 0,
                  borderBottom: 1,
                  borderColor: 'rgb(240, 240, 240)',
                  borderRadius: 0,
                  backgroundColor: 'rgb(250, 250, 250)',
                  paddingLeft: '24px',
                  paddingRight: '24px',
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
              density={dense ? 'compact' : 'standard'}
              getRowId={(row: Task) => row.key}
              rows={tasks}
              columns={columns}
              disableColumnSelector
              hideFooterSelectedRowCount
              disableDensitySelector
              slots={!naked ? { toolbar: TableHeaders } : {}}
              slotProps={
                !naked
                  ? {
                      toolbar: {
                        showQuickFilter: true,
                        quickFilterProps: { debounceMs: 500 },
                        tableName: heading,
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
    </>
  );
}
export default TasksList;
