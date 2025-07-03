// import useTaskById from '../../../../hooks/useTaskById.tsx';
import { useConceptsForReview } from '../../../../hooks/api/task/useConceptsForReview.js';
import useTaskById from '../../../../hooks/useTaskById.tsx';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { Box, Paper, Typography } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useShowReviewControls } from '../../../../hooks/api/task/useReviews.tsx';
import { Link } from 'react-router-dom';
import { useApproveReviewMutation } from '../../../../hooks/api/task/useApproveReviewMutation.tsx';
import { Task } from '../../../../types/task.ts';
import { Button } from '@mui/material';
import { useConceptsThatHaveBeenReviewed } from '../../../../hooks/api/task/useConceptsThatHaveBeenReviewed.tsx';

function ConceptReviewList() {
  const task = useTaskById();
  const projectKey = task?.projectKey;
  const taskKey = task?.key;
  const { conceptsReviewed } = useConceptsThatHaveBeenReviewed(projectKey, taskKey, true);
  const { conceptReviews } = useConceptsForReview(task?.branchPath);
  const showReviewControls = useShowReviewControls({ task });
  const approveReviewMutation = useApproveReviewMutation();

  if (!showReviewControls) {
    return <></>;
  }

  const handleDisapproveAll = () => {
    if (task) {
      approveReviewMutation.mutate({
        projectKey: task.projectKey,
        taskKey: task.key,
        reviewedList: {conceptIds: [], approvalDate: ''}, // Empty array to disapprove all
      });
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'idAndFsnTerm',
      headerName: 'Concept Details',
      flex: 1,
      minWidth: 250,
      valueGetter: params => {
        return params.row.concept?.idAndFsnTerm || 'Unknown Concept';
      },
      renderCell: params => (
        <Box
          sx={{
            py: 1.5,
            pr: 1,
            display: 'flex',
            alignItems: 'center',
            minHeight: '100%',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              lineHeight: 1.4,
              fontSize: '0.9rem',
              color: 'text.primary',
              fontWeight: 500,
            }}
          >
            <Link to={`review/${params.row.concept?.conceptId}`}>
              {params.value}
            </Link>
          </Typography>
        </Box>
      ),
    },
    {
      field: 'approved',
      headerName: 'Status',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => {
        return params.row.approved ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'success.main',
            }}
          >
            <CheckCircle fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Approved
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontStyle: 'italic',
            }}
          >
            Pending
          </Typography>
        );
      },
    },
  ];

  return (
    <Box sx={{ mt: 2 }}>
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'grey.50',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: 0.5,
              }}
            >
              Concept Review Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and approval status for concepts in this task
            </Typography>
          </Box>
          <Button
            disabled={conceptsReviewed === undefined || conceptsReviewed?.conceptIds.length === 0}
            size='small'
            variant="outlined"
            onClick={handleDisapproveAll}
            disabled={approveReviewMutation.isPending}
            sx={{
              color: 'error.main',
              borderColor: 'error.main',
              '&:hover': {
                borderColor: 'error.dark',
                backgroundColor: 'error.light',
              },
            }}
          >
            {approveReviewMutation.isPending ? 'Processing...' : 'Disapprove All'}
          </Button>
        </Box>

        <DataGrid
          rows={conceptReviews}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
              },
            },
          }}
          pageSizeOptions={[5, 10]}
          getRowId={row => row.conceptId || Math.random().toString()}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 600,
              fontSize: '0.9rem',
              borderBottom: 'none',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid',
              borderColor: 'divider',
              py: 0,
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              '&:nth-of-type(even)': {
                backgroundColor: 'grey.25',
              },
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '2px solid',
              borderColor: 'divider',
              backgroundColor: 'grey.50',
            },
          }}
          getRowHeight={() => 'auto'}
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
}

export default ConceptReviewList;

