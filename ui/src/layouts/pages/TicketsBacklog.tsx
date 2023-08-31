import { ReactNode, useEffect } from 'react';
import useTicketStore from '../../stores/TicketStore';
import { State, Ticket } from '../../types/tickets/ticket';
import TicketsService from '../../api/TicketsService';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import MainCard from '../../components/MainCard';
import { Link } from 'react-router-dom';

function TicketsBacklog() {
  const { setTickets, tickets, setAvailableStates } = useTicketStore();

  useEffect(() => {
    TicketsService.getAllTickets()
      .then((tickets: Ticket[]) => {
        setTickets(tickets);
      })
      .catch(err => console.log(err));
    TicketsService.getAllStates()
      .then((states: State[]) => {
        setAvailableStates(states);
      })
      .catch(err => console.log(err));
  }, []);

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Id',
      width: 150,
    },
    {
      field: 'title',
      headerName: 'Title',
      minWidth: 90,
      flex: 1,
      maxWidth: 90,
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <Link to={`/dashboard/tasks/edit/${params.value}`}>
          {params.value!.toString()}
        </Link>
      ),
    },
  ];
  return (
    <MainCard sx={{ width: '100%' }}>
      <DataGrid
        //   density={true ? 'compact' : 'standard'}

        sx={{
          fontWeight: 400,
          fontSize: 14,
          borderRadius: 0,
          border: 0,
          color: '#003665',
          '& .MuiTableCell-root': {
            '&:last-of-type': {
              paddingRight: 24,
            },
            '&:first-of-type': {
              paddingLeft: 24,
            },
          },
          '& .MuiDataGrid-row': {
            borderBottom: 1,
            minHeight: 'auto !important',
            maxHeight: 'none !important',
          },
          '& .MuiDataGrid-columnHeaders': {
            border: 0,
            borderTop: 0,
            borderBottom: 1,
            borderRadius: 0,
            backgroundColor: '#efefef',
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
        }}
        getRowId={(row: Ticket) => row.id}
        rows={tickets}
        columns={columns}
        //   disableColumnSelector
        hideFooterSelectedRowCount
        disableDensitySelector
        //   slots={!true ? { toolbar: QuickSearchToolbar } : {}}
        //   slotProps={
        //     !true
        //       ? {
        //           toolbar: {
        //             showQuickFilter: true,
        //             quickFilterProps: { debounceMs: 500 },
        //           },
        //         }
        //       : {}
        //   }
        //   initialState={
        //     !true
        //       ? {
        //           pagination: {
        //             paginationModel: { page: 0, pageSize: 5 },
        //           },
        //         }
        //       : {}
        //   }
        //   pageSizeOptions={true ? [5, 10, 15, 20] : []}
        disableColumnFilter={false}
        disableColumnMenu={false}
        disableRowSelectionOnClick={false}
        hideFooter={false}
      />
    </MainCard>
  );
}

export default TicketsBacklog;
