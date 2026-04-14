import React, { ReactNode, useState } from 'react';
import { SynonymConfiguration } from '../../types/tickets/ticket.ts';
import { Button, Card, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { PlusCircleOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import TicketsService from '../../api/TicketsService.ts';
import { synonymConfigurationsQueryKey } from '../../types/queryKeys.ts';
import { Stack } from '@mui/system';
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import { TableHeaders } from '../../components/TableHeaders.tsx';

import { useServiceStatus } from '../../hooks/api/useServiceStatus.tsx';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import {
  useAllSynonymConfigurations,
  useDeleteSynonymConfiguration,
} from '../../hooks/api/tickets/useUpdateSynonymConfiguration.tsx';
import ConfirmationModal from '../../themes/overrides/ConfirmationModal.tsx';
import SynonymConfigurationModal from './components/synonyms/SynonymConfigurationModal.tsx';

export interface SynonymConfigurationSettingsProps {
  dense?: boolean;
  naked?: boolean;
}

export function SynonymConfigurationSettings({
  dense = false,
  naked = false,
}: SynonymConfigurationSettingsProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingSynonym, setDeletingSynonym] = useState<
    SynonymConfiguration | undefined
  >(undefined);
  const [editingSynonym, setEditingSynonym] = useState<
    SynonymConfiguration | undefined
  >(undefined);
  const [open, setOpen] = useState(false);
  const { synonymConfigurations, synonymConfigurationsIsLoading } =
    useAllSynonymConfigurations();
  const { serviceStatus } = useServiceStatus();
  const queryClient = useQueryClient();
  const deleteSynonymConfigurationMutation = useDeleteSynonymConfiguration();

  const handleDelete = (id: number | undefined) => {
    if (!id) return;
    TicketsService.deleteSynonymConfiguration(id)
      .then(() => {
        setDeleteModalOpen(false);
        void queryClient.invalidateQueries({
          queryKey: [synonymConfigurationsQueryKey],
        });
      })
      .catch(err => {
        snowstormErrorHandler(
          err,
          `Failed to delete synonym configuration`,
          serviceStatus,
        );
      })
      .finally(() => {
        deleteSynonymConfigurationMutation.reset();
      });
  };

  const columns: GridColDef[] = [
    {
      field: 'searchString',
      headerName: 'Search String',
      minWidth: 200,
      flex: 1,
    },
    {
      field: 'replacementString',
      headerName: 'Replacement String',
      minWidth: 200,
      flex: 1,
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
            data-testid={`synonym-settings-row-edit-${id}`}
            icon={<EditIcon />}
            label="Edit"
            onClick={() => {
              const synonym = synonymConfigurations.find(s => s.id === row.id);
              setEditingSynonym(synonym);
              setOpen(true);
            }}
            color="inherit"
          />,
          <GridActionsCellItem
            data-testid={`synonym-settings-row-delete-${id}`}
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => {
              const synonym = synonymConfigurations.find(s => s.id === row.id);
              setDeletingSynonym(synonym);
              setDeleteModalOpen(true);
            }}
            disabled={deleteSynonymConfigurationMutation.isPending}
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
        content={`Confirm delete for synonym configuration: ${deletingSynonym?.searchString} → ${deletingSynonym?.replacementString}`}
        handleClose={() => {
          setDeletingSynonym(undefined);
          setDeleteModalOpen(false);
        }}
        title={'Confirm Delete'}
        disabled={false}
        action={'Delete'}
        handleAction={() => {
          void handleDelete(deletingSynonym?.id);
        }}
      />
      <Stack sx={{ width: '100%', padding: '0em 0em 1em 1em' }}>
        <Button
          data-testid="create-synonym-configuration-button"
          variant="contained"
          color="success"
          startIcon={<PlusCircleOutlined />}
          sx={{ marginLeft: 'auto' }}
          onClick={() => {
            setEditingSynonym(undefined);
            setOpen(true);
          }}
        >
          Create Synonym Configuration
        </Button>
      </Stack>
      <Grid container>
        <Grid item xs={12} lg={12}>
          <Card sx={{ width: '100%', border: '2px solid rgb(240, 240, 240)' }}>
            <SynonymConfigurationModal
              open={open}
              handleClose={() => {
                setOpen(false);
                setEditingSynonym(undefined);
              }}
              synonymConfiguration={editingSynonym}
            />

            <DataGrid
              loading={
                synonymConfigurationsIsLoading &&
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
              getRowId={(row: SynonymConfiguration) => row.id}
              rows={synonymConfigurations ?? []}
              columns={columns}
              slots={!naked ? { toolbar: TableHeaders } : {}}
              slotProps={
                !naked
                  ? {
                      toolbar: {
                        tableName: 'Synonym Configurations',
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
                        sortModel: [{ field: 'searchString', sort: 'asc' }],
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
