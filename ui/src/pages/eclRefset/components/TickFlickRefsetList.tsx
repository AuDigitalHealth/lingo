import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import {
  Concept,
  Term,
  TickFlickRefsetConcept,
} from '../../../types/concept.ts';
import {
  DataGrid,
  GridColDef,
  GridFilterModel,
  GridRenderCellParams,
  GridSlotsComponent,
  GridSlotsComponentsProps,
  GridToolbarQuickFilter,
  GridToolbarQuickFilterProps,
  GridValidRowModel,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import {
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
import { useConceptsByEclAllPages } from '../../../hooks/eclRefset/useConceptsByEcl.tsx';
import CircleIcon from '@mui/icons-material/Circle';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import { useRefsetHasInactives } from '../../../hooks/eclRefset/useRefsetHasInactives.tsx';
import { useApplicationConfig } from '../../../hooks/api/useInitializeConfig.tsx';
import { UncapitalizeObjectKeys } from '@mui/x-data-grid/internals';

interface TickFlickRefsetListProps {
  branch: string;
}

function TickFlickRefsetList({ branch }: TickFlickRefsetListProps) {
  const { applicationConfig } = useApplicationConfig();

  const [extensionRefsetsOnly, setExtensionRefsetsOnly] = useState(true);
  const [includeQs, setIncludeQs] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });
  const [showInactives, setShowInactives] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  const getEcl = () => {
    const baseEcl = includeQs ? SIMPLE_TYPE_REFSET_ECL : TICK_FLICK_REFSET_ECL;
    if (
      !extensionRefsetsOnly ||
      !applicationConfig?.snodineExtensionModules.length
    )
      return baseEcl;

    return applicationConfig.snodineExtensionModules
      .map(moduleId => `(${baseEcl}) {{ C moduleId = ${moduleId}}}`)
      .join(' OR ');
  };

  const { data: refsetData, isLoading: isRefsetLoading } =
    useConceptsByEclAllPages(branch, getEcl(), {
      limit: 1000,
      offset: 0,
      term: searchTerm,
    });

  const { data: queryRefsetData, isLoading: isQueryRefsetLoading } =
    useConceptsByEclAllPages(
      branch,
      includeQs ? `^ ${QUERY_REFERENCE_SET}` : '',
      {
        limit: 200,
      },
    );

  const [refsets, setRefsets] = useState(Array<TickFlickRefsetConcept>());
  const [queryRefsets, setQueryRefsets] = useState(Array<Concept>());
  const [total, setTotal] = useState<number>();

  const { data: inactiveData, isLoading: inactiveDataLoading } =
    useRefsetHasInactives(branch, refsetData?.items ?? [], showInactives);

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
  }, [searchTerm, includeQs, extensionRefsetsOnly]);

  return (
    <Box>
      <Stack sx={{ width: '100%', padding: '0em 0em 1em 1em' }}></Stack>

      <Box pt="1em">
        <Card sx={{ width: '100%' }}>
          (
          <TickFlickRefsitListGrid
            isLoading={
              isRefsetLoading || isQueryRefsetLoading || inactiveDataLoading
            }
            includeQs={includeQs}
            refsets={refsets}
            total={total}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            filterModel={filterModel}
            setFilterModel={setFilterModel}
            slotProps={{
              toolbar: {
                quickFilterProps: { debounceMs: 500 },
                includeQsSwitchProps: {
                  checked: includeQs,
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                    setIncludeQs(event.target.checked),
                },
                extensionRefsetOnlySwitchProps: {
                  checked: extensionRefsetsOnly,
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                    setExtensionRefsetsOnly(event.target.checked),
                },
                showInactivesSwitchProps: {
                  checked: showInactives,
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                    setShowInactives(event.target.checked),
                },
                tableName: 'Tick And Flick Reference Sets',
              },
            }}
            slots={{ toolbar: RefsetListTableHeader }}
          />
          )
        </Card>
      </Box>
    </Box>
  );
}

interface TickFlickRefsitListGridProps {
  isLoading: boolean;
  includeQs: boolean;
  refsets: Array<TickFlickRefsetConcept>;
  total: number | undefined;
  paginationModel: {
    page: number;
    pageSize: number;
  };
  setPaginationModel: Dispatch<
    SetStateAction<{
      page: number;
      pageSize: number;
    }>
  >;
  filterModel: GridFilterModel;
  setFilterModel: Dispatch<SetStateAction<GridFilterModel>>;
  slotProps?: GridSlotsComponentsProps | undefined;
  slots?: UncapitalizeObjectKeys<Partial<GridSlotsComponent>> | undefined;
}

function TickFlickRefsitListGrid({
  isLoading,
  refsets,
  total,
  paginationModel,
  setPaginationModel,
  slots,
  slotProps,
}: TickFlickRefsitListGridProps) {
  const { serviceStatus } = useServiceStatus();

  const columns: GridColDef[] = [
    {
      field: 'conceptId',
      headerName: 'Concept ID',
      width: 180,
      sortable: true,
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
      sortable: true,
    },
    {
      field: 'isQuerySpec',
      headerName: 'Query-Based',
      width: 120,
      sortable: true,
      type: 'boolean',
      renderCell: (
        params: GridRenderCellParams<GridValidRowModel, boolean>,
      ): ReactNode => {
        return params.value ? (
          <Tooltip title="Refset has a query specification">
            <CircleIcon fontSize="small" />
          </Tooltip>
        ) : null;
      },
    },
    {
      field: 'hasInactives',
      headerName: 'Has Inactives',
      width: 120,
      sortable: true,
      filterable: true,
      filterOperators: [
        {
          label: 'Has inactives',
          value: 'hasInactives',
          getApplyFilterFn: () => {
            return (params): boolean => {
              return params.value === true;
            };
          },
        },
        {
          label: 'No inactives',
          value: 'noInactives',
          getApplyFilterFn: () => {
            return (params): boolean => {
              return params.value === false;
            };
          },
        },
        {
          label: 'Still loading',
          value: 'loading',
          getApplyFilterFn: () => {
            return (params): boolean => {
              return params.value === 'loading';
            };
          },
        },
        {
          label: 'Has result',
          value: 'hasResult',
          getApplyFilterFn: () => {
            return (params): boolean => {
              return params.value !== 'loading';
            };
          },
        },
      ],
      type: 'singleSelect',
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
    <DataGrid
      loading={isLoading && serviceStatus?.authoringPlatform.running}
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
      disableColumnMenu={false}
      pageSizeOptions={[10, 25]}
      paginationMode="client"
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
      slots={slots}
      slotProps={slotProps}
    />
  );
}

interface RefsetListTableHeaderProps {
  tableName: string;
  includeQsSwitchProps: SwitchProps;
  extensionRefsetOnlySwitchProps: SwitchProps;
  showInactivesSwitchProps: SwitchProps;
  quickFilterProps: GridToolbarQuickFilterProps;
}

function RefsetListTableHeader({
  tableName,
  includeQsSwitchProps,
  extensionRefsetOnlySwitchProps,
  showInactivesSwitchProps,
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
        control={<Switch {...extensionRefsetOnlySwitchProps} />}
        label="Extension refsets only"
      />
      <FormControlLabel
        control={<Switch {...includeQsSwitchProps} />}
        label="Include query-based"
      />
      <FormControlLabel
        control={<Switch {...showInactivesSwitchProps} />}
        label="Load Inactives"
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
