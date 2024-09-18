import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridFilterModel,
  GridRowClassNameParams,
  GridRowParams,
  GridToolbarQuickFilter,
  GridToolbarQuickFilterProps,
  GridValidRowModel,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import {
  Box,
  Button,
  capitalize,
  Card,
  FormControlLabel,
  Stack,
  Switch,
  SwitchProps,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import { Concept, Term } from '../../../types/concept.ts';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SwapHorizontalCircleOutlinedIcon from '@mui/icons-material/SwapHorizontalCircleOutlined';
import SwapHorizontalCircleIcon from '@mui/icons-material/SwapHorizontalCircle';
import ConceptDetailsModal from './ConceptDetailsModal.tsx';
import { useConceptsByEcl } from '../../../hooks/eclRefset/useConceptsByEcl.tsx';
import {
  useReplaceMembersBulk,
  useRetireMembersBulk,
} from '../../../hooks/eclRefset/useUpdateRefsetMember.tsx';
import { enqueueSnackbar } from 'notistack';
import ConfirmModal from './ConfirmModal.tsx';
import { Query, useQueryClient } from '@tanstack/react-query';
import useUserStore from '../../../stores/UserStore.ts';
import useUserTaskByIds from '../../../hooks/eclRefset/useUserTaskByIds.tsx';
import TickFlickSearchModal from './TickFlickSearchModal.tsx';

interface TickFlickMembersListProps {
  branch: string;
  referenceSet: string;
}

function TickFlickMembersList({
  branch,
  referenceSet,
}: TickFlickMembersListProps) {
  const { serviceStatus } = useServiceStatus();
  const task = useUserTaskByIds();
  const { login } = useUserStore();
  const queryClient = useQueryClient();
  const theme = useTheme();

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [inactiveOnly, setInactiveOnly] = useState(false);

  const getEcl = () => {
    let ecl = `^ ${referenceSet}`;
    if (inactiveOnly) {
      ecl += ' {{ C active = 0 }}';
    }
    return ecl;
  };

  const { data, isFetching } = useConceptsByEcl(branch, getEcl(), {
    limit: paginationModel.pageSize,
    offset: paginationModel.page * paginationModel.pageSize,
    term: searchTerm,
    termActive: true,
  });
  const [concepts, setConcepts] = useState(Array<Concept>());
  const [filteredTotal, setFilteredTotal] = useState<number>();

  const [modalConcept, setModalConcept] = useState<Concept>();
  const [retireConcepts, setRetireConcepts] = useState(Array<Concept>());
  const [replaceConcepts, setReplaceConcepts] = useState(Array<Concept>());
  const [selectedConcepts, setSelectedConcepts] = useState<Concept[]>([]);

  useEffect(() => {
    setPaginationModel(p => ({ ...p, page: 0 }));
    setFilterModel(f => ({ ...f, quickFilterValues: [] }));

    setConcepts([]);
    setFilteredTotal(undefined);
  }, [referenceSet]);

  useEffect(() => {
    if (!isFetching) {
      setConcepts(data?.items ?? []);
      setFilteredTotal(data?.total);
    }
  }, [data, isFetching]);

  useEffect(() => {
    if (filterModel.quickFilterValues) {
      setSearchTerm((filterModel.quickFilterValues[0] as string) ?? '');
    }
  }, [filterModel]);

  const retireMemberMutation = useRetireMembersBulk(branch, referenceSet);
  const {
    isSuccess: isRetireSuccess,
    isPending: isRetirePending,
    reset: resetRetire,
  } = retireMemberMutation;
  useEffect(() => {
    if (isRetireSuccess && retireConcepts.length) {
      const conceptLabel = getConceptsLabel(retireConcepts);
      enqueueSnackbar(
        `${capitalize(conceptLabel)} ${retireConcepts.length !== 1 ? 'were' : 'was'} retired from the reference set successfully.`,
        {
          variant: 'success',
          autoHideDuration: 5000,
        },
      );

      setRetireConcepts([]);
      resetRetire();
      queryClient
        .invalidateQueries({
          predicate: (query: Query) =>
            (query.queryKey[0] as string).startsWith(
              `concept-${branch}-^ ${referenceSet}`,
            ),
        })
        .catch(console.error);
    }
  }, [
    isRetireSuccess,
    setRetireConcepts,
    queryClient,
    referenceSet,
    retireConcepts,
    branch,
    resetRetire,
  ]);

  const replaceMemberMutation = useReplaceMembersBulk(branch, referenceSet);
  const {
    isSuccess: isReplaceSuccess,
    isPending: isReplacePending,
    reset: resetReplace,
  } = replaceMemberMutation;
  useEffect(() => {
    if (isReplaceSuccess) {
      enqueueSnackbar(`Reference set updated successfully.`, {
        variant: 'success',
        autoHideDuration: 5000,
      });

      resetReplace();
      setReplaceConcepts([]);

      queryClient
        .invalidateQueries({
          predicate: (query: Query) =>
            (query.queryKey[0] as string).startsWith(
              `concept-${branch}-^ ${referenceSet}`,
            ),
        })
        .catch(console.error);
    }
  }, [isReplaceSuccess, branch, referenceSet, resetReplace, queryClient]);

  const columns: GridColDef[] = [
    {
      field: 'conceptId',
      headerName: 'Concept ID',
      width: 180,
      sortable: false,
    },
    {
      field: 'active',
      headerName: 'Active',
      type: 'boolean',
      sortable: false,
    },
    {
      field: 'fsn',
      headerName: 'Fully Specified Name',
      flex: 1,
      valueGetter: (params: GridValueGetterParams<GridValidRowModel, Term>) =>
        params.value?.term,
      sortable: false,
    },
    {
      field: 'actions',
      type: 'actions',
      width: 150,
      getActions: (params: GridRowParams<Concept>) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Show concept details">
              <InfoOutlinedIcon />
            </Tooltip>
          }
          label="Concept Info"
          onClick={() => setModalConcept(params.row)}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Replace member">
              <SwapHorizontalCircleOutlinedIcon />
            </Tooltip>
          }
          disabled={login !== task?.assignee.username}
          label="Replace"
          onClick={() => setReplaceConcepts([params.row])}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Retire member">
              <RemoveCircleOutlineIcon />
            </Tooltip>
          }
          disabled={login !== task?.assignee.username}
          label="Retire"
          onClick={() => setRetireConcepts([params.row])}
        />,
      ],
    },
  ];
  return (
    <>
      <Card sx={{ width: '100%' }}>
        <DataGrid
          loading={isFetching && serviceStatus?.authoringPlatform.running}
          sx={{
            fontSize: 14,
            color: '#003665',
            '& .MuiDataGrid-row': {
              borderBottom: 1,
              borderColor: 'rgb(240, 240, 240)',
              paddingLeft: '12px',
              '&.tnf-members-list__inactive': {
                color: theme.palette.error.main,
              },
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
            '& .MuiDataGrid-actionsCell .MuiIconButton-root': {
              color: '#003665',
            },
            '& .MuiDataGrid-virtualScroller': {
              minHeight: '45px',
              color: 'inherit',
            },
            '& .MuiDataGrid-withBorderColor': {
              borderColor: 'rgb(240, 240, 240)',
            },
            '& .MuiDataGrid-booleanCell[data-value]': {
              color: 'inherit',
            },
            '& .MuiCheckbox-root .MuiBox-root': {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            },
          }}
          getRowId={(row: Concept) => row.conceptId ?? ''}
          rows={concepts}
          rowSpacingType="border"
          getRowClassName={(params: GridRowClassNameParams<Concept>) =>
            !params.row.active ? 'tnf-members-list__inactive' : ''
          }
          columns={columns}
          disableColumnSelector
          disableRowSelectionOnClick
          checkboxSelection
          onRowSelectionModelChange={ids =>
            setSelectedConcepts(
              concepts.filter(c => c.conceptId && ids.includes(c.conceptId)),
            )
          }
          hideFooterSelectedRowCount
          disableDensitySelector
          disableColumnMenu
          density="compact"
          filterMode="server"
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          slots={{ toolbar: RefsetMembersTableHeader }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              inactiveSwitchProps: {
                checked: inactiveOnly,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  setInactiveOnly(event.target.checked),
              },
              quickFilterProps: {
                debounceMs: 500,
                quickFilterParser: (searchInput: string) => [
                  searchInput.trim(),
                ],
              },
              tableName: 'Members',
              showActions: !!selectedConcepts.length,
              onRetire: () => setRetireConcepts(selectedConcepts),
              onReplace: () => setReplaceConcepts(selectedConcepts),
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

      {retireConcepts.length ? (
        <ConfirmModal
          open={!!retireConcepts.length}
          title="Confirm Retire"
          body={
            <Stack spacing={1}>
              <Typography variant="body1" sx={{ p: '6px 0px' }}>
                {`Would you like to retire ${getConceptsLabel(retireConcepts)} from this reference set?`}
              </Typography>
            </Stack>
          }
          isActionLoading={isRetirePending}
          onConfirm={() =>
            retireMemberMutation.mutate(
              retireConcepts
                .map(c => c.conceptId)
                .filter(cid => !!cid) as string[],
            )
          }
          handleClose={() => setRetireConcepts([])}
          confirmButtonTitle="Retire Concepts"
          confirmButtonColor="error"
        />
      ) : null}

      <TickFlickSearchModal
        branch={branch}
        open={!!replaceConcepts.length}
        setOpen={open => setReplaceConcepts(open ? replaceConcepts : [])}
        action="replace"
        title={`Replace ${getConceptsLabel(replaceConcepts)}`}
        isActionLoading={isReplacePending}
        isActionSuccess={isReplaceSuccess}
        onConceptsValidated={addConceptIds =>
          replaceMemberMutation.mutate({
            retireConceptIds: replaceConcepts.map(c => c.conceptId || ''),
            addConceptIds,
          })
        }
      />
    </>
  );
}

interface RefsetMembersTableHeaderProps {
  tableName: string;
  inactiveSwitchProps: SwitchProps;
  quickFilterProps: GridToolbarQuickFilterProps;
  showActions: boolean;
  onRetire: () => unknown;
  onReplace: () => unknown;
}

function RefsetMembersTableHeader({
  tableName,
  inactiveSwitchProps,
  quickFilterProps,
  showActions,
  onRetire,
  onReplace,
}: RefsetMembersTableHeaderProps) {
  const task = useUserTaskByIds();
  const { login } = useUserStore();
  return (
    <Stack direction={'row'} sx={{ padding: '1.5rem', alignItems: 'center' }}>
      <Typography
        variant="h1"
        sx={{ paddingRight: '1em', fontSize: '1.25rem' }}
      >
        {tableName}
      </Typography>
      <FormControlLabel
        control={<Switch {...inactiveSwitchProps} />}
        label="Inactive concepts only"
      />
      <Box
        sx={{
          marginLeft: 'auto',
        }}
      >
        <Stack direction="row" spacing={2}>
          {showActions ? (
            <>
              <Button
                variant="contained"
                startIcon={
                  <SwapHorizontalCircleIcon
                    sx={{ fontSize: '1rem !important' }}
                  />
                }
                disabled={login !== task?.assignee.username}
                onClick={onReplace}
              >
                Replace Selected
              </Button>
              <Button
                variant="contained"
                startIcon={
                  <RemoveCircleIcon sx={{ fontSize: '1rem !important' }} />
                }
                color="error"
                disabled={login !== task?.assignee.username}
                onClick={onRetire}
              >
                Retire Selected
              </Button>
            </>
          ) : null}
          <Box
            sx={{
              p: 0.5,
              pb: 0,
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
      </Box>
    </Stack>
  );
}

const getConceptsLabel = (concepts: Concept[]) => {
  if (concepts.length === 1)
    return `concept '${concepts[0].fsn?.term || concepts[0].conceptId}'`;
  return `${concepts.length} concepts`;
};

export default TickFlickMembersList;
