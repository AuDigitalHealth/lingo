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
  Task,
  TaskStatus,
  UserDetails,
} from '../../../types/task.ts';
import { Card, Chip, Grid } from '@mui/material';
import { Link } from 'react-router-dom';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import statusToColor from '../../../utils/statusToColor.ts';
import { ValidationColor } from '../../../types/validationColor.ts';

import { parseISO } from 'date-fns';

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
import { useFieldBindings } from '../../../hooks/api/useInitializeConfig.tsx';
import { getAllKeyValueMapForTheKey } from '../../../utils/helpers/FieldBindingUtils.ts';
import message from '../../../layouts/MainLayout/Header/HeaderContent/Message.tsx';
import { Project } from '../../../types/Project.ts';

interface TaskListProps {
  propTasks: Task[];
  heading: string;
  dense?: boolean;
  loading: boolean;
  naked?: boolean;
  showActionBar?: boolean;
  displayProject?: boolean;
  displayTickets?: boolean;
  isSnodineList?: boolean;
  taskCreateRedirectUrl: string;
  projectOptions?: Project[];
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

function TasksList({
  loading,
  propTasks,
  heading,
  dense = false,
  naked = false,
  showActionBar = true,
  displayTickets = true,
  isSnodineList = false,
  displayProject,
  taskCreateRedirectUrl,
  projectOptions,
}: TaskListProps) {
  const { jiraUsers } = useJiraUsers();
  const { taskAssociationsData } = useAllTaskAssociations();
  const { applicationConfig } = useApplicationConfigStore();
  const { fieldBindings } = useFieldBindings(applicationConfig.apDefaultBranch);
  const { serviceStatus } = useServiceStatus();

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
    if (!serviceStatus?.authoringPlatform.running) {
      unavailableTasksErrorHandler();
    }
  }, []);

  const projectColumn = {
    field: 'projectKey',
    headerName: 'Project',
    width: 100,
  };

  const ticketsColumn = {
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
  };

  const taskIdColumn = {
    field: 'key',
    headerName: 'Task ID',
    minWidth: 90,
    flex: 1,
    maxWidth: 90,
    valueGetter: (params: GridRenderCellParams<any, string>): Task => {
      return params.row;
    },
    type: 'string',
    sortComparator: (v1: any, v2: any, param1: any, param2: any) => {
      // Sort by the task's key property
      const key1 = param1.value?.key || '';
      const key2 = param2.value?.key || '';

      // Fallback to string comparison
      return key1.localeCompare(key2);
    },
    renderCell: (params: GridRenderCellParams<any, Task>): ReactNode => {
      if (isSnodineList) {
        return naked ? (
          <>{params.value?.key.toString()}</>
        ) : (
          <Link
            to={`task/${params.value?.projectKey}/${params.value?.key}`}
            className={'task-details-link'}
          >
            {params.value?.key.toString()}
          </Link>
        );
      }
      return (
        <AuthoringPlatformLink
          to={`/dashboard/tasks/edit/${params.value?.key}`}
          className={'task-details-link'}
        >
          {params.value!.key?.toString()}
        </AuthoringPlatformLink>
      );
    },
  };

  const columns: GridColDef[] = [
    ...(displayProject ? [projectColumn] : []),
    {
      field: 'summary',
      headerName: 'Name',
      width: 150,
    },
    taskIdColumn,
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
    ...(displayTickets ? [ticketsColumn] : []),
    {
      field: 'branchState',
      headerName: 'Rebase',
      width: 120,
      align: 'center',
      headerAlign: 'center',
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
      width: 120,
      align: 'center',
      headerAlign: 'center',
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
        return params?.value?.status as string;
      },
    },
    {
      field: 'latestValidationStatus',
      headerName: 'Validation',
      width: 120,
      align: 'center',
      headerAlign: 'center',
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
      align: 'center',
      headerAlign: 'center',
      valueOptions: Object.values(TaskStatus),
      type: 'singleSelect',
      renderCell: (
        params: GridRenderCellParams<any, TaskStatus | undefined>,
      ): ReactNode => <TaskStatusIcon status={params.formattedValue} />,
    },
    {
      field: 'feedbackMessagesStatus',
      headerName: 'Feedback',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      valueOptions: Array.from(feedbackStatusMap.entries()).map(
        ([key, value]) => ({
          value: key, // Use the key for the actual value
          label: value, // Override with custom text for the dropdown
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
      width: 100,
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
          id={(params.id as string) || ''}
        />
      ),
      valueGetter: (params: GridRenderCellParams<any, UserDetails>): string => {
        return params.value?.username as string;
      },
    },
    {
      field: 'reviewers',
      headerName: 'Reviewers',
      width: 350,
      type: 'singleSelect',
      filterable: false,
      sortable: true,
      sortComparator: (v1, v2, param1, param2) => {
        // commented because it is not super clear what the values are/should be here.
        const valueA = param1.value; // Array of strings
        const valueB = param2.value;
        const idA = param1.rowNode.id; // Fallback ID
        const idB = param2.rowNode.id;

        // Prioritize rows with empty value arrays
        if (valueA.length === 0 && valueB.length !== 0) {
          return -1;
        }
        if (valueA.length !== 0 && valueB.length === 0) {
          return 1;
        }

        // Compare based on elements within the value arrays
        const len = Math.min(valueA.length, valueB.length);
        for (let i = 0; i < len; i++) {
          if (valueA[i] < valueB[i]) {
            return -1;
          }
          if (valueA[i] > valueB[i]) {
            return 1;
          }
        }

        // Handle unequal lengths - shorter array comes first
        if (valueA.length < valueB.length) {
          return -1;
        }
        if (valueA.length > valueB.length) {
          return 1;
        }

        // Fallback to sorting by rowNode.id if value arrays are completely equal
        if (idA < idB) {
          return -1;
        }
        if (idA > idB) {
          return 1;
        }

        return 0;
      },
      disableColumnMenu: true,
      getApplyQuickFilterFn: (value: string) => {
        if (!value) {
          return null;
        }
        return (params: GridCellParams): boolean => {
          return isUserExistsInList(params.value as string[], value, jiraUsers);
        };
      },
      renderCell: (params: GridRenderCellParams<any, string[]>): ReactNode => {
        return (
          <CustomTaskReviewerSelection
            user={params.value}
            userList={jiraUsers}
            id={params.id as string}
          />
        );
      },
      valueGetter: (
        params: GridRenderCellParams<any, UserDetails[]>,
      ): string[] => {
        return params?.value ? mapToUserNameArray(params?.value) : [];
      },
    },
  ];
  return (
    <>
      {showActionBar && projectOptions && (
        <TasksActionBar
          redirectUrl={taskCreateRedirectUrl}
          projectsOptions={projectOptions}
        />
      )}

      <Grid container>
        <Grid item xs={12} lg={12}>
          <Card sx={{ width: '100%', border: '2px solid rgb(240, 240, 240)' }}>
            <DataGrid
              loading={loading}
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
              rows={propTasks}
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
                      sorting: {
                        sortModel: [{ field: 'key', sort: 'desc' }],
                      },
                    }
                  : {
                      sorting: {
                        sortModel: [{ field: 'key', sort: 'desc' }],
                      },
                    }
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
