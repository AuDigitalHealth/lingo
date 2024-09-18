import { ReactNode, useEffect, useState } from 'react';
import { Concept, Term } from '../../../types/concept.ts';
import {
  DataGrid,
  GridColDef,
  GridFilterModel,
  GridRenderCellParams,
  GridToolbarQuickFilter,
  GridToolbarQuickFilterProps,
  GridValidRowModel,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import {
  AUSCT,
  AUTPR,
  QUERY_REFERENCE_SET,
  SIMPLE_TYPE_REFSET_ECL,
  TICK_FLICK_REFSET_ECL,
} from '../utils/constants.tsx';
import {
  Box,
  Card,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  SwitchProps,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import { useConceptsByEcl } from '../../../hooks/eclRefset/useConceptsByEcl.tsx';
import CircleIcon from '@mui/icons-material/Circle';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import { useRefsetHasInactives } from '../../../hooks/eclRefset/useRefsetHasInactives.tsx';

interface TickFlickRefsetConcept extends Concept {
  isQuerySpec?: boolean;
  hasInactives?: boolean | 'loading';
}

interface TickFlickRefsetListProps {
  branch: string;
}

function TickFlickRefsetList({ branch }: TickFlickRefsetListProps) {
  const { serviceStatus } = useServiceStatus();

  const [auOnly, setAuOnly] = useState(true);
  const [includeQs, setIncludeQs] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const getEcl = () => {
    const baseEcl = includeQs ? SIMPLE_TYPE_REFSET_ECL : TICK_FLICK_REFSET_ECL;
    if (!auOnly) return baseEcl;
    return `(${baseEcl}) {{ C moduleId = ${AUSCT}}} OR (${baseEcl}) {{ C moduleId = ${AUTPR} }}`;
  };

  const { data: refsetData, isLoading: isRefsetLoading } = useConceptsByEcl(
    branch,
    getEcl(),
    {
      limit: paginationModel.pageSize,
      offset: paginationModel.page * paginationModel.pageSize,
      term: searchTerm,
    },
  );
  const { data: queryRefsetData, isLoading: isQueryRefsetLoading } =
    useConceptsByEcl(branch, includeQs ? `^ ${QUERY_REFERENCE_SET}` : '', {
      limit: 200,
    });
  const [refsets, setRefsets] = useState(Array<TickFlickRefsetConcept>());
  const [queryRefsets, setQueryRefsets] = useState(Array<Concept>());
  const [total, setTotal] = useState<number>();

  const { data: inactiveData } = useRefsetHasInactives(
    branch,
    refsetData?.items ?? [],
  );

  useEffect(() => {
    if (!isRefsetLoading) {
      let refsetConcepts: TickFlickRefsetConcept[] = refsetData?.items ?? [];
      refsetConcepts = refsetConcepts.map((refConcept, ind) => {
        return {
          ...refConcept,
          hasInactives: inactiveData[ind],
        };
      });

      if (queryRefsets.length) {
        refsetConcepts = refsetConcepts.map(refConcept => ({
          ...refConcept,
          isQuerySpec: !!queryRefsets.find(
            queryConcept => queryConcept.conceptId === refConcept.conceptId,
          ),
        }));
      }
      setRefsets(refsetConcepts);
      setTotal(refsetData?.total);
    }
  }, [refsetData, isRefsetLoading, queryRefsets, inactiveData]);

  useEffect(() => {
    if (!isQueryRefsetLoading) {
      setQueryRefsets(queryRefsetData?.items ?? []);
    }
  }, [queryRefsetData, isQueryRefsetLoading]);

  useEffect(() => {
    if (filterModel.quickFilterValues) {
      setSearchTerm((filterModel.quickFilterValues[0] as string) ?? '');
    }
  }, [filterModel]);

  useEffect(() => {
    setPaginationModel(p => ({ ...p, page: 0 }));
  }, [searchTerm, includeQs, auOnly]);

  const qsColumn = {
    field: 'isQuerySpec',
    headerName: 'Query-Based',
    width: 120,
    sortable: false,
    type: 'boolean',
    renderCell: (
      params: GridRenderCellParams<GridValidRowModel, boolean>,
    ): ReactNode =>
      params.value ? (
        <Tooltip title="Refset has a query specification">
          <CircleIcon fontSize="small" />
        </Tooltip>
      ) : null,
  };

  const columns: GridColDef[] = [
    {
      field: 'conceptId',
      headerName: 'Concept ID',
      width: 180,
      sortable: false,
      renderCell: (
        params: GridRenderCellParams<GridValidRowModel, string>,
      ): ReactNode => <Link to={`tnf/${params.value}`}>{params.value}</Link>,
    },
    {
      field: 'fsn',
      headerName: 'Fully Specified Name',
      flex: 1,
      valueGetter: (
        params: GridValueGetterParams<GridValidRowModel, Term>,
      ): string => {
        return params.value?.term ?? '';
      },
      sortable: false,
    },
    ...(includeQs ? [qsColumn] : []),
    {
      field: 'hasInactives',
      headerName: 'Has Inactives',
      width: 120,
      sortable: false,
      type: 'boolean',
      renderCell: (
        params: GridRenderCellParams<GridValidRowModel, boolean | 'loading'>,
      ): ReactNode =>
        params.value === 'loading' ? (
          <CircularProgress size="20px" />
        ) : params.value ? (
          <Tooltip title="Refset contains inactive concepts">
            <ChangeHistoryIcon fontSize="medium" color="error" />
          </Tooltip>
        ) : null,
    },
    {
      field: 'moduleId',
      headerName: 'Module ID',
      width: 200,
      sortable: false,
    },
  ];

  return (
    <Box pt="1em">
      <Card sx={{ width: '100%' }}>
        <DataGrid
          loading={
            (isRefsetLoading || isQueryRefsetLoading) &&
            serviceStatus?.authoringPlatform.running
          }
          sx={{
            fontSize: 14,
            color: '#003665',
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
            '& .MuiDataGrid-columnSeparator': {
              color: '#003665',
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
          rows={refsets}
          rowSpacingType="border"
          columns={columns}
          disableColumnSelector
          disableRowSelectionOnClick
          hideFooterSelectedRowCount
          disableDensitySelector
          disableColumnMenu
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
          filterMode="server"
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          slots={{ toolbar: RefsetListTableHeader }}
          slotProps={{
            toolbar: {
              quickFilterProps: { debounceMs: 500 },
              includeQsSwitchProps: {
                checked: includeQs,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  setIncludeQs(event.target.checked),
              },
              auOnlySwitchProps: {
                checked: auOnly,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  setAuOnly(event.target.checked),
              },
              tableName: 'Tick And Flick Reference Sets',
            },
          }}
        />
      </Card>
    </Box>
  );
}

interface RefsetListTableHeaderProps {
  tableName: string;
  includeQsSwitchProps: SwitchProps;
  auOnlySwitchProps: SwitchProps;
  quickFilterProps: GridToolbarQuickFilterProps;
}

function RefsetListTableHeader({
  tableName,
  includeQsSwitchProps,
  auOnlySwitchProps,
  quickFilterProps,
}: RefsetListTableHeaderProps) {
  return (
    <Stack direction={'row'} sx={{ padding: '1.5rem', alignItems: 'center' }}>
      <Typography
        variant="h1"
        sx={{ paddingRight: '1em', fontSize: '1.25rem' }}
      >
        {tableName}
      </Typography>
      <FormControlLabel
        control={<Switch {...auOnlySwitchProps} />}
        label="AU refsets only"
      />
      <FormControlLabel
        control={<Switch {...includeQsSwitchProps} />}
        label="Include query-based"
      />
      <Box
        sx={{
          p: 0.5,
          pb: 0,
          marginLeft: 'auto',
        }}
      >
        <GridToolbarQuickFilter
          quickFilterParser={(searchInput: string) =>
            searchInput
              .split(',')
              .map(value => value.trim())
              .filter(value => value !== '')
          }
          {...quickFilterProps}
        />
      </Box>
    </Stack>
  );
}

export default TickFlickRefsetList;
