/* eslint-disable */
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridValueFormatterParams,
} from '@mui/x-data-grid';

import { Button, Card, Chip, Grid } from '@mui/material';

import React, { useState } from 'react';
import { Iteration } from '../../types/tickets/ticket.ts';
import useTicketStore from '../../stores/TicketStore.ts';
import { useServiceStatus } from '../../hooks/api/useServiceStatus.tsx';
import { useQueryClient } from '@tanstack/react-query';
import TicketsService from '../../api/TicketsService.ts';
import { ticketIterationsKey } from '../../types/queryKeys.ts';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import { TableHeaders } from '../../components/TableHeaders.tsx';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReleaseSettingsModal from './components/releases/ReleaseSettingsModal.tsx';
import ConfirmationModal from '../../themes/overrides/ConfirmationModal.tsx';
import { PlusCircleOutlined } from '@ant-design/icons';
import { Stack } from '@mui/system';
import Loading from '../../components/Loading.tsx';

export interface ReleaseSettingsProps {
  dense?: boolean;
  // disable search, filter's etc
  naked?: boolean;
  showActionBar?: boolean;
}
export function ReleaseSettings({
  dense = false,
  naked = false,
  showActionBar = true,
}: ReleaseSettingsProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteModalContent, setDeleteModalContent] = useState('');
  const [iteration, setIteration] = useState<Iteration>();
  const { iterations } = useTicketStore();
  const { serviceStatus } = useServiceStatus();
  const queryClient = useQueryClient();

  const onDialogCloseClick = () => {
    setOpen(false);
  };

  const findUsingId = (id: number) => {
    const iteration = iterations.find(function (it) {
      return it && it.id === id;
    });
    return iteration;
  };

  const handleDeleteIteration = () => {
    if (!iteration?.id) {
      return;
    }
    TicketsService.deleteIteration(iteration.id)
      .then(() => {
        void queryClient.invalidateQueries({
          queryKey: [ticketIterationsKey],
        });
      })
      .catch(err => {
        snowstormErrorHandler(
          err,
          `Failed to delete release ${iteration.name}`,
          serviceStatus,
        );
      })
      .finally(() => {
        setDeleteOpen(false);
      });
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      minWidth: 250,
      maxWidth: 300,
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      minWidth: 250,
      flex: 1,
      maxWidth: 250,
      valueFormatter: ({ value }: GridValueFormatterParams<string>) => {
        if (value) {
          const date = new Date(value);
          return date.toLocaleDateString('en-AU');
        }
      },
      filterable: false,
    },

    {
      field: 'endDate',
      headerName: 'End Date',
      minWidth: 250,
      flex: 1,
      maxWidth: 200,
      filterable: false,
      valueFormatter: ({ value }: GridValueFormatterParams<string>) => {
        if (value) {
          const date = new Date(value);
          return date.toLocaleDateString('en-AU');
        }
      },
    },
    {
      field: 'active',
      headerName: 'Active',
      minWidth: 150,
    },
    {
      field: 'completed',
      headerName: 'Completed',
      minWidth: 150,
    },
    {
      field: 'id',
      type: 'actions',
      headerName: 'Actions',
      minWidth: 150,
      cellClassName: 'actions',
      getActions: ({ row }) => {
        const id = row.id as number;
        return [
          <GridActionsCellItem
            data-testid={`release-settings-row-edit-${id}`}
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={() => {
              setIteration(findUsingId(row.id) as Iteration);
              setOpen(true);
            }}
            color="inherit"
          />,
          <GridActionsCellItem
            data-testid={`release-settings-row-delete-${id}`}
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => {
              const release = findUsingId(row.id) as Iteration;
              setIteration(release);
              setDeleteOpen(true);
              setDeleteModalContent(
                `You are about to permanently remove the release ${release.name}.  This information cannot be recovered.`,
              );
            }}
            color="inherit"
          />,
        ];
      },
    },
  ];
  return (
    <>
      <Stack sx={{ width: '100%', padding: '0em 0em 1em 1em' }}>
        <Button
          data-testid="create-release-button"
          variant="contained"
          color="success"
          startIcon={<PlusCircleOutlined />}
          sx={{ marginLeft: 'auto' }}
          onClick={() => {
            setIteration(undefined);
            setOpen(true);
          }}
        >
          Create Release
        </Button>
      </Stack>
      <Grid container>
        <Grid item xs={12} lg={12}>
          <Card sx={{ width: '100%', border: '2px solid rgb(240, 240, 240)' }}>
            {open && (
              <ReleaseSettingsModal
                open={open}
                handleClose={onDialogCloseClick}
                iteration={iteration as Iteration}
              />
            )}
            {deleteOpen && (
              <ConfirmationModal
                open={deleteOpen}
                content={deleteModalContent}
                handleClose={() => {
                  setDeleteOpen(false);
                }}
                title={`Confirm Delete Release ${iteration?.name}`}
                action={'Remove Release'}
                handleAction={handleDeleteIteration}
                reverseAction={'Cancel'}
              />
            )}
            {iterations === undefined && <Loading></Loading>}

            <DataGrid
              loading={
                iterations === undefined &&
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
                '& .MuiSvgIcon-root': {
                  color: '#003665',
                },
                '& .MuiDataGrid-virtualScroller': {
                  minHeight: '36px',
                },
              }}
              className={'task-list'}
              density={dense ? 'compact' : 'standard'}
              getRowId={(row: Iteration) => row.id}
              rows={iterations}
              columns={columns}
              slots={!naked ? { toolbar: TableHeaders } : {}}
              slotProps={
                !naked
                  ? {
                      toolbar: {
                        tableName: 'Releases',
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
                        sortModel: [{ field: 'name', sort: 'asc' }],
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
