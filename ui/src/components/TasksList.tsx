import useTaskStore from '../stores/TaskStore';
import { DataGrid, GridColDef, GridToolbarQuickFilter } from '@mui/x-data-grid';
import Box from '@mui/material/Box';

interface TaskListProps {
  listAllTasks?: boolean;
  heading: string;
}
const columns: GridColDef[] = [
  { field: 'summary', headerName: 'Name', width: 150 },
  { field: 'key', headerName: 'Task ID', width: 150 },
  { field: 'updated', headerName: 'Modified', width: 150 },
  { field: 'labels', headerName: 'Tickets', width: 150 },
  { field: 'branchState', headerName: 'Rebase', width: 150 },
  { field: 'projectKey', headerName: 'Classification', width: 150 },
  { field: 'latestValidationStatus', headerName: 'Validation', width: 150 },
  { field: 'feedbackMessagesStatus', headerName: 'Feedback', width: 150 },
  { field: 'status', headerName: 'Status', width: 150 },
  {
    field: 'assignee',
    headerName: 'Review',
    width: 150,
    valueFormatter: ({ value }) => value.displayName,
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

function TasksList({ listAllTasks, heading }: TaskListProps) {
  const { tasks, allTasks } = useTaskStore();
  const taskData = listAllTasks ? allTasks : tasks;

  return (
    <>
      <Box sx={{ height: 400, width: 1 }}>
        <h1>{heading}</h1>
        <DataGrid
          getRowId={row => row.key}
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
          //checkboxSelection
        />
      </Box>
    </>
  );
}
export default TasksList;
