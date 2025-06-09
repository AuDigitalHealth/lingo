import { useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  capitalize,
  Checkbox,
  createFilterOptions,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRowParams,
  GridValidRowModel,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import { LoadingButton } from '@mui/lab';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import BaseModal from '../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../components/modal/BaseModalHeader.tsx';
import BaseModalFooter from '../../../components/modal/BaseModalFooter.tsx';
import { ECL_SCOPES } from '../utils/constants.tsx';
import { useConceptsByEcl } from '../../../hooks/eclRefset/useConceptsByEcl.tsx';
import useDebounce from '../../../hooks/useDebounce.tsx';
import { Concept, Term } from '../../../types/concept.ts';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import ConceptDetailsModal from './ConceptDetailsModal.tsx';
import { SnowstormError } from '../../../types/ErrorHandler.ts';
import { AxiosError } from 'axios';
import InvalidEclError from './InvalidEclError.tsx';
import { useValidateConcepts } from '../../../hooks/eclRefset/useValidateConcepts.tsx';

interface ScopeOption {
  label: string;
  ecl: string;
  custom?: boolean;
}

const filter = createFilterOptions<ScopeOption>({
  stringify: option => `${option.label} ${option.ecl}`,
});

interface TickFlickSearchModalProps {
  branch: string;
  open: boolean;
  setOpen: (open: boolean) => unknown;
  action: 'add' | 'replace';
  title: string;
  isActionLoading: boolean;
  isActionSuccess: boolean;
  onConceptsValidated: (conceptIds: string[]) => unknown;
}

export default function TickFlickSearchModal({
  branch,
  open,
  setOpen,
  action,
  title,
  isActionLoading,
  isActionSuccess,
  onConceptsValidated,
}: TickFlickSearchModalProps) {
  const { serviceStatus } = useServiceStatus();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [scope, setScope] = useState<ScopeOption | null>(null);

  const handleClose = () => setOpen(false);

  const [allowInactives, setAllowInactives] = useState(false);

  const [selectedConceptIds, setSelectedConceptIds] = useState(Array<string>());
  const isConceptSelected = (conceptId: string | undefined) =>
    !!conceptId && selectedConceptIds.includes(conceptId);
  const uniqueConceptIds = selectedConceptIds
    .map(c => c.trim())
    .filter((c, ind, arr) => !!c && arr.indexOf(c) === ind);

  const [invalidConceptIds, setInvalidConceptIds] = useState<string[]>();
  const { validateConceptIds, validateLoading } = useValidateConcepts(branch);

  useEffect(() => {
    if (isActionSuccess) {
      setSelectedConceptIds([]);
      setInvalidConceptIds(undefined);

      setSearchTerm('');
    }
  }, [isActionSuccess]);

  const onConfirm = () => {
    setInvalidConceptIds(undefined);

    const conceptIdsToCheck = uniqueConceptIds.filter(conceptId =>
      conceptId.match(/^\d{6,18}$/),
    );

    validateConceptIds(conceptIdsToCheck, allowInactives)
      .then(validIds => {
        const invalidIds = validIds
          ? uniqueConceptIds.filter(c => !validIds.includes(c))
          : undefined;
        setInvalidConceptIds(invalidIds);
        if (invalidIds && !invalidIds.length) {
          // No invalid IDs found, continue
          onConceptsValidated(uniqueConceptIds);
        }
      })
      .catch(console.error);
  };

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const { data, isLoading, error } = useConceptsByEcl(
    branch,
    debouncedSearchTerm && scope?.ecl.trim() ? scope?.ecl.trim() : '',
    {
      limit: paginationModel.pageSize,
      offset: paginationModel.page * paginationModel.pageSize,
      term: debouncedSearchTerm,
      activeFilter: true,
      termActive: true,
    },
  );

  const [searchConcepts, setSearchConcepts] = useState(Array<Concept>());
  const [searchTotal, setSearchTotal] = useState<number>();
  const [invalidEcl, setInvalidEcl] = useState(false);
  const [modalConcept, setModalConcept] = useState<Concept>();

  useEffect(() => {
    if (!isLoading) {
      setSearchConcepts(data?.items ?? []);
      setSearchTotal(data?.total);
    }
  }, [data, isLoading]);

  useEffect(() => {
    if (error) {
      const err = error as AxiosError<SnowstormError>;
      if (err.response?.status === 400) {
        setInvalidEcl(true);
      }
    }
  }, [error, setInvalidEcl]);

  useEffect(() => {
    setInvalidEcl(false);
  }, [searchTerm, scope]);

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
      valueGetter: (params: GridValueGetterParams<GridValidRowModel, Term>) =>
        params.value?.term,
      sortable: false,
    },
    {
      field: 'actions',
      type: 'actions',
      width: 100,
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
            isConceptSelected(params.row.conceptId) ? (
              <Tooltip title="Remove">
                <RemoveCircleOutlineIcon />
              </Tooltip>
            ) : (
              <Tooltip title="Select">
                <AddCircleOutlineIcon />
              </Tooltip>
            )
          }
          label="Add"
          onClick={() => {
            const conceptId = params.row.conceptId;
            if (!conceptId) return;
            if (isConceptSelected(conceptId)) {
              setSelectedConceptIds(
                selectedConceptIds.filter(c => !!c.trim() && c !== conceptId),
              );
            } else {
              setSelectedConceptIds([
                ...selectedConceptIds.filter(c => !!c.trim()),
                conceptId,
              ]);
            }
          }}
        />,
      ],
    },
  ];

  return (
    <>
      <BaseModal
        open={open}
        handleClose={
          !(validateLoading || isActionLoading) ? handleClose : undefined
        }
      >
        <BaseModalHeader title={title} />
        <BaseModalBody
          sx={{
            padding: 0,
          }}
        >
          <Stack
            width="100%"
            spacing={1}
            sx={{
              maxHeight: '80vh',
              padding: '1em',
            }}
          >
            <Stack spacing={1}>
              <Stack
                direction={'row'}
                alignItems={'center'}
                width={'100%'}
                spacing={1}
                sx={{
                  paddingTop: '8px',
                }}
              >
                <TextField
                  variant="outlined"
                  value={searchTerm}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchTerm(event.target.value);
                  }}
                  placeholder="Search for a concept"
                  InputProps={{
                    startAdornment: <SearchIcon />,
                    endAdornment: searchTerm ? (
                      <Tooltip title="Clear">
                        <IconButton onClick={() => setSearchTerm('')}>
                          <ClearIcon />
                        </IconButton>
                      </Tooltip>
                    ) : null,
                  }}
                  sx={{ flex: 1, width: 500 }}
                />
                <Autocomplete
                  freeSolo
                  forcePopupIcon
                  options={ECL_SCOPES as ScopeOption[]}
                  value={scope}
                  onChange={(event, newValue) => {
                    if (typeof newValue !== 'string') {
                      setScope(newValue);
                    }
                  }}
                  clearOnBlur
                  selectOnFocus
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    if (params.inputValue !== '') {
                      filtered.push({
                        custom: true,
                        ecl: params.inputValue,
                        label: `Use custom ECL:`,
                      });
                    }
                    return filtered;
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Scope"
                      sx={{ '& .MuiInputLabel-root': { overflow: 'unset' } }}
                    />
                  )}
                  getOptionLabel={option => {
                    if (typeof option === 'string') return option;
                    return option.ecl;
                  }}
                  renderOption={(props: object, option) => {
                    const { key: key, ...otherProps } = props;
                    return (
                      <Box
                        {...otherProps}
                        key={`${option.ecl} ${option.custom}`}
                      >
                        <Box width={'100%'}>
                          <Typography variant="body1">
                            {option.label}
                          </Typography>
                          <Typography variant="caption">
                            {option.ecl}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }}
                  sx={{ flex: 1, width: 500 }}
                />
              </Stack>

              {debouncedSearchTerm && debouncedSearchTerm.length > 2 ? (
                invalidEcl ? (
                  <InvalidEclError />
                ) : (
                  <DataGrid
                    loading={
                      isLoading && serviceStatus?.authoringPlatform.running
                    }
                    sx={theme => ({
                      fontSize: 14,
                      color: '#003665',
                      '& .MuiDataGrid-row': {
                        borderBottom: 1,
                        borderColor: 'rgb(240, 240, 240)',
                        paddingLeft: '12px',
                        '&.concepts-list__selected': {
                          color: theme.palette.secondary.main,
                        },
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        border: 'none',
                      },
                      '& .MuiDataGrid-footerContainer': {
                        border: 0,
                      },
                      '& .MuiTablePagination-root': {
                        color: '#003665',
                        '& .MuiTablePagination-displayedRows': {
                          margin: 0,
                        },
                      },
                      '& .MuiDataGrid-actionsCell .MuiIconButton-root': {
                        color: 'inherit',
                      },
                      '& .MuiDataGrid-virtualScroller': {
                        minHeight: '45px',
                        color: 'inherit',
                      },
                      '& .MuiDataGrid-withBorderColor': {
                        borderColor: 'rgb(240, 240, 240)',
                      },
                    })}
                    getRowId={(row: Concept) => row.conceptId ?? ''}
                    rows={searchConcepts}
                    getRowClassName={params =>
                      isConceptSelected(params.row.conceptId)
                        ? 'concepts-list__selected'
                        : ''
                    }
                    rowSpacingType="border"
                    autoHeight
                    columns={columns}
                    columnHeaderHeight={0}
                    disableColumnSelector
                    disableRowSelectionOnClick
                    hideFooterSelectedRowCount
                    disableDensitySelector
                    disableColumnMenu
                    density="compact"
                    pageSizeOptions={[10]}
                    paginationMode="server"
                    rowCount={searchTotal ?? 0}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                  />
                )
              ) : null}
            </Stack>

            <Stack direction="row" spacing={1} width="100%" pt="8px">
              <TextField
                multiline
                fullWidth
                maxRows={15}
                label="Selected concept IDs"
                value={selectedConceptIds.join('\n')}
                helperText={
                  !uniqueConceptIds.length
                    ? ''
                    : `${uniqueConceptIds.length} concept ID${uniqueConceptIds.length !== 1 ? 's' : ''}`
                }
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setSelectedConceptIds(event.target.value.split('\n'));
                }}
                InputProps={{
                  readOnly: validateLoading || isActionLoading,
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    lineHeight: '1.4375em',
                  },
                }}
              />

              {invalidConceptIds && invalidConceptIds.length ? (
                <TextField
                  multiline
                  maxRows={15}
                  label="Invalid concept IDs"
                  error
                  value={invalidConceptIds?.join('\n')}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    width: '20em',
                  }}
                />
              ) : null}
            </Stack>
          </Stack>
        </BaseModalBody>
        <BaseModalFooter
          startChildren={
            <>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allowInactives}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setAllowInactives(event.target.checked)
                    }
                    sx={{ marginLeft: '8px' }}
                  />
                }
                label="Allow inactive concepts"
              />
            </>
          }
          endChildren={
            <Stack direction="row" spacing={1} alignItems="center">
              {validateLoading ? (
                <Typography sx={{ fontStyle: 'italic' }}>
                  Validating concept IDs...
                </Typography>
              ) : isActionLoading ? (
                <Typography sx={{ fontStyle: 'italic' }}>
                  {`${action === 'add' ? 'Adding' : 'Replacing'} members...`}
                </Typography>
              ) : null}
              <LoadingButton
                variant="contained"
                loading={validateLoading || isActionLoading}
                disabled={!uniqueConceptIds.length}
                onClick={() => onConfirm()}
                sx={{ color: '#fff', textTransform: 'none' }}
              >
                {capitalize(action)}
              </LoadingButton>
              <Button
                variant="contained"
                color="error"
                onClick={handleClose}
                disabled={validateLoading || isActionLoading}
              >
                Cancel
              </Button>
            </Stack>
          }
        />
      </BaseModal>
      {modalConcept ? (
        <ConceptDetailsModal
          concept={modalConcept}
          handleClose={() => setModalConcept(undefined)}
        />
      ) : null}
    </>
  );
}
