import useTaskStore from '../stores/TaskStore';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbarQuickFilter,
  GridValueFormatterParams,
} from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import { Assignee, Task } from '../types/task';
import { Chip, Grid } from '@mui/material';
import MainCard from './MainCard';
import { width } from '@mui/system';
import { ReactNode } from 'react';

interface TaskListProps {
  listAllTasks?: boolean;
  heading: string;
}
const columns: GridColDef[] = [
  { field: 'summary', headerName: 'Name', width: 150 },
  { field: 'key', headerName: 'Task ID', width: 150 },
  {
    field: 'updated',
    headerName: 'Modified',
    width: 150,
    valueFormatter: ({ value }: GridValueFormatterParams<string>) => {
      console.log(value);
      const date = new Date(value);
      return date.toLocaleDateString('en-AU');
    },
  },
  { field: 'labels', headerName: 'Tickets', width: 150 },
  { field: 'branchState', headerName: 'Rebase', width: 150 },
  { field: 'projectKey', headerName: 'Classification', width: 150 },
  {
    field: 'latestValidationStatus',
    headerName: 'Validation',
    width: 150,
    renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
      <ValidationBadge params={params.formattedValue} />
    ),
  },
  {
    field: 'feedbackMessagesStatus',
    headerName: 'Feedback',
    width: 150,
  },
  { field: 'status', headerName: 'Status', width: 150 },
  {
    field: 'assignee',
    headerName: 'Review',
    width: 150,
    valueFormatter: ({ value }: GridValueFormatterParams<Assignee>) =>
      value?.displayName,
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
  console.log(type);
  console.log(message);
  return (
    <>
      <Chip color={type} label={message} size="small" variant="light" />
    </>
  );
}

function TasksList({ listAllTasks, heading }: TaskListProps) {
  const { tasks, allTasks } = useTaskStore();
  const taskData = listAllTasks ? allTasks : tasks;

  return (
    <>
      <Grid container>
        <Grid item xs={12} lg={12}>
          <MainCard title={'My Tasks'} sx={{ width: '100%' }}>
            <DataGrid
              getRowId={(row: Task) => row.key}
              rows={taskData}
              columns={columns}
              disableColumnSelector
              disableDensitySelector
              slots={{ toolbar: QuickSearchToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 5 },
                },
              }}
              pageSizeOptions={[5, 10, 15, 20]}
              //checkboxSelection
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
