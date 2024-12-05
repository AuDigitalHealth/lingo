import { Button, Drawer, Stack, TextField } from '@mui/material';
import MainCard from './MainCard';
import { CloseCircleOutlined } from '@ant-design/icons';
import IconButton from './@extended/IconButton';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/system';
import { useTheme } from '@mui/material';
import {
  useSearchConceptByArtgIdList,
  useSearchConceptBySctIdList,
  useSearchConceptByTerm,
} from '../hooks/api/products/useSearchConcept';
import useApplicationConfigStore from '../stores/ApplicationConfigStore';
import { Concept, Term } from '../types/concept';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
} from '@mui/x-data-grid';
import { Link } from 'react-router-dom';
import { generateEclFromBinding } from '../utils/helpers/EclUtils';
import { ConceptSearchResult } from '../pages/products/components/SearchProduct';
import { useFieldBindings } from '../hooks/api/useInitializeConfig';
import {
  isArtgId,
  isSctId,
  parseSearchTermsSctId,
} from '../utils/helpers/conceptUtils';

interface ConceptSearchSidebarProps {
  toggle: (bool: boolean) => void;
  open: boolean;
  title: string;
}

export function ConceptSearchSidebar({
  toggle,
  open,
  title,
}: ConceptSearchSidebarProps) {
  const theme = useTheme();
  const handleToggle = useCallback(() => {
    toggle(!open);
  }, [open, toggle]);

  const [searchTerm, setSearchTerm] = useState('');

  const [searchBySctIds, setSearchBySctIds] = useState<string[]>([]);
  const [searchByArtgId, setSearchByArtgId] = useState<string>('');
  const [letterSearchTerm, setLetterSearchTerm] = useState<string>('');

  const handleSearch = useCallback(() => {
    if (containsLetters(searchTerm)) {
      setLetterSearchTerm(searchTerm);
      setSearchBySctIds([]);
      setSearchByArtgId('');
    } else if (isSctId(searchTerm)) {
      //overlap with artgid so do a fallback to artgId
      setSearchBySctIds(parseSearchTermsSctId(searchTerm));
      setLetterSearchTerm('');
      setSearchByArtgId('');
    } else if (isArtgId(searchTerm)) {
      setSearchByArtgId(searchTerm);
      setLetterSearchTerm('');
      setSearchBySctIds([]);
    } else {
      setSearchBySctIds(parseSearchTermsSctId(searchTerm));
      setLetterSearchTerm('');
      setSearchByArtgId('');
    }
  }, [searchTerm]);

  const handleClear = useCallback(() => {
    setLetterSearchTerm('');
    setSearchBySctIds([]);
    setSearchByArtgId('');
    setSearchTerm('');
  }, []);

  const { applicationConfig } = useApplicationConfigStore();

  const { fieldBindings } = useFieldBindings(
    applicationConfig?.apDefaultBranch,
  );
  const {
    snowstormIsFetching,
    ontoLoading,
    ontoFetching,
    allData,
    ontoError,
    snowstormError,
  } = useSearchConceptBySctIdList(
    searchBySctIds,
    applicationConfig?.apDefaultBranch,
    fieldBindings,
  );

  const {
    snowstormIsFetching: snowstormIsFetchingArtgId,
    ontoLoading: ontoIsLoadingArtgId,
    ontoFetching: ontoIsFetchingArtgId,
    allData: allDataArtgId,
    ontoError: ontoErrorArtgId,
    snowstormError: snowstormErrorArtgId,
  } = useSearchConceptByArtgIdList(
    searchByArtgId,
    applicationConfig?.apDefaultBranch,
    fieldBindings,
  );

  const {
    snowstormIsFetching: snowstormIsFetchingTerm,
    ontoFetching: ontoIsFetchingTerm,
    allData: allDataTerm,
    snowstormError: snowstormErrorTerm,
    ontoError: ontoErrorTerm,
  } = useSearchConceptByTerm(
    letterSearchTerm,
    applicationConfig?.apDefaultBranch,
    encodeURIComponent(generateEclFromBinding(fieldBindings, 'product.search')),
  );

  useEffect(() => {
    //fallback logic to search with Artg id
    if (
      searchBySctIds.length > 0 &&
      allData &&
      allData.length < 1 &&
      isArtgId(searchTerm)
    ) {
      setSearchByArtgId(searchTerm);
      setLetterSearchTerm('');
      setSearchBySctIds([]);
    }
    // eslint-disable-next-line
  }, [searchBySctIds]);

  const resultsTable = useMemo(() => {
    if (
      (allDataTerm && containsLetters(searchTerm)) ||
      (containsLetters(searchTerm) && ontoLoading)
    ) {
      return (
        <SearchResultsTable
          concepts={allDataTerm}
          isLoading={
            ontoIsFetchingTerm &&
            snowstormIsFetchingTerm &&
            !(ontoErrorTerm || snowstormErrorTerm)
          }
        />
      );
    } else if ((allData && searchBySctIds.length > 0) || ontoLoading) {
      return (
        <SearchResultsTable
          concepts={allData}
          isLoading={
            (ontoFetching || snowstormIsFetching) &&
            !(ontoError || snowstormError)
          }
        />
      );
    } else if (
      (allDataArtgId && searchByArtgId.length > 0) ||
      ontoIsLoadingArtgId
    ) {
      return (
        <SearchResultsTable
          concepts={allDataArtgId}
          isLoading={
            (ontoIsFetchingArtgId || snowstormIsFetchingArtgId) &&
            !(ontoErrorArtgId || snowstormErrorArtgId)
          }
        />
      );
    } else {
      return <></>;
    }
  }, [
    allData,
    allDataTerm,
    allDataArtgId,
    searchTerm,
    searchBySctIds,
    searchByArtgId,
    ontoError,
    snowstormError,
    snowstormErrorTerm,
    ontoErrorTerm,
    ontoErrorArtgId,
    snowstormErrorArtgId,
    ontoIsFetchingTerm,
    snowstormIsFetchingTerm,
    ontoLoading,
    ontoFetching,
    snowstormIsFetching,
    ontoIsLoadingArtgId,
    ontoIsFetchingArtgId,
    snowstormIsFetchingArtgId,
  ]);

  return (
    <Drawer
      sx={{
        zIndex: 2001,
      }}
      anchor="right"
      onClose={handleToggle}
      open={open}
      PaperProps={{
        sx: {
          width: 680,
        },
      }}
      disableEnforceFocus
    >
      {open && (
        <MainCard
          title={title}
          sx={{
            border: 'none',
            borderRadius: 0,
            paddingBottom: '6em',
            height: '100vh',
            '& .MuiCardHeader-root': {
              color: 'background.paper',
              bgcolor: 'primary.main',
              '& .MuiTypography-root': { fontSize: '1rem' },
            },
          }}
          content={false}
          secondary={
            <IconButton
              shape="rounded"
              size="small"
              onClick={handleToggle}
              sx={{ color: 'background.paper' }}
            >
              <CloseCircleOutlined style={{ fontSize: '1.15rem' }} />
            </IconButton>
          }
        >
          <Box
            sx={{
              height: 'calc(100vh)',
              '& .MuiAccordion-root': {
                borderColor: theme.palette.divider,
                '& .MuiAccordionSummary-root': {
                  bgcolor: 'transparent',
                  flexDirection: 'row',
                  pl: 1,
                },
                '& .MuiAccordionDetails-root': {
                  border: 'none',
                },
                '& .Mui-expanded': {
                  color: theme.palette.primary.main,
                },
              },
            }}
          >
            <Stack
              direction={'column'}
              sx={{ padding: '1em', height: 'calc(100% - 70px)' }}
            >
              <Stack direction={'row'} alignItems={'center'} width={'100%'}>
                <TextField
                  variant="outlined"
                  label="Search"
                  value={searchTerm}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchTerm(event.target.value);
                  }}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  sx={{ marginLeft: '1em' }}
                  disabled={searchTerm === ''}
                  onClick={handleSearch}
                >
                  Search
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  sx={{ marginLeft: '1em' }}
                  disabled={searchTerm === '' && (!allDataTerm || !allData)}
                  onClick={handleClear}
                >
                  Clear
                </Button>
              </Stack>
              {resultsTable}
            </Stack>
          </Box>
        </MainCard>
      )}
    </Drawer>
  );
}

