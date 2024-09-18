/* eslint-disable */
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValueFormatterParams,
} from '@mui/x-data-grid';

import {
  Classification,
  Task,
  TaskStatus,
  UserDetails,
} from '../../../types/task.ts';
import { Card, Chip, Grid } from '@mui/material';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import statusToColor from '../../../utils/statusToColor.ts';
import { ValidationColor } from '../../../types/validationColor.ts';

import { userExistsInList } from '../../../utils/helpers/userUtils.ts';
import { TableHeaders } from '../../../components/TableHeaders.tsx';
import {
  useInitializeUserReviewTasks,
  useInitializeUserTasks,
} from '../../../hooks/api/useAllTasks.tsx';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import { unavailableTasksErrorHandler } from '../../../types/ErrorHandler.ts';
import useTaskStore from '../../../stores/TaskStore.ts';
import useUserStore from '../../../stores/UserStore.ts';
import { Link } from 'react-router-dom';
import { getAllKeyValueMapForTheKey } from '../../../utils/helpers/FieldBindingUtils.ts';
import { useFieldBindings } from '../../../hooks/api/useInitializeConfig.tsx';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore.ts';

interface UserTaskListProps {
  propTasks?: Task[];
  heading: string;
  dense?: boolean;
  // disable search, filter's etc
  naked?: boolean;
  // jiraUsers: JiraUser[];
}

function ValidationBadge(formattedValue: {
  params: string | undefined;
  label: string | undefined;
}) {
  // have to look up how to do an enum with the message,
  // because obviously this is something you can do with ts
  // the message should be a set of values, will have to look through snomeds doc
  // pending and completed are total guesses
  if (formattedValue.params === undefined || formattedValue.params === '') {
    return <></>;
  }
  const type: ValidationColor = statusToColor(formattedValue.params);

  return (
    <>
      <Chip color={type} label={formattedValue.label} size="small" />
    </>
  );
}

