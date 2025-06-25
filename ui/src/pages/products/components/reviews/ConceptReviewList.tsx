// import useTaskById from '../../../../hooks/useTaskById.tsx';
import { useConceptsForReview } from '../../../../hooks/api/task/useConceptsForReview.js';
import useTaskById from '../../../../hooks/useTaskById.tsx';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { Typography, Box, Paper } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useShowReviewControls } from '../../../../hooks/api/task/useReviews.tsx';

function ConceptReviewList() {
  const task = useTaskById();
  const { conceptReviews } = useConceptsForReview(task?.branchPath);
  const showReviewControls = useShowReviewControls({ task });
  if ((!conceptReviews || conceptReviews.length < 1) && showReviewControls) {
    return <></>;
  }

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
            {params.value}
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
          }}
        >
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