function containsLetters(searchTerm: string): boolean {
  return /[a-zA-Z]/.test(searchTerm);
}

interface SearchResultsTableProps {
  concepts: ConceptSearchResult[];
  isLoading: boolean;
}

function SearchResultsTable({ concepts, isLoading }: SearchResultsTableProps) {
  const columns: GridColDef[] = [
    {
      field: 'conceptId',
      headerName: 'Concept Id',
      width: 200,
      // eslint-disable-next-line
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <Link
          to={`/dashboard/products/${params.value}`}
          className={'task-details-link'}
        >
          {params.value!.toString()}
        </Link>
      ),
    },
    {
      field: 'fsn',
      headerName: 'Fully Specified Name',
      // eslint-disable-next-line
      valueGetter: (params: GridRenderCellParams<any, Term>): string => {
        return params.value?.term as string;
      },
      width: 200,
    },
  ];
  return (
    <DataGrid
      loading={isLoading}
      sx={{
        marginTop: '1em',
        marginBottom: '1em',
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
      className={'search-result-list'}
      getRowHeight={() => 'auto'}
      getRowId={(row: Concept) => row.id as GridRowId}
      rows={concepts}
      columns={columns}
      disableColumnSelector
      hideFooterSelectedRowCount
      disableDensitySelector
      disableColumnFilter={true}
      disableColumnMenu={true}
      disableRowSelectionOnClick={true}
      hideFooter={true}
    />
  );
}
