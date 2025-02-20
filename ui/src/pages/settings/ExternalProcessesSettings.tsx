import React, { ReactNode, useState } from 'react';
import { ExternalProcess } from '../../types/tickets/ticket.ts';
import { Button, Card, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { PlusCircleOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import TicketsService from '../../api/TicketsService.ts';
import { externalProcessesQueryKey } from '../../types/queryKeys.ts';
import { Stack } from '@mui/system';
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { TableHeaders } from '../../components/TableHeaders.tsx';
import ExternalProcessesModal from './components/externalProcesses/ExternalProcessesModal.tsx';
import { useAllExternalProcesses } from '../../hooks/api/useInitializeTickets.tsx';
import { useServiceStatus } from '../../hooks/api/useServiceStatus.tsx';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import Checkbox from '@mui/material/Checkbox';
import {
  useDeleteExternalProcess,
  useUpdateExternalProcess,
} from '../../hooks/api/tickets/useUpdateExternalProcess.tsx';
import ConfirmationModal from '../../themes/overrides/ConfirmationModal.tsx';

export interface ExternalProcessesSettingsProps {
  dense?: boolean;
  naked?: boolean;
}
export function ExternalProcessesSettings({
  dense = false,
  naked = false,
}: ExternalProcessesSettingsProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAssocation, setDeletingAssociation] = useState<
    ExternalProcess | undefined
  >(undefined);
  const [open, setOpen] = useState(false);
  const { externalProcesses, externalProcessesIsLoading } =
    useAllExternalProcesses();
  const { serviceStatus } = useServiceStatus();
  const queryClient = useQueryClient();
  const updateExternalProcess = useUpdateExternalProcess();
  const deleteExternalProcessMutation = useDeleteExternalProcess();

  const handleToggleEnabled = (process: ExternalProcess) => {
    const updatedProcess: ExternalProcess = {
      ...process,
      enabled: !process.enabled,
    };
    updateExternalProcess.mutate(updatedProcess);
  };

  const handleDelete = (id: number | undefined) => {
    if (!id) return;
    TicketsService.deleteExternalProcess(id)
      .then(() => {
        setDeleteModalOpen(false);
        void queryClient.invalidateQueries({
          queryKey: [externalProcessesQueryKey],
        });
      })
      .catch(err => {
        snowstormErrorHandler(
          err,
          `Failed to delete external process`,
          serviceStatus,
        );
      })
      .finally(() => {
        deleteExternalProcessMutation.reset();
      });
  };

  const columns: GridColDef[] = [
    {
      field: 'processName',
      headerName: 'Name',
      minWidth: 250,
      maxWidth: 300,
    },
    {
      field: 'enabled',
      headerName: 'Enabled',
      minWidth: 150,
      flex: 1,
      maxWidth: 300,
      filterable: false,
      // eslint-disable-next-line
      renderCell: (params: GridRenderCellParams<any, boolean>): ReactNode => {
        return (
          <Checkbox
            checked={params.value as boolean}
            onChange={() => {
              handleToggleEnabled(params.row as ExternalProcess);
            }}
          />
        );
      },
    },
    {
      field: 'id',
      type: 'actions',
      headerName: 'Actions',
      minWidth: 150,
      cellClassName: 'actions',
      getActions: row => {
        const id = row.id as number;
        return [
          <GridActionsCellItem
            data-testid={`external-process-settings-row-delete-${id}`}
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => {
              const process = externalProcesses.find(
                process => process.id === row.id,
              );
              setDeletingAssociation(process);
              setDeleteModalOpen(true);
            }}
            disabled={deleteExternalProcessMutation.isPending}
            color="inherit"
          />,
        ];
      },
    },
  ];
  return (
    <>
      <ConfirmationModal
        open={deleteModalOpen}
        content={`Confirm delete for process ${deletingAssocation?.processName}`}
        handleClose={() => {
          setDeletingAssociation(undefined);
          setDeleteModalOpen(false);
        }}
        title={'Confirm Delete'}
        disabled={false}
        action={'Delete'}
        handleAction={() => {
          void handleDelete(deletingAssocation?.id);
        }}
      />
      <Stack sx={{ width: '100%', padding: '0em 0em 1em 1em' }}>
        <Button
          data-testid="create-external-process-button"
          variant="contained"
          color="success"
          startIcon={<PlusCircleOutlined />}
          sx={{ marginLeft: 'auto' }}
          onClick={() => {
            setOpen(true);
          }}
        >
          Create External Process
        </Button>
      </Stack>
      <Grid container>
        <Grid item xs={12} lg={12}>
          <Card sx={{ width: '100%', border: '2px solid rgb(240, 240, 240)' }}>
            <ExternalProcessesModal
              open={open}
              handleClose={() => {
                setOpen(false);
              }}
            />

            <DataGrid
              loading={
                externalProcessesIsLoading &&
                serviceStatus?.authoringPlatform.running
              }
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
              getRowId={(row: ExternalProcess) => row.id}
              rows={externalProcesses ?? []}
              columns={columns}
              slots={!naked ? { toolbar: TableHeaders } : {}}
              slotProps={
                !naked
                  ? {
                      toolbar: {
                        tableName: 'External Processes',
                      },
                    }
                  : {}
              }
              disableColumnSelector
              hideFooterSelectedRowCount
              disableDensitySelector
              initialState={
                !naked
                  ? {
                      pagination: {
                        paginationModel: { page: 0, pageSize: 20 },
                      },
                      sorting: {
                        sortModel: [{ field: 'processName', sort: 'asc' }],
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
