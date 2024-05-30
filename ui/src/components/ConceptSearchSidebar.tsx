import { Button, Drawer, Stack, TextField } from '@mui/material';
import MainCard from './MainCard';
import { CloseCircleOutlined } from '@ant-design/icons';
import IconButton from './@extended/IconButton';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import SimpleBarScroll from './third-party/SimpleBar';
import { Box } from '@mui/system';
import { useTheme } from '@mui/material';
import {
  useSearchConceptByList,
  useSearchConceptByTerm,
} from '../hooks/api/products/useSearchConcept';
import useApplicationConfigStore from '../stores/ApplicationConfigStore';
import { Concept, ConceptResponse, Term } from '../types/concept';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
} from '@mui/x-data-grid';
import { Link } from 'react-router-dom';
import { generateEclFromBinding } from '../utils/helpers/EclUtils';
import { FieldBindings } from '../types/FieldBindings';
import { ConceptSearchResult } from '../pages/products/components/SearchProduct';

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

  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [letterSearchTerm, setLetterSearchTerm] = useState<string>('');

  const handleSearch = useCallback(() => {
    if (containsLetters(searchTerm)) {
      setLetterSearchTerm(searchTerm);
    } else {
      setSearchTerms(parseSearchTermsSctId(searchTerm));
    }
  }, [searchTerm]);

  const handleClear = useCallback(() => {
    setLetterSearchTerm('');
    setSearchTerms([]);
    setSearchTerm('');
  }, []);

  const { applicationConfig, fieldBindings } = useApplicationConfigStore();

  const { snowstormIsFetching, ontoLoading, ontoFetching, allData } =
    useSearchConceptByList(
      searchTerms,
      applicationConfig?.apDefaultBranch,
      fieldBindings as FieldBindings,
    );

  const {
    snowstormIsFetching: snowstormIsFetchingTerm,
    ontoFetching: ontoIsFetchingTerm,
    allData: allDataTerm,
  } = useSearchConceptByTerm(
    letterSearchTerm,
    applicationConfig?.apDefaultBranch,
    encodeURIComponent(
      generateEclFromBinding(fieldBindings as FieldBindings, 'product.search'),
    ),
  );

  function renderResultsTable() {
    if (
      (allDataTerm && containsLetters(searchTerm)) ||
      (containsLetters(searchTerm) && ontoLoading)
    ) {
      return (
        <SearchResultsTable
          concepts={allDataTerm}
          isLoading={ontoIsFetchingTerm && snowstormIsFetchingTerm}
        />
      );
    } else if (allDataTerm || ontoLoading) {
      return (
        <SearchResultsTable
          concepts={allData}
          isLoading={ontoFetching && snowstormIsFetching}
        />
      );
    } else {
      return <></>;
    }
  }

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
    >
      {open && (
        <MainCard
          title={title}
          sx={{
            border: 'none',
            borderRadius: 0,
            paddingBottom: '6em',
            height: '100%',
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
          <SimpleBarScroll
            sx={{
              '& .simplebar-content': {
                display: 'flex',
                flexDirection: 'column',
              },
            }}
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
                sx={{ padding: '1em', height: '100%' }}
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
                {renderResultsTable()}
              </Stack>
            </Box>
          </SimpleBarScroll>
        </MainCard>
      )}
    </Drawer>
  );
}

function containsLetters(searchTerm: string): boolean {
  return /[a-zA-Z]/.test(searchTerm);
}

export function parseSearchTermsSctId(
  searchTerm: string | null | undefined,
): string[] {
  if (!searchTerm) return [];
  // Split the searchTerm by commas and trim each part
  const terms = searchTerm.split(',').map(term => term.trim());

  // If the last term is an empty string or not a valid number, remove it
  if (
    terms[terms.length - 1] === '' ||
    isNaN(Number(terms[terms.length - 1]))
  ) {
    terms.pop();
  }

  // If any part is not a valid number, return an empty array
  if (terms.some(term => isNaN(Number(term)))) {
    return [];
  }

  // Convert each valid part to a number and return as an array
  return terms;
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
