import { Button, Drawer, Input, Stack, TextField } from '@mui/material';
import MainCard from './MainCard';
import { CloseCircleOutlined } from '@ant-design/icons';
import IconButton from './@extended/IconButton';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import SimpleBarScroll from './third-party/SimpleBar';
import { Box, width } from '@mui/system';
import { useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import {
  useSearchConcept,
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

type Anchor = 'top' | 'left' | 'bottom' | 'right';

interface GenericSidebarProps {
  toggle: (bool: boolean) => void;
  open: boolean;
  title: string;
}

export function GenericSidebar({ toggle, open, title }: GenericSidebarProps) {
  const theme = useTheme();
  const handleToggle = useCallback(() => {
    toggle(!open);
  }, [open]);

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

  const { isLoading, data, fetchStatus } = useSearchConceptByList(
    searchTerms,
    applicationConfig?.apDefaultBranch as string,
  );

  const {
    isLoading: isLoadingByTerm,
    data: dataByTerm,
    fetchStatus: termFetchStatus,
  } = useSearchConceptByTerm(
    letterSearchTerm,
    applicationConfig?.apDefaultBranch as string,
    encodeURIComponent(
      generateEclFromBinding(fieldBindings as FieldBindings, 'product.search'),
    ),
  );

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
                height: 'calc(100vh - 64px)',
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
              <Stack direction={'row'} sx={{ padding: '1em' }}>
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
                    disabled={searchTerm === ''}
                    onClick={handleClear}
                  >
                    Clear
                  </Button>
                </Stack>
              </Stack>
              {(data || (isLoading && fetchStatus === 'fetching')) && (
                <SearchResultsTable concepts={data} isLoading={isLoading} />
              )}
              {(dataByTerm ||
                (isLoadingByTerm && termFetchStatus === 'fetching')) && (
                <SearchResultsTable
                  concepts={dataByTerm}
                  isLoading={isLoadingByTerm}
                />
              )}
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

export function parseSearchTermsSctId(searchTerm: string): string[] {
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
  concepts: ConceptResponse | undefined;
  isLoading: boolean;
}

function SearchResultsTable({ concepts, isLoading }: SearchResultsTableProps) {
  const columns: GridColDef[] = [
    {
      field: 'conceptId',
      headerName: 'Concept Id',
      width: 200,
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
      // renderCell: (params) => (
      //     <div style={{ whiteSpace: 'pre-line', maxWidth: 300 }}>{params.value}</div>
      // ),
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
      //   rowHeight={'auto'}
      className={'task-list'}
      getRowHeight={() => 'auto'}
      //   density={'compact'}
      getRowId={(row: Concept) => row.id as GridRowId}
      rows={concepts?.items ? concepts?.items : []}
      columns={columns}
      disableColumnSelector
      hideFooterSelectedRowCount
      disableDensitySelector
      //   slots={!naked ? { toolbar: TableHeaders } : {}}
      //   slotProps={
      //     !naked
      //       ? {
      //           toolbar: {
      //             showQuickFilter: true,
      //             quickFilterProps: { debounceMs: 500 },
      //             tableName: heading,
      //           },
      //         }
      //       : {}
      //   }
      //   initialState={
      //     !naked
      //       ? {
      //           pagination: {
      //             paginationModel: { page: 0, pageSize: 10 },
      //           },
      //         }
      //       : {}
      //   }
      //   pageSizeOptions={!naked ? [10, 15, 20, 25] : []}
      disableColumnFilter={true}
      disableColumnMenu={true}
      disableRowSelectionOnClick={true}
      hideFooter={true}
    />
  );
}
