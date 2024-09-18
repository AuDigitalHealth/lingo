import {
  DataGrid,
  DataGridProps,
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
} from '@mui/x-data-grid';
import { Card } from '@mui/material';
import { useEffect, useState } from 'react';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import { Concept, Term } from '../../../types/concept.ts';
import { useConceptsByEcl } from '../../../hooks/eclRefset/useConceptsByEcl.tsx';
import { SIMPLE_TYPE_REFSET_ECL } from '../utils/constants.tsx';

interface RefsetConceptsListProps {
  branch: string;
  ecl?: string;
  searchTerm: string;
  selectedConcept: Concept | undefined;
  setSelectedConcept: (concept: Concept | undefined) => void;
  props?: Partial<DataGridProps>;
}

function RefsetConceptsList({
  branch,
  ecl = SIMPLE_TYPE_REFSET_ECL,
  searchTerm,
  selectedConcept,
  setSelectedConcept,
  props,
}: RefsetConceptsListProps) {
  const { serviceStatus } = useServiceStatus();

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const { data, isLoading } = useConceptsByEcl(branch, ecl, {
    limit: paginationModel.pageSize,
    offset: paginationModel.page * paginationModel.pageSize,
    term: searchTerm,
  });
  const [concepts, setConcepts] = useState(Array<Concept>());
  const [total, setTotal] = useState<number>();

  useEffect(() => {
    setPaginationModel(p => ({ ...p, page: 0 }));
  }, [searchTerm]);

  useEffect(() => {
    if (!isLoading) {
      setConcepts(data?.items ?? []);
      setTotal(data?.total);
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
      field: 'fsn',
      headerName: 'Fully Specified Name',
      flex: 1,
      valueGetter: (
        params: GridRenderCellParams<GridValidRowModel, Term>,
      ): string => {
        return params.value?.term ?? '';
      },
      sortable: false,
    },
    {
      field: 'moduleId',
      headerName: 'Module ID',
      width: 200,
      sortable: false,
    },
  ];
  return (
    <>
      <Card sx={{ width: '100%' }}>
        <DataGrid
          loading={isLoading && serviceStatus?.authoringPlatform.running}
          sx={{
            fontSize: 14,
            color: '#003665',
            '& .MuiDataGrid-row': {
              borderBottom: 1,
              borderColor: 'rgb(240, 240, 240)',
              paddingLeft: '12px',
              cursor: 'pointer',
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
              color: 'inherit',
            },
            '& .MuiDataGrid-virtualScroller': {
              minHeight: '45px',
              color: 'inherit',
            },
            '& .MuiDataGrid-withBorderColor': {
              borderColor: 'rgb(240, 240, 240)',
            },
            '& .MuiDataGrid-cell:focus,.MuiDataGrid-cell:focus-within': {
              outline: 'none',
            },
          }}
          getRowId={(row: Concept) => row.conceptId ?? ''}
          rows={concepts}
          rowSpacingType="border"
          columns={columns}
          disableColumnSelector
          hideFooterSelectedRowCount
          disableDensitySelector
          disableColumnMenu
          density="compact"
          pageSizeOptions={[10, 25]}
          paginationMode="server"
          rowCount={total ?? 0}
          paginationModel={paginationModel}
          onPaginationModelChange={newModel => {
            if (newModel.pageSize !== paginationModel.pageSize) {
              // when page size changes, go to page with the current top row
              const currFirstRowIndex =
                paginationModel.page * paginationModel.pageSize;
              const newPage = Math.floor(currFirstRowIndex / newModel.pageSize);
              newModel.page = newPage;
            }
            setPaginationModel(newModel);
          }}
          rowSelectionModel={
            selectedConcept?.conceptId ? [selectedConcept.conceptId] : []
          }
          onRowSelectionModelChange={rowSelectionModel => {
            if (rowSelectionModel[0]) {
              setSelectedConcept(
                concepts.find(
                  concept => concept.conceptId === rowSelectionModel[0],
                ),
              );
            } else {
              setSelectedConcept(undefined);
            }
          }}
          {...props}
        />
      </Card>
    </>
  );
}

export default RefsetConceptsList;
