import { useEffect, useState } from 'react';
import { Box, FormControl, IconButton, Stack, Tooltip } from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRowParams,
  GridValidRowModel,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import BaseModal from '../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../components/modal/BaseModalHeader.tsx';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import { Concept, Term } from '../../../types/concept.ts';
import ConceptDetailsModal from './ConceptDetailsModal.tsx';
import useBranch from '../../../hooks/eclRefset/useBranch.tsx';
import { useConceptsByIds } from '../../../hooks/eclRefset/useConceptsById.tsx';

interface TickFlickSyncConceptsModalProps {
  conceptIds: string[];
  title: string;
}

export default function TickFlickSyncConceptsModal({
  conceptIds,
  title,
}: TickFlickSyncConceptsModalProps) {
  const { serviceStatus } = useServiceStatus();
  const branch = useBranch();

  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const { data, isLoading } = useConceptsByIds(
    branch,
    open
      ? conceptIds.slice(
          paginationModel.page * paginationModel.pageSize,
          (paginationModel.page + 1) * paginationModel.pageSize,
        )
      : [],
  );

  const [concepts, setConcepts] = useState(Array<Concept>());
  const [modalConcept, setModalConcept] = useState<Concept>();

  useEffect(() => {
    if (!isLoading) {
      setConcepts(data ?? []);
    }
  }, [data, isLoading]);

  const columns: GridColDef[] = [
    {
      field: 'conceptId',
      headerName: 'Concept ID',
      width: 180,
      sortable: false,
    },
    {
      field: 'pt',
      headerName: 'Preferred Term',
      flex: 1,
      valueGetter: (params: GridValueGetterParams<GridValidRowModel, Term>) =>
        params.value?.term,
      sortable: false,
    },
    {
      field: 'actions',
      type: 'actions',
      width: 80,
      getActions: (params: GridRowParams<Concept>) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Show concept details">
              <InfoOutlinedIcon />
            </Tooltip>
          }
          label="Concept Info"
          onClick={() => setModalConcept(params.row)}
        />,
      ],
    },
  ];

  return (
    <>
      <Stack
        component="span"
        direction="row"
        onClick={() => setOpen(true)}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            textDecoration: 'underline',
          },
        }}
      >
        <Box component="span">View details</Box>
        <InfoOutlinedIcon sx={{ fontSize: '1.2em', ml: '4px', mt: '1px' }} />
      </Stack>
      <FormControl component="span" sx={{ display: 'none' }}>
        <BaseModal open={open} handleClose={handleClose}>
          <BaseModalHeader title={title} />
          <IconButton
            onClick={handleClose}
            aria-label="close"
            sx={{
              position: 'absolute',
              top: '0.5em',
              right: '0.5em',
            }}
          >
            <CloseIcon />
          </IconButton>
          <BaseModalBody
            sx={{
              width: 700,
              maxHeight: '85vh',
              padding: 0,
            }}
          >
            <Stack
              width="100%"
              spacing={1}
              sx={{
                maxHeight: '85vh',
              }}
            >
              <Stack spacing={1}>
                <DataGrid
                  loading={
                    isLoading && serviceStatus?.authoringPlatform.running
                  }
                  sx={{
                    fontSize: 14,
                    color: '#003665',
                    '& .MuiDataGrid-row': {
                      borderBottom: 1,
                      borderColor: 'rgb(240, 240, 240)',
                      paddingLeft: '12px',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: 'rgb(250, 250, 250)',
                      color: '#003665',
                      paddingLeft: '12px',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      border: 0,
                    },
                    '& .MuiTablePagination-root': {
                      color: '#003665',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#003665',
                    },
                    '.Mui-disabled .MuiSvgIcon-root': {
                      color: 'inherit',
                    },
                    '& .MuiDataGrid-virtualScroller': {
                      minHeight: '45px',
                      color: 'inherit',
                    },
                    '& .MuiDataGrid-withBorderColor': {
                      borderColor: 'rgb(240, 240, 240)',
                    },
                    '& .MuiDataGrid-cell:focus,.MuiDataGrid-cell:focus-within':
                      {
                        outline: 'none',
                      },
                  }}
                  getRowId={(row: Concept) => row.conceptId ?? ''}
                  rows={concepts}
                  rowSpacingType="border"
                  columns={columns}
                  disableColumnSelector
                  disableRowSelectionOnClick
                  hideFooterSelectedRowCount
                  disableDensitySelector
                  disableColumnMenu
                  density="compact"
                  pageSizeOptions={[10, 25, 50]}
                  paginationMode="server"
                  rowCount={conceptIds.length}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                />
              </Stack>
            </Stack>
          </BaseModalBody>
        </BaseModal>
      </FormControl>
      {modalConcept ? (
        <ConceptDetailsModal
          concept={modalConcept}
          handleClose={() => setModalConcept(undefined)}
        />
      ) : null}
    </>
  );
}