function UserTasksList({
  propTasks,
  heading,
  dense = false,
  naked = false,
}: UserTaskListProps) {
  const { fieldBindings } = useFieldBindings(
    useApplicationConfigStore.getState().applicationConfig?.apDefaultBranch,
  );
  const { userTasksData, userTasksIsLoading } = useInitializeUserTasks();
  const { userReviewTasksData, userReviewTasksIsLoading } =
    useInitializeUserReviewTasks();
  const { serviceStatus } = useServiceStatus();
  const { login } = useUserStore();
  const { userTasks, userReviewTasks } = useTaskStore();

  const [localTasks, setLocalTasks] = useState(propTasks ? propTasks : []);
  const validationStatusMap = getAllKeyValueMapForTheKey(
    fieldBindings,
    'task.validation.status',
  );
  const branchStateMap = getAllKeyValueMapForTheKey(
    fieldBindings,
    'task.branch.state',
  );
  const classificationStatusMap = getAllKeyValueMapForTheKey(
    fieldBindings,
    'task.classification.status',
  );
  const feedbackStatusMap = getAllKeyValueMapForTheKey(
    fieldBindings,
    'task.feedback.status',
  );

  useEffect(() => {
    if (propTasks !== undefined) {
      setLocalTasks(propTasks);
    }
  }, [propTasks]);

  const getFilteredUserReviewTasks = useCallback(() => {
    return userReviewTasks.filter(task => {
      if (userExistsInList(task.reviewers, login)) {
        return true;
      }
    });
  }, [userReviewTasks, userExistsInList]);

  useEffect(() => {
    setLocalTasks([...userTasks, ...getFilteredUserReviewTasks()]);
  }, [userTasks, getFilteredUserReviewTasks]);

  useEffect(() => {
    if (!serviceStatus?.authoringPlatform.running) {
      unavailableTasksErrorHandler();
    }
  }, []);
  const columns: GridColDef[] = [
    {
      field: 'projectKey',
      headerName: 'Project',
      width: 100,
    },
    {
      field: 'summary',
      headerName: 'Task Name',
      width: 150,
    },
    {
      field: 'key',
      headerName: 'Task ID',
      minWidth: 90,
      flex: 1,
      maxWidth: 90,
      valueGetter: (params: GridRenderCellParams<any, string>): Task => {
        return params.row;
      },
      renderCell: (params: GridRenderCellParams<any, Task>): ReactNode =>
        naked ? (
          <>{params.value?.key.toString()}</>
        ) : (
          <Link
            to={`task/${params.value?.projectKey}/${params.value?.key}`}
            className={'task-details-link'}
          >
            {params.value?.key.toString()}
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
    {
      field: 'branchState',
      headerName: 'Rebase',
      minWidth: 100,
      flex: 1,
      maxWidth: 200,
      valueOptions: Array.from(branchStateMap.entries()).map(
        ([key, value]) => ({
          value: key,
          label: value,
        }),
      ),
      type: 'singleSelect',
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <ValidationBadge
          params={params.value}
          label={branchStateMap.get(params.value)}
        />
      ),
    },
    {
      field: 'latestClassificationJson',
      headerName: 'Classification',
      minWidth: 100,
      flex: 1,
      maxWidth: 150,
      valueOptions: Array.from(classificationStatusMap.entries()).map(
        ([key, value]) => ({
          value: key,
          label: value,
        }),
      ),
      type: 'singleSelect',

      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <ValidationBadge
          params={params.value}
          label={classificationStatusMap.get(params.value)}
        />
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
      valueOptions: Array.from(validationStatusMap.entries()).map(
        ([key, value]) => ({
          value: key,
          label: value,
        }),
      ),
      type: 'singleSelect',
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <ValidationBadge
          params={params.value}
          label={validationStatusMap.get(params.value)}
        />
      ),
    },

    {
      field: 'status',
      headerName: 'Status',
      minWidth: 100,
      flex: 1,
      maxWidth: 150,
      valueOptions: Object.values(TaskStatus),
      type: 'singleSelect',
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <ValidationBadge
          params={params.formattedValue}
          label={params.formattedValue}
        />
      ),
    },
    {
      field: 'feedbackMessagesStatus',
      headerName: 'Feedback',
      width: 150,
      valueOptions: Array.from(feedbackStatusMap.entries()).map(
        ([key, value]) => ({
          value: key,
          label: value,
        }),
      ),
      type: 'singleSelect',
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <ValidationBadge
          params={params.value}
          label={feedbackStatusMap.get(params.value)}
        />
      ),
    },
    {
      field: 'assignee',
      headerName: 'Owner',
      minWidth: 200,
      maxWidth: 200,
      valueGetter: (params: GridRenderCellParams<any, UserDetails>): string => {
        return params.value?.displayName as string;
      },
    },
    {
      field: 'reviewers',
      headerName: 'Reviewers',

      minWidth: 150,
      flex: 1,
      maxWidth: 250,
      valueFormatter: ({
        value,
      }: GridValueFormatterParams<UserDetails[]>): string => {
        return value ? value.map(u => u.displayName).join(', ') : '';
      },
    },
  ];
  return (
    <>
      <Grid container>
        <Grid item xs={12} lg={12}>
          <Card sx={{ width: '100%', border: '2px solid rgb(240, 240, 240)' }}>
            <DataGrid
              loading={
                !propTasks &&
                (userTasksIsLoading || userReviewTasksIsLoading) &&
                (userTasksData === undefined ||
                  userReviewTasksData === undefined) &&
                serviceStatus?.authoringPlatform.running
              }
              sx={{
                fontWeight: 400,
                fontSize: 14,
                borderRadius: 0,
                border: 0,
                // height: '100%',
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
                '& .MuiDataGrid-virtualScroller': {
                  minHeight: '36px',
                },
              }}
              className={'task-list'}
              density={dense ? 'compact' : 'standard'}
              getRowId={(row: Task) => row.key}
              rows={localTasks}
              columns={
                !naked
                  ? columns
                  : columns.map(col => ({ ...col, sortable: false }))
              }
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
                        paginationModel: { page: 0, pageSize: 10 },
                      },
                    }
                  : {}
              }
              pageSizeOptions={!naked ? [10, 15, 20, 25] : []}
              disableColumnFilter={naked}
              disableColumnMenu={naked}
              disableRowSelectionOnClick={naked}
              hideFooter={naked}
            />
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
export default UserTasksList;
