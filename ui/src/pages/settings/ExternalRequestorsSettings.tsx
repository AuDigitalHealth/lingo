import React, { ReactNode, useState } from 'react';
import { ExternalRequestor } from '../../types/tickets/ticket.ts';
import { Box, Button, Card, Grid } from '@mui/material';

import useTicketStore from '../../stores/TicketStore.ts';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { PlusCircleOutlined } from '@ant-design/icons';
import ConfirmationModal from '../../themes/overrides/ConfirmationModal.tsx';
import TicketsService from '../../api/TicketsService.ts';
import { ticketExternalRequestors } from '../../types/queryKeys.ts';
import { useServiceStatus } from '../../hooks/api/useServiceStatus.tsx';
import { useQueryClient } from '@tanstack/react-query';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import { Stack } from '@mui/system';
import {
  DataGrid,
  GridActionsCellItem,
  GridCellParams,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import Loading from '../../components/Loading.tsx';
import { TableHeaders } from '../../components/TableHeaders.tsx';

import {
  ColorCode,
  getColorCodeKey,
  handleDbColors,
} from '../../types/ColorCode.ts';
import ExternalRequestorSettingsModal from './components/externalRequestors/ExternalRequestorSettingsModal.tsx';

export interface ExternalRequestorsSettingsProps {
  dense?: boolean;
  naked?: boolean;
}
export function ExternalRequestorsSettings({
  dense = false,
  naked = false,
}: ExternalRequestorsSettingsProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteModalContent, setDeleteModalContent] = useState('');
  const [externalRequestor, setExternalRequestor] =
    useState<ExternalRequestor>();
  const { externalRequestors } = useTicketStore();
  const { serviceStatus } = useServiceStatus();
  const queryClient = useQueryClient();
  const onDialogCloseClick = () => {
    setOpen(false);
  };
  const findUsingId = (id: number) => {
    const externalRequestor = externalRequestors.find(function (it) {
      return it && it.id === id;
    });
    return externalRequestor;
  };
  const handleDeleteExternalRequestor = () => {
    if (!externalRequestor?.id) {
      return;
    }
    TicketsService.deleteExternalRequestor(externalRequestor.id)
      .then(() => {
        void queryClient.invalidateQueries({
          queryKey: [ticketExternalRequestors],
        });
      })
      .catch(err => {
        snowstormErrorHandler(
          err,
          `Failed to delete external requester ${externalRequestor.name}`,
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
      field: 'description',
      headerName: 'Description',
      minWidth: 250,
      flex: 1,
      maxWidth: 300,
    },

    {
      field: 'displayColor',
      headerName: 'Display Colour',
      minWidth: 250,
      flex: 1,
      maxWidth: 300,
      filterable: false,
      // eslint-disable-next-line
      renderCell: (params: GridRenderCellParams<any, ColorCode>): ReactNode => {
        const color = handleDbColors(params.value as ColorCode);
        const colorKey = getColorCodeKey(color);
        return (
          <>
            <Box
              component="span"
              sx={{
                width: 14,
                height: 14,
                flexShrink: 0,
                borderRadius: '3px',
                mr: 1,
                mt: '2px',
              }}
              style={{ backgroundColor: color }}
            />
            <Box
              sx={{
                flexGrow: 1,
                '& span': {
                  color: '#8b949e',
                },
              }}
            >
              {colorKey}
            </Box>
          </>
        );
      },
      getApplyQuickFilterFn: (value: string) => {
        if (!value) {
          return null;
        }
        return (params: GridCellParams): boolean => {
          const color = getColorCodeKey(params.value as ColorCode);
          return color.toLowerCase().startsWith(value.toLowerCase());
        };
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
            data-testid={`external-requestor-settings-row-edit-${id}`}
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={() => {
              setExternalRequestor(findUsingId(id) as ExternalRequestor);
              setOpen(true);
            }}
            color="inherit"
          />,
          <GridActionsCellItem
            data-testid={`external-requestor-settings-row-delete-${id}`}
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => {
              const externalRequestor = findUsingId(id) as ExternalRequestor;
              setExternalRequestor(externalRequestor);
              setDeleteOpen(true);
              setDeleteModalContent(
                `You are about to permanently remove the external requester ${externalRequestor.name}.  This information cannot be recovered.`,
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
          data-testid="create-external-requestor-button"
          variant="contained"
          color="success"
          startIcon={<PlusCircleOutlined />}
          sx={{ marginLeft: 'auto' }}
          onClick={() => {
            setExternalRequestor(undefined);
            setOpen(true);
          }}
        >
          Create External Requester
        </Button>
      </Stack>
      <Grid container>
        <Grid item xs={12} lg={12}>
          <Card sx={{ width: '100%', border: '2px solid rgb(240, 240, 240)' }}>
            {open && (
              <ExternalRequestorSettingsModal
                open={open}
                handleClose={onDialogCloseClick}
                externalRequestor={externalRequestor}
              />
            )}
            {deleteOpen && (
              <ConfirmationModal
                open={deleteOpen}
                content={deleteModalContent}
                handleClose={() => {
                  setDeleteOpen(false);
                }}
                title={`Confirm Delete External requester ${externalRequestor?.name}`}
                action={'Remove External Requester'}
                handleAction={handleDeleteExternalRequestor}
                reverseAction={'Cancel'}
              />
            )}
            {externalRequestors === undefined && <Loading></Loading>}

            <DataGrid
              loading={
                externalRequestors === undefined &&
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
              getRowId={(row: ExternalRequestor) => row.id}
              rows={externalRequestors}
              columns={columns}
              slots={!naked ? { toolbar: TableHeaders } : {}}
              slotProps={
                !naked
                  ? {
                      toolbar: {
                        tableName: 'External Requesters',
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
