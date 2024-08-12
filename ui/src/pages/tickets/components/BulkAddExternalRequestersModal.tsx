import React, { useRef, useState } from 'react';
import useTicketStore from '../../../stores/TicketStore';

import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import {
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';
import ExternalRequestorChip from './ExternalRequestorChip';
import Checkbox from '@mui/material/Checkbox';
import { SelectChangeEvent } from '@mui/material/Select';
import { Box } from '@mui/system';
import {
  AdditionalFieldType,
  AdditionalFieldTypeEnum,
  BulkAddExternalRequestorRequest,
  BulkAddExternalRequestorResponse,
  ExternalRequestor,
  Ticket,
} from '../../../types/tickets/ticket';
import { useBulkCreateExternalRequestors } from '../../../hooks/api/tickets/useUpdateTicket';
import {
  containsCharacters,
  detectDelimiter,
} from '../../../utils/helpers/commonUtils';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { bulkAddExternalRequestorSchema } from '../../../types/productValidations';

import { FieldLabelRequired } from '../../products/components/style/ProductBoxes.tsx';
import {
  useAllAdditionalFieldsTypes,
  useAllAdditionalFieldsTypesValues,
  useAllExternalRequestors,
} from '../../../hooks/api/useInitializeTickets.tsx';
import { getExternalRequestorByName } from '../../../utils/helpers/tickets/externalRequestorUtils.ts';

interface BulkAddExternalRequestersModalProps {
  open: boolean;
  handleClose: () => void;
  defaultAdditionalFieldType: AdditionalFieldType;
}

export default function BulkAddExternalRequestersModal({
  open,
  handleClose,
  defaultAdditionalFieldType,
}: BulkAddExternalRequestersModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>(
    defaultAdditionalFieldType.name,
  );
  const [selectedFilterType, setSelectedFilterType] =
    useState<AdditionalFieldTypeEnum>(defaultAdditionalFieldType.type);
  const [selectedExternalRequestersInput, setSelectedExternalRequestersInput] =
    useState<string[]>([]);
  const [selectedExternalRequesters, setSelectedExternalRequesters] = useState<
    ExternalRequestor[]
  >([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [bulkAddExternalRequestorRequest, setBulkAddExternalRequestorRequest] =
    useState<BulkAddExternalRequestorRequest | undefined>();

  const { externalRequestors } = useAllExternalRequestors();
  const { additionalFieldTypes } = useAllAdditionalFieldsTypes();
  const { additionalFieldsTypesWithValues } =
    useAllAdditionalFieldsTypesValues();
  const defaultForm: BulkAddExternalRequestorRequest = {
    additionalFieldTypeName: defaultAdditionalFieldType.name,
    fieldValues: [],
    externalRequestors: [],
  };

  const {
    register,
    control,
    setValue,

    getValues,
    setError,
    clearErrors,
    formState: { errors },
    reset,
  } = useForm<BulkAddExternalRequestorRequest>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    criteriaMode: 'all',
    resolver: yupResolver(bulkAddExternalRequestorSchema),
    defaultValues: defaultForm,
  });

  const handleExternalRequestersChange = (
    event: SelectChangeEvent<string[]>,
  ) => {
    const {
      target: { value },
    } = event;
    setSelectedExternalRequestersInput(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleFieldValueChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setInputValue(value);
  };

  const handleClear = () => {
    setSelectedExternalRequestersInput([]);
    setInputValue('');
    setSelectedFilter(defaultAdditionalFieldType.name);
    setSelectedFilterType(defaultAdditionalFieldType.type);
    reset(defaultForm);
  };

  const handleFilterChange = (e: SelectChangeEvent<string>) => {
    setSelectedFilter(e.target.value);
    const filterType = additionalFieldTypes.find(
      a => a.name === e.target.value,
    )?.type;
    setSelectedFilterType(filterType as AdditionalFieldTypeEnum);
    setInputValue('');
    setValue('fieldValues', []);
  };

  const onSubmit = (data: BulkAddExternalRequestorRequest) => {
    const tempSelectedExternalRequestors = convertExternalRequesterInputToArray(
      selectedExternalRequestersInput,
      externalRequestors,
    );
    const delimiter =
      inputValue && inputValue.length > 0 ? detectDelimiter(inputValue) : ',';
    if (!delimiter) {
      setError('fieldValues', {
        type: 'manual',
        message: 'Multiple delimiters found',
      });
      return;
    } else {
      clearErrors('fieldValues');
      const valuesArray = inputValue
        .split(delimiter)
        .map(item => item.trim())
        .filter(item => item.trim() !== '');
      const uniqueSortedArray = [...new Set(valuesArray)].sort();
      data.additionalFieldTypeName = selectedFilter;
      if (data.additionalFieldTypeName === 'ARTGID') {
        if (containsCharacters(uniqueSortedArray)) {
          setError('fieldValues', {
            type: 'manual',
            message: 'Invalid ArtgIds: Contains characters',
          });
          return;
        }
      }

      data.externalRequestors = tempSelectedExternalRequestors.map(e => e.name);
      data.fieldValues = uniqueSortedArray;

      setSelectedExternalRequesters(tempSelectedExternalRequestors);
      setBulkAddExternalRequestorRequest(data);

      setShowSummaryDialog(true);
    }
  };

  return (
    <BaseModal
      open={open}
      handleClose={handleClose}
      sx={{ width: '50%', maxHeight: 600, minHeight: 350 }}
    >
      <BaseModalHeader title="Bulk Add External Requesters" />
      <BaseModalBody>
        <Box width="100%" padding={3}>
          {showSummaryDialog && (
            <BulkAddSummaryModal
              open={showSummaryDialog}
              handleClose={() => setShowSummaryDialog(!showSummaryDialog)}
              handleClear={handleClear}
              bulkAddExternalRequestorRequest={
                bulkAddExternalRequestorRequest as BulkAddExternalRequestorRequest
              }
              selectedExternalRequesters={selectedExternalRequesters}
            />
          )}
          <form
            onSubmit={event => {
              event.preventDefault();
              const data = getValues();
              onSubmit(data);
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs>
                <Grid>
                  <FormControl fullWidth>
                    <FieldLabelRequired>Search Filter</FieldLabelRequired>
                    <Select
                      value={selectedFilter || ''}
                      onChange={handleFilterChange}
                      sx={{ width: '100%' }}
                    >
                      {additionalFieldTypes
                        .filter(a => a.type !== AdditionalFieldTypeEnum.DATE)
                        .map((filter, index) => (
                          <MenuItem key={index} value={filter.name}>
                            {filter.description}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid sx={{ paddingTop: 3 }}>
                  <FormControl fullWidth>
                    <FieldLabelRequired>External Requesters</FieldLabelRequired>
                    <Select
                      id="bulk-external-requestors-select"
                      multiple
                      value={selectedExternalRequestersInput}
                      onChange={handleExternalRequestersChange}
                      label="Filter"
                      MenuProps={{
                        PaperProps: {
                          sx: { maxHeight: 400 },
                          id: 'ticket-labels-select-container',
                        },
                      }}
                      sx={{ width: '100%' }}
                      input={<Select />}
                      renderValue={selected => (
                        <Stack gap={1} direction="row" flexWrap="wrap">
                          {selected.map(value => {
                            const requester = getExternalRequestorByName(
                              value,
                              externalRequestors,
                            );
                            return (
                              <ExternalRequestorChip
                                externalRequestor={requester}
                                externalRequestorList={externalRequestors}
                                key={`${requester?.id}`}
                              />
                            );
                          })}
                        </Stack>
                      )}
                    >
                      {externalRequestors.map(externalRequestorType => (
                        <MenuItem
                          key={externalRequestorType.id}
                          value={externalRequestorType.name}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            width="100%"
                            alignItems="center"
                          >
                            <Chip
                              label={externalRequestorType.name}
                              size="small"
                              sx={{
                                color: 'black',
                                backgroundColor:
                                  externalRequestorType.displayColor,
                              }}
                            />
                            <Checkbox
                              checked={getExternalRequestorIsChecked(
                                externalRequestorType,
                                selectedExternalRequestersInput,
                              )}
                            />
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid item xs>
                <FormControl fullWidth>
                  <FieldLabelRequired>Filter value</FieldLabelRequired>
                  {selectedFilterType === AdditionalFieldTypeEnum.LIST ? (
                    <Controller
                      name="fieldValues"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          multiple
                          label="Filter Values"
                          MenuProps={{
                            PaperProps: {
                              sx: { maxHeight: 400 },
                              id: 'ticket-labels-select-container',
                            },
                          }}
                          sx={{ width: '100%' }}
                          input={<Select />}
                          renderValue={selected =>
                            selected ? selected.join(', ') : selected
                          }
                          onChange={event => {
                            field.onChange(event.target.value);
                            if (event.target.value) {
                              setInputValue([event.target.value].join(','));
                            }
                          }}
                        >
                          {additionalFieldsTypesWithValues
                            .filter(at => at.typeName === selectedFilter)
                            .flatMap(at => at.values)
                            .map(option => (
                              <MenuItem key={option.id} value={option.valueOf}>
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  width="100%"
                                  alignItems="center"
                                >
                                  <Chip
                                    label={option.valueOf}
                                    size="small"
                                    sx={{
                                      color: 'black',
                                    }}
                                  />
                                  <Checkbox
                                    checked={field.value.includes(
                                      option.valueOf,
                                    )}
                                    onChange={event => {
                                      if (event.target.checked) {
                                        field.onChange([
                                          ...field.value,
                                          option.valueOf,
                                        ]);
                                      } else {
                                        field.onChange(
                                          field.value.filter(
                                            (value: string) =>
                                              value !== option.valueOf,
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                </Stack>
                              </MenuItem>
                            ))}
                        </Select>
                      )}
                    />
                  ) : (
                    <TextField
                      {...register('fieldValues')}
                      onChange={handleFieldValueChange}
                      value={inputValue}
                      multiline
                      rows={15}
                      fullWidth
                      // label="Filter value"
                      variant="outlined"
                      InputProps={{
                        style: { fontSize: '16px' },
                      }}
                      sx={{
                        '& .MuiInputBase-root': {
                          fontSize: '16px',
                        },
                      }}
                      error={!!errors.fieldValues}
                      helperText={errors.fieldValues?.message || ' '}
                    />
                  )}
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ paddingTop: 2 }}>
              <Stack spacing={1} direction="row" justifyContent="end">
                <Button
                  color="success"
                  size="small"
                  variant="contained"
                  type="submit"
                  disabled={
                    !readyForUpdate(
                      selectedExternalRequestersInput,
                      selectedFilter,
                      inputValue,
                    )
                  }
                >
                  Update Tickets
                </Button>
                <Button
                  color="primary"
                  size="small"
                  variant="contained"
                  disabled={
                    !(
                      inputValue.length > 0 ||
                      selectedExternalRequestersInput.length > 0
                    )
                  }
                  onClick={() => handleClear()}
                >
                  Clear
                </Button>
                <Button
                  color="error"
                  size="small"
                  variant="contained"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </Stack>
            </Box>
          </form>
        </Box>
      </BaseModalBody>
    </BaseModal>
  );
}

interface BulkAddSummaryModalProps {
  open: boolean;
  handleClose: () => void;
  handleClear: () => void;
  bulkAddExternalRequestorRequest: BulkAddExternalRequestorRequest;
  selectedExternalRequesters: ExternalRequestor[];
}

function BulkAddSummaryModal({
  open,
  handleClose,
  handleClear,
  bulkAddExternalRequestorRequest,
  selectedExternalRequesters,
}: BulkAddSummaryModalProps) {
  // const [showResultWarning, setShowResultWarning] = useState(false);

  const { mergeTickets } = useTicketStore();
  const mutation = useBulkCreateExternalRequestors();
  const { data, isPending } = mutation;

  const previousDataRef = useRef<Ticket[] | undefined>();

  if (data && data.updatedTickets !== previousDataRef.current) {
    mergeTickets(data.updatedTickets);
    previousDataRef.current = data.updatedTickets;
  }

  const handleSubmit = () => {
    mutation.mutate(bulkAddExternalRequestorRequest);
  };

  if (data) {
    return (
      <BulkAddWarningModal
        open={data ? true : false}
        handleClose={handleClose}
        handleClear={handleClear}
        bulkAddRequestorResponse={data}
      />
    );
  } else {
    return (
      <BaseModal open={open} handleClose={handleClose} sx={{ width: '30%' }}>
        <BaseModalHeader title="Tickets with the following values will have these external requesters added to them" />
        <BaseModalBody>
          {/*{isPending && (<Loading></Loading>)}*/}
          <Box width="100%" padding={3}>
            <Grid container spacing={2}>
              <Grid item xs>
                <Paper
                  sx={{
                    maxHeight: 300,
                    overflow: 'auto',
                    width: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <ListSubheader>
                    {'EXternal Requesters'}
                    <Typography
                      component="span"
                      sx={{ color: 'red', marginLeft: 1 }}
                    >
                      ({selectedExternalRequesters.length})
                    </Typography>
                  </ListSubheader>
                  <List
                    sx={{
                      maxHeight: 'calc(100% - 48px)',
                      overflowY: 'auto',
                    }}
                  >
                    {selectedExternalRequesters.map((option, index) => (
                      <ListItem key={index}>
                        <ExternalRequestorChip
                          externalRequestor={option}
                          externalRequestorList={selectedExternalRequesters}
                          key={`${option?.id}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
              <Grid item xs>
                <ScrollableList
                  options={bulkAddExternalRequestorRequest.fieldValues}
                  title="Field Values"
                />
              </Grid>
            </Grid>
          </Box>
        </BaseModalBody>
        <BaseModalFooter
          startChildren={<></>}
          endChildren={
            <Stack sx={{ gap: 1, flexDirection: 'row' }}>
              <Button
                variant="contained"
                color="success"
                disabled={isPending}
                onClick={handleSubmit}
                startIcon={isPending && <CircularProgress size={24} />}
              >
                {isPending ? 'Processing...' : 'Proceed'}
              </Button>

              <Button
                color="primary"
                size="small"
                variant="contained"
                onClick={handleClose}
              >
                Return to Screen
              </Button>
            </Stack>
          }
        />
      </BaseModal>
    );
  }
}

interface BulkAddWarningModalProps {
  open: boolean;
  handleClose: () => void;
  handleClear: () => void;
  bulkAddRequestorResponse: BulkAddExternalRequestorResponse;
  disabled?: boolean;
}

function BulkAddWarningModal({
  open,
  handleClose,
  handleClear,
  bulkAddRequestorResponse,
  disabled,
}: BulkAddWarningModalProps) {
  const theme = useTheme();
  return (
    <BaseModal open={open} handleClose={handleClose} sx={{ minWidth: '30%' }}>
      <div style={{ backgroundColor: theme.palette.warning.light }}>
        <BaseModalHeader title="Warning!" />
      </div>
      <BaseModalBody>
        <Box width="100%" padding={3}>
          <Grid container spacing={2}>
            <Grid item xs>
              <ScrollableList
                options={bulkAddRequestorResponse.createdTickets.map(
                  t => t.title,
                )}
                title="Created Tickets"
              />
            </Grid>
            <Grid item xs>
              <ScrollableList
                options={bulkAddRequestorResponse.updatedTickets.map(
                  t => t.title,
                )}
                title="Updated Tickets"
              />
            </Grid>
            <Grid item xs>
              <ScrollableList
                options={bulkAddRequestorResponse.skippedAdditionalFieldValues.map(
                  s => s,
                )}
                title="Skipped Values"
              />
            </Grid>
          </Grid>
        </Box>
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Stack direction="row" spacing={1}>
            <Button
              color="primary"
              size="small"
              variant="contained"
              onClick={() => {
                handleClose();
                handleClear();
              }}
              disabled={disabled}
            >
              Okay
            </Button>
          </Stack>
        }
      />
    </BaseModal>
  );
}

interface ScrollableListProps {
  options: string[];
  title: string;
}

function ScrollableList({ options, title }: ScrollableListProps) {
  return (
    <Paper
      sx={{
        maxHeight: 300,
        overflow: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <ListSubheader>
        {title}
        <Typography component="span" sx={{ color: 'red', marginLeft: 1 }}>
          ({options.length})
        </Typography>
      </ListSubheader>
      <List
        sx={{
          maxHeight: 'calc(100% - 48px)',
          overflowY: 'auto',
        }}
      >
        {options.map((option, index) => (
          <ListItem key={index}>
            <ListItemText primary={option} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

const getExternalRequestorIsChecked = (
  externalRequestorType: ExternalRequestor,
  selectedExternalRequestersInput: string[],
): boolean => {
  return selectedExternalRequestersInput.includes(externalRequestorType.name);
};

const convertExternalRequesterInputToArray = (
  selectedExternalRequestersInput: string[],
  externalRequestors: ExternalRequestor[],
): ExternalRequestor[] => {
  return selectedExternalRequestersInput.map(e =>
    getExternalRequestorByName(e, externalRequestors),
  ) as ExternalRequestor[];
};

const readyForUpdate = (
  selectedExternalRequestersInput: string[],
  selectedFilter: string,
  inputValue: string,
) => {
  return (
    selectedFilter.trim().length > 0 &&
    selectedExternalRequestersInput.length > 0 &&
    inputValue.trim().length > 0
  );
};
