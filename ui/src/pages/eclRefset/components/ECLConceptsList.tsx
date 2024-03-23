/* eslint-disable */
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams
} from '@mui/x-data-grid';

import { Card, Theme } from '@mui/material';

import { useEffect, useState } from 'react';
import { TableHeaders } from '../../../components/TableHeaders.tsx';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import {
  unavailableTasksErrorHandler,
} from '../../../types/ErrorHandler.ts';
import { Concept, Term } from '../../../types/concept.ts';
import { useConceptsByEcl } from '../../../hooks/eclRefset/useConceptsByEcl.tsx';


const gridProperties: Record<'addition' | 'deletion', 
    {
      color: any,
      heading: string
    }
  > = {
  'addition': {
    color: (t: Theme) => t.palette.success.darker,
    heading: 'Additions'
  },
  'deletion': {
    color: (t: Theme) => t.palette.error.darker,
    heading: 'Deletions'
  }
}

interface EclConceptsListProps {
  branch: string;
  ecl: string;
  type: 'addition' | 'deletion';
}

function ECLConceptsList({
  branch,
  ecl,
  type
}: EclConceptsListProps) {
  const { serviceStatus } = useServiceStatus();

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  const { data, isLoading } = useConceptsByEcl(branch, ecl, paginationModel.pageSize, paginationModel.page * paginationModel.pageSize);
  const [concepts, setConcepts] = useState(Array<Concept>());
  const [total, setTotal] = useState<number>();

  useEffect(() => {
    setPaginationModel({...paginationModel, page: 0})
  }, [ecl])

  useEffect(() => {
    if (!isLoading) {
      setConcepts(data?.items ?? [])
      setTotal(data?.total)
    }
  }, [data]);

  useEffect(() => {
    if (!serviceStatus?.authoringPlatform.running) {
      unavailableTasksErrorHandler();
    }
  }, []);
  const columns: GridColDef[] = [
    {
      field: 'conceptId',
      headerName: 'Concept ID',
      width: 180,
      sortable: false
    },
    {
      field: 'fsn',
      headerName: 'Fully Specified Name',
      flex: 1,
      valueGetter: (params: GridRenderCellParams<any, Term>): string => {
        return params.value?.term as string;
      },
      renderCell: ({ value }) => (
        <span title={value} style={{ overflow: "hidden", textOverflow: "ellipsis", width: 'calc(100% - 12px)'}}>
          {value}
        </span>
      ),
      sortable: false
    }
  ];
  return (
    <>
      <Card sx={{ width: '100%' }}>
        <DataGrid
          loading={
            isLoading &&
            serviceStatus?.authoringPlatform.running
          }
          sx={{
            fontSize: 14,
            color: gridProperties[type].color,
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
              // If you want to keep the pagination controls consistently placed page-to-page
              // marginTop: `${(pageSize - userDataList.length) * ROW_HEIGHT}px`
            },
            '& .MuiTablePagination-root': {
              color: '#003665',
            },
            '& .MuiSvgIcon-root': {
              color: '#003665',
            },
            '.Mui-disabled .MuiSvgIcon-root': {
              color: 'inherit'
            },
            '& .MuiDataGrid-virtualScroller': {
              minHeight: '45px',
              color: 'inherit'
            },
            '& .MuiDataGrid-withBorderColor': {
              borderColor: 'rgb(240, 240, 240)'
            }
          }}
          getRowId={(row: Concept) => row.conceptId ?? ""}
          rows={concepts}
          rowSpacingType='border'
          columns={columns}
          disableColumnSelector
          disableRowSelectionOnClick
          hideFooterSelectedRowCount
          disableDensitySelector
          disableColumnMenu
          density="compact"
          slots={{ toolbar: TableHeaders }}
          slotProps={
            {
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
                tableName: gridProperties[type].heading + (total !== undefined ? ` | ${total} concepts` : ""),
              },
            }
          }
          pageSizeOptions={[10, 25, 50, 100]}
          paginationMode='server'
          rowCount={total ?? 0}
          paginationModel={paginationModel}
          onPaginationModelChange={(newModel) => {
            if (newModel.pageSize !== paginationModel.pageSize) {
              // when page size changes, go to page with the current top row
              let currFirstRowIndex = paginationModel.page * paginationModel.pageSize;
              let newPage = Math.floor(currFirstRowIndex / newModel.pageSize);
              newModel.page = newPage;
            }
            setPaginationModel(newModel)
          }}
        />
      </Card>
    </>
  );
}

export default ECLConceptsList;
