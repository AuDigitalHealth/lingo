import {
  DataGrid,
  GridColDef,
  GridFilterModel,
  GridRenderCellParams,
  GridValidRowModel,
} from '@mui/x-data-grid';

import { Box, Card, IconButton, Theme } from '@mui/material';

import { useEffect, useState } from 'react';
import { TableHeaders } from '../../../components/TableHeaders.tsx';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import { SnowstormError } from '../../../types/ErrorHandler.ts';
import { Concept } from '../../../types/concept.ts';
import { useConceptsByEcl } from '../../../hooks/eclRefset/useConceptsByEcl.tsx';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ConceptDetailsModal from './ConceptDetailsModal.tsx';
import { AxiosError } from 'axios';

const gridProperties: Record<
  'addition' | 'deletion' | 'all',
  {
    color: (theme: Theme) => string;
    heading: string;
  }
> = {
  addition: {
    color: (t: Theme) => t.palette.success.darker,
    heading: 'Additions',
  },
  deletion: {
    color: (t: Theme) => t.palette.error.darker,
    heading: 'Deletions',
  },
  all: {
    color: () => '#003665',
    heading: 'All concepts',
  },
};

interface EclConceptsListProps {
  branch: string;
  ecl: string;
  type: 'addition' | 'deletion' | 'all';
  setInvalidEcl: (invalidEcl: boolean) => void;
}

function ECLConceptsList({
  branch,
  ecl,
  type,
  setInvalidEcl,
}: EclConceptsListProps) {
  const { serviceStatus } = useServiceStatus();

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data,
    isLoading,
    searchTerm: querySearchTerm,
    error,
  } = useConceptsByEcl(branch, ecl, {
    limit: paginationModel.pageSize,
    offset: paginationModel.page * paginationModel.pageSize,
    term: searchTerm,
    activeFilter: true,
  });
  const [concepts, setConcepts] = useState(Array<Concept>());
  const [total, setTotal] = useState<number>();
  const [filteredTotal, setFilteredTotal] = useState<number>();

  const [modalConcept, setModalConcept] = useState<Concept>();

  useEffect(() => {
    setPaginationModel(p => ({ ...p, page: 0 }));
    setFilterModel(f => ({ ...f, quickFilterValues: [] }));

    setConcepts([]);
    setFilteredTotal(undefined);
    setTotal(undefined);
  }, [ecl]);

  useEffect(() => {
    if (error) {
      const err = error as AxiosError<SnowstormError>;
      if (err.response?.status === 400) {
        setInvalidEcl(true);
      }
    }
  }, [error, setInvalidEcl]);

  useEffect(() => {
    if (!isLoading) {
      setConcepts(data?.items ?? []);
      setFilteredTotal(data?.total);
      if (!querySearchTerm) {
        setTotal(data?.total);
      }
    }
  }, [data, isLoading, querySearchTerm]);

  useEffect(() => {
    if (filterModel.quickFilterValues) {
      setSearchTerm((filterModel.quickFilterValues[0] as string) ?? '');
    }
  }, [filterModel]);

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
      valueGetter: (params): Concept => {
        return params.row as Concept;
      },
      renderCell: ({
        value,
      }: GridRenderCellParams<GridValidRowModel, Concept>) => {
        const fsn = value?.fsn?.term;
        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: 'calc(100% - 12px)',
            }}
          >
            <span
              title={fsn}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {fsn}
            </span>
            {value ? (
              <IconButton
                aria-label="concept info"
                onClick={() => setModalConcept(value)}
              >
                <InfoOutlinedIcon />
              </IconButton>
            ) : (
              <Box />
            )}
          </Box>
        );
      },
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
              color: 'inherit',
            },
            '& .MuiDataGrid-virtualScroller': {
              minHeight: '45px',
              color: 'inherit',
            },
            '& .MuiDataGrid-withBorderColor': {
              borderColor: 'rgb(240, 240, 240)',
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
          filterMode="server"
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          slots={{ toolbar: TableHeaders }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: {
                debounceMs: 500,
                quickFilterParser: (searchInput: string) => [
                  searchInput.trim(),
                ],
              },
              tableName:
                gridProperties[type].heading +
                (total !== undefined ? ` | ${total} concepts` : ''),
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          paginationMode="server"
          rowCount={filteredTotal ?? 0}
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
        />
      </Card>
      {modalConcept ? (
        <ConceptDetailsModal
          concept={modalConcept}
          handleClose={() => setModalConcept(undefined)}
        />
      ) : null}
    </>
  );
}

export default ECLConceptsList;
