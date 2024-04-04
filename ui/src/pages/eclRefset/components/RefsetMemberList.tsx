/* eslint-disable */
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams
} from '@mui/x-data-grid';

import { Alert, Card, Grid } from '@mui/material';

import { ReactNode, useEffect } from 'react';
import { TableHeaders } from '../../../components/TableHeaders.tsx';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import {
  unavailableTasksErrorHandler,
} from '../../../types/ErrorHandler.ts';
import { useRefsetMembers } from '../../../hooks/eclRefset/useRefsetMembers.tsx';
import { RefsetMember } from '../../../types/RefsetMember.ts';
import { Concept } from '../../../types/concept.ts';
import { Link } from 'react-router-dom';
import useRefsetMemberStore from '../../../stores/RefsetMemberStore.ts';

interface RefsetMemberListProps {
  heading: string;
  branch: string;
}

function RefsetMemberList({
  heading,
  branch,
}: RefsetMemberListProps) {
  const { serviceStatus } = useServiceStatus();

  const { data, isFetching } = useRefsetMembers(branch);

  const { members: refsetMembers } = useRefsetMemberStore();

  useEffect(() => {
    if (!serviceStatus?.authoringPlatform.running) {
      unavailableTasksErrorHandler();
    }
  }, []);
  const columns: GridColDef[] = [
    {
      field: 'memberId',
      headerName: 'Member ID',
      width: 300,
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <Link
          to={`member/${params.value}`}
          className={'task-details-link'}
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: 'referencedComponent',
      headerName: 'Referenced Component',
      valueGetter: (params: GridRenderCellParams<any, Concept>): string => {
        return params.value?.pt ? params.value?.pt.term : params.value?.fsn?.term as string;
      },
      width: 350,
    },
    {
      field: 'referencedComponentId',
      headerName: 'Referenced Component ID',
      width: 200,
    },
    {
      field: 'active',
      headerName: 'Active',
      type: 'boolean'
    },
    {
      field: 'released',
      headerName: 'Released',
      type: 'boolean',
    },
    {
      field: 'additionalFields',
      headerName: 'Query',
      valueGetter: (params: GridRenderCellParams<any, Record<string, any>>): string => {
        return params.value?.query as string;
      },
      renderCell: ({ value }) => (
        <span title={value} style={{ overflow: "hidden", textOverflow: "ellipsis", width: 'calc(100% - 12px)'}}>
          {value}
        </span>
      ),
      flex: 1
    },
  ];
  return (
    <>
      <Grid container>
        <Grid item xs={12} lg={12}>
          <Card sx={{ width: '100%', border: '2px solid rgb(240, 240, 240)' }}>
            <DataGrid
              loading={
                isFetching &&
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
                  paddingLeft: '12px',
                },
                '& .MuiDataGrid-columnHeaders': {
                  border: 0,
                  borderTop: 0,
                  borderBottom: 1,
                  borderColor: 'rgb(240, 240, 240)',
                  borderRadius: 0,
                  backgroundColor: 'rgb(250, 250, 250)',
                  paddingLeft: '12px',
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
              getRowId={(row: RefsetMember) => row.memberId ?? `${row.refsetId}-${row.referencedComponentId}`}
              rows={refsetMembers}
              columns={columns}
              disableColumnSelector
              hideFooterSelectedRowCount
              disableDensitySelector
              slots={{ toolbar: RefsetMemberTableHeader }}
              slotProps={
                {
                  toolbar: {
                    tableHeadersProps: {
                      showQuickFilter: true,
                      quickFilterProps: { debounceMs: 500 },
                      tableName: heading,
                    },
                    warning: !isFetching && data && data.total > data.limit ? `${data.limit} of ${data.total} query reference sets displayed` : ""
                  },
                }
              }
              initialState={
                {
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }
              }
              pageSizeOptions={[10, 15, 20, 25]}
            />
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

interface RefsetMemberTableHeaderProps {
  tableHeadersProps: any;
  warning?: string;
}

function RefsetMemberTableHeader({tableHeadersProps, warning}: RefsetMemberTableHeaderProps) {
  return (
    <>
      <TableHeaders {...tableHeadersProps} />
      {warning ? 
        <Alert severity="warning" sx={{
          color: "rgb(102, 60, 0)",
          alignItems: 'center',
          '& .MuiSvgIcon-root': {
            color: '#ed6c02',
            fontSize: '22px'
          }}}
        >
          {warning}
        </Alert>
      : null}
    </>
  )
}

export default RefsetMemberList;
