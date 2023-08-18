import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbarQuickFilter,
  GridValueFormatterParams,
} from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import { Assignee, Classification, ClassificationStatus, Reviewer, Task, TaskStatus, ValidationStatus } from '../types/task';
import { Chip, Grid, Link, Stack, Typography, Tooltip } from '@mui/material';
import MainCard from './MainCard';

import { ReactNode } from 'react';
import Gravatar from 'react-gravatar';
import statusToColor from '../utils/statusToColor';
import { ValidationColor } from '../types/validationColor';

interface TaskListProps {
  tasks: Task[];
  heading: string;
  dense?: boolean;
  // disable search, filter's etc
  naked?: boolean;
}

const columns: GridColDef[] = [
  { field: 'summary', headerName: 'Name', width: 150 },
  {
    field: 'key',
    headerName: 'Task ID',
    minWidth: 90,
    flex: 1,
    renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
      <Link href={`/dashboard/tasks/edit/${params.value}`}>
        {params.value!.toString()}
      </Link>
    ),
  },
  {
    field: 'updated',
    headerName: 'Modified',
    minWidth: 90,
    flex: 1,
    valueFormatter: ({ value }: GridValueFormatterParams<string>) => {
      const date = new Date(value);
      return date.toLocaleDateString('en-AU');
    },
  },
  { field: 'labels', headerName: 'Tickets', width: 150 },
  { field: 'branchState', headerName: 'Rebase', width: 150 },
  {
    field: 'latestClassificationJson',
    headerName: 'Classification',
    minWidth: 150,
    flex: 1,
    renderCell: (
      params: GridRenderCellParams<any, Classification>,
    ): ReactNode => <ValidationBadge params={params.value?.status} />,
  },
  {
    field: 'latestValidationStatus',
    headerName: 'Validation',
    minWidth: 150,
    flex: 1,
    renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
      <ValidationBadge params={params.formattedValue} />
    ),
  },

  {
    field: 'status',
    headerName: 'Status',
    minWidth: 150,
    flex: 1,
    renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
      <ValidationBadge params={params.formattedValue} />
    ),
  },
  {
    field: 'assignee',
    headerName: 'Owner',
    minWidth: 90,
    flex: 1,

    renderCell: (params: GridRenderCellParams<any, Assignee>): ReactNode => (
      <Tooltip title={params.value?.displayName} followCursor>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 0.5 }}>
          <Gravatar
            email={params.value?.email}
            rating="pg"
            default="monsterid"
            style={{ borderRadius: '50px' }}
            size={30}
            className="CustomAvatar-image"
          />
        </Stack>
      </Tooltip>
    ),
  },
  {
    field: 'reviewers',
    headerName: 'Reviewers',
    minWidth: 120,
    flex: 1,
    renderCell: (params: GridRenderCellParams<any, Reviewer[]>): ReactNode => {
      if (params.value) {
        const reviewers = params.value;
        const ordersWithLinks = reviewers.map((reviewer, index) => (
          <Tooltip title={reviewer.displayName} followCursor>
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
    minWidth: 150,
    flex: 1,
  },
];

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
  // if theres no message, let's put nothing
  if( formattedValue.params === undefined ){
    return <></>
  }
  
  const message = formattedValue.params;
  let type: ValidationColor;
  type = statusToColor(message);
  return (
    <>
      <Chip color={type} label={message} size="small" variant="light" />
    </>
  );
}

function TasksList({
  tasks,
  heading,
  dense = false,
  naked = false,
}: TaskListProps) {
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
