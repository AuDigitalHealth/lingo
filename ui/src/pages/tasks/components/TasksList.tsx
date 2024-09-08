/* eslint-disable */
import {
  DataGrid,
  GridCellParams,
  GridColDef,
  GridRenderCellParams,
  GridValueFormatterParams,
} from '@mui/x-data-grid';

import {
  Classification,
  ClassificationStatus,
  FeedbackStatus,
  RebaseStatus,
  Task,
  TaskStatus,
  UserDetails,
  ValidationStatus,
} from '../../../types/task.ts';
import { Card, Chip, Grid } from '@mui/material';
import { Link } from 'react-router-dom';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import statusToColor from '../../../utils/statusToColor.ts';
import { ValidationColor } from '../../../types/validationColor.ts';

import {
  isUserExists,
  mapToUserNameArray,
  mapToUserOptions,
  isUserExistsInList,
  userExistsInList,
} from '../../../utils/helpers/userUtils.ts';
import CustomTaskAssigneeSelection from './CustomTaskAssigneeSelection.tsx';
import CustomTaskReviewerSelection from './CustomTaskReviewerSelection.tsx';
import { TableHeaders } from '../../../components/TableHeaders.tsx';
import TasksActionBar from './TasksActionBar.tsx';
import AuthoringPlatformLink from '../../../components/AuthoringPlatformLink.tsx';
import { useAllTasks } from '../../../hooks/api/useAllTasks.tsx';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore.ts';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import { unavailableTasksErrorHandler } from '../../../types/ErrorHandler.ts';
import useUserStore from '../../../stores/UserStore.ts';
import { TaskStatusIcon } from '../../../components/icons/TaskStatusIcon.tsx';
import { getTaskAssociationsByTaskId } from '../../../hooks/useGetTaskAssociationsByTaskId.tsx';
import { useAllTaskAssociations } from '../../../hooks/api/useInitializeTickets.tsx';
import { useJiraUsers } from '../../../hooks/api/useInitializeJiraUsers.tsx';

interface TaskListProps {
  path?: '' | '/all' | '/needReview';
  propTasks?: Task[];
  heading: string;
  dense?: boolean;
  // disable search, filter's etc
  naked?: boolean;
  showActionBar?: boolean;
  // jiraUsers: JiraUser[];
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
      <Chip color={type} label={message} size="small" />
    </>
  );
}

function TasksList({
  path,
  propTasks,
  heading,
  dense = false,
  naked = false,
  showActionBar = true,
}: TaskListProps) {
  const { jiraUsers } = useJiraUsers();
  const { taskAssociationsData } = useAllTaskAssociations();
  const { applicationConfig } = useApplicationConfigStore();
  const { allTasksIsLoading } = useAllTasks();
  const { serviceStatus } = useServiceStatus();
  const { email, login } = useUserStore();

  const { allTasks } = useAllTasks();

  const [localTasks, setLocalTasks] = useState(propTasks ? propTasks : []);

  useEffect(() => {
    if (path === undefined || path === null) return;
    if (path === '/all') {
      setLocalTasks(allTasks ? allTasks : []);
    } else if (path === '/needReview') {
      setLocalTasks(
        (() => {
          const tasksNeedReview = allTasks?.filter(function (task) {
            return task.status === TaskStatus.InReview;
          });
          return tasksNeedReview;
        })() || [],
      );
    } else {
      setLocalTasks(getFilteredMyTasks());
    }
  }, [path, allTasks]);

  useEffect(() => {
    if (propTasks !== undefined) {
      setLocalTasks(propTasks);
    }
  }, [propTasks]);

  const getFilteredMyTasks = useCallback(() => {
    if (!allTasks) return [];
    return allTasks?.filter(task => {
      if (
        task.assignee.email === email &&
        task.projectKey === applicationConfig?.apProjectKey
      ) {
        return true;
      }
      if (userExistsInList(task.reviewers, login)) {
        return true;
      }
    });
  }, [allTasks, userExistsInList]);

  useEffect(() => {
    if (!serviceStatus?.authoringPlatform.running) {
      unavailableTasksErrorHandler();
    }
  }, []);
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
        <AuthoringPlatformLink
          to={`/dashboard/tasks/edit/${params.value}`}
          className={'task-details-link'}
        >
          {params.value!.toString()}
        </AuthoringPlatformLink>
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
      field: 'labels',
      headerName: 'Tickets',
      width: 150,
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => {
        const associatedTickets = getTaskAssociationsByTaskId(
          params.row.key,
          taskAssociationsData,
        );
        return (
          <>
            {associatedTickets.map((associatedTicket, index) => (
              <Link
                to={`/dashboard/tickets/backlog/individual/${associatedTicket.ticketNumber}`}
                className={'task-details-link'}
                key={associatedTicket.ticketNumber}
              >
                {associatedTicket.ticketNumber}
                {index !== associatedTickets.length - 1 ? ', ' : ''}
              </Link>
            ))}
          </>
        );
      },
      valueGetter: (params: GridRenderCellParams<any, any>): string => {
        const associatedTickets = getTaskAssociationsByTaskId(
          params.row.key,
          taskAssociationsData,
        );
        let allTickets = '';
        associatedTickets.forEach((associatedTicket, index) => {
          allTickets += associatedTicket.ticketId;
          if (index !== associatedTickets.length - 1) allTickets += ',';
        });
        return allTickets;
      },
    },
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
      maxWidth: 150,
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
      valueOptions: Object.values(TaskStatus),
      type: 'singleSelect',
      renderCell: (
        params: GridRenderCellParams<any, TaskStatus | undefined>,
      ): ReactNode => <TaskStatusIcon status={params.formattedValue} />,
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
      minWidth: 100,
      maxWidth: 100,
      type: 'singleSelect',
      valueOptions: mapToUserOptions(jiraUsers),
      getApplyQuickFilterFn: (value: string) => {
        if (!value) {
          return null;
        }
        return (params: GridCellParams): boolean => {
          return isUserExists(params.value as string, jiraUsers, value);
        };
      },
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

      minWidth: 150,
      flex: 1,
      maxWidth: 250,
      type: 'singleSelect',
      filterable: false,
      sortable: false,
      disableColumnMenu: true,
      getApplyQuickFilterFn: (value: string) => {
        if (!value) {
          return null;
        }
        return (params: GridCellParams): boolean => {
          return isUserExistsInList(params.value as string[], value, jiraUsers);
        };
      },
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
      {showActionBar && <TasksActionBar />}

      <Grid container>
        <Grid item xs={12} lg={12}>
          <Card sx={{ width: '100%', border: '2px solid rgb(240, 240, 240)' }}>
            <DataGrid
              loading={
                allTasksIsLoading &&
                allTasks === undefined &&
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
                  alignItems: 'center',
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
                // '& .MuiSvgIcon-root': {
                //   color: '#003665',
                // },
                '& .MuiDataGrid-virtualScroller': {
                  minHeight: '36px',
                },
              }}
              className={'task-list'}
              density={dense ? 'compact' : 'standard'}
              getRowId={(row: Task) => row.key}
              rows={localTasks}
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
export default TasksList;
