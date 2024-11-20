import { useState } from 'react';
import { TicketFilter } from '../../types/tickets/ticket.ts';
import { Card, Grid } from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmationModal from '../../themes/overrides/ConfirmationModal.tsx';
import { useServiceStatus } from '../../hooks/api/useServiceStatus.tsx';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import Loading from '../../components/Loading.tsx';
import { TableHeaders } from '../../components/TableHeaders.tsx';

import { useAllTicketFilters } from '../../hooks/api/useInitializeTickets.tsx';
import { useDeleteTicketFilter } from '../../hooks/api/tickets/useUpdateTicketFilters.tsx';
import TicketFilterSettingsModal from './components/ticketFilters/TicketFiltersSettingsModal.tsx';

export interface FilterSettingsProps {
  dense?: boolean;
  naked?: boolean;
}
export function FilterSettings({
  dense = false,
  naked = false,
}: FilterSettingsProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteModalContent, setDeleteModalContent] = useState('');
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>();
  const { ticketFilters } = useAllTicketFilters();
  const { serviceStatus } = useServiceStatus();

  const deleteMutation = useDeleteTicketFilter();

  const onDialogCloseClick = () => {
    setOpen(false);
  };

  const findUsingId = (id: number) => {
    const ticketFilter = ticketFilters.find(function (it) {
      return it && it.id === id;
    });
    return ticketFilter;
  };

  const handleDeleteTicketFilter = () => {
    if (!ticketFilter?.id) {
      return;
    }
    deleteMutation.mutate(ticketFilter.id, {
      onSuccess: () => {
        setDeleteOpen(false);
      },
      onError: err => {
        snowstormErrorHandler(
          err,
          `Failed to delete Ticket Filter ${ticketFilter.name}`,
          serviceStatus,
        );
      },
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
      field: 'id',
      type: 'actions',
      headerName: 'Actions',
      minWidth: 150,
      cellClassName: 'actions',
      getActions: row => {
        const id = row.id as number;
        return [
          <GridActionsCellItem
            data-testid={`ticket-filter-settings-row-edit-${id}`}
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={() => {
              setTicketFilter(findUsingId(id));
              setOpen(true);
            }}
            color="inherit"
          />,
          <GridActionsCellItem
            data-testid={`ticket-filter-settings-row-delete-${id}`}
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => {
              const ticketFilter = findUsingId(id);
              setTicketFilter(ticketFilter);
              setDeleteOpen(true);
              setDeleteModalContent(
                `You are about to permanently remove the Ticket Filter ${ticketFilter?.name}.  This information cannot be recovered.`,
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
      <Grid container>
        <Grid item xs={12} lg={12}>
          <Card sx={{ width: '100%', border: '2px solid rgb(240, 240, 240)' }}>
            {open && (
              <TicketFilterSettingsModal
                open={open}
                handleClose={onDialogCloseClick}
                ticketFilter={ticketFilter}
              />
            )}
            {deleteOpen && (
              <ConfirmationModal
                open={deleteOpen}
                content={deleteModalContent}
                handleClose={() => {
                  setDeleteOpen(false);
                }}
                title={`Confirm Delete Ticket Filter: ${ticketFilter?.name}`}
                action={'Delete Ticket Filter'}
                handleAction={handleDeleteTicketFilter}
                reverseAction={'Cancel'}
              />
            )}
            {ticketFilters === undefined && <Loading></Loading>}

            <DataGrid
              loading={
                ticketFilters === undefined &&
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
              getRowId={(row: TicketFilter) => row.id}
              rows={ticketFilters}
              columns={columns}
              slots={!naked ? { toolbar: TableHeaders } : {}}
              slotProps={
                !naked
                  ? {
                      toolbar: {
                        tableName: 'Ticket Filters',
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
