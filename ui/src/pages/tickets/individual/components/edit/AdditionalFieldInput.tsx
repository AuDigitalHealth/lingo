import { DateValidationError, DesktopDatePicker } from '@mui/x-date-pickers';
import {
  AdditionalFieldType,
  AdditionalFieldTypeEnum,
  AdditionalFieldTypeOfListType,
  AdditionalFieldValue,
  AdditionalFieldValueUnversioned,
  Ticket,
} from '../../../../../types/tickets/ticket';
import dayjs from 'dayjs';
import {
  InputLabel,
  TextField,
  Stack,
  IconButton,
  Select,
  SelectChangeEvent,
  MenuItem,
  FormControl,
} from '@mui/material';
import { Delete, Done, RestartAlt } from '@mui/icons-material';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Dayjs } from 'dayjs';
import useTicketStore from '../../../../../stores/TicketStore';
import {
  useDeleteAdditionalFields,
  useUpdateAdditionalFields,
} from '../../../../../hooks/api/tickets/useUpdateTicket';
import ConfirmationModal from '../../../../../themes/overrides/ConfirmationModal.tsx';
import { useQueryClient } from '@tanstack/react-query';
import { getTicketByIdOptions } from '../../../../../hooks/api/tickets/useTicketById.tsx';

interface AdditionalFieldInputProps {
  ticket?: Ticket;
  type: AdditionalFieldType;
  canEdit: boolean;
}
export default function AdditionalFieldInput({
  ticket,
  type,
  canEdit,
}: AdditionalFieldInputProps) {
  const queryClient = useQueryClient();

  const initialValue = useMemo(() => {
    const tempValue = mapAdditionalFieldTypeToValue(
      type,
      ticket?.['ticket-additional-fields'],
    );
    return tempValue
      ? tempValue
      : Object.assign({}, { additionalFieldType: type, valueOf: '' });
  }, [type, ticket]);

  const [value, setValue] = useState<
    AdditionalFieldValueUnversioned | undefined
  >(initialValue);

  const [updatedValue, setUpdatedValue] = useState(
    value ? Object.assign({}, value) : undefined,
  );

  useEffect(() => {
    setValue(initialValue);
    setUpdatedValue(initialValue);
  }, [initialValue]);

  const submittable = useMemo(() => {
    return initialValue?.valueOf !== updatedValue?.valueOf;
  }, [updatedValue, initialValue]);

  const [disabled, setDisabled] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const mutation = useUpdateAdditionalFields();
  const deleteMutation = useDeleteAdditionalFields();

  const { data, status } = mutation;
  const { status: deleteMutationStatus } = deleteMutation;

  useEffect(() => {
    // update
    if (status === 'success' && data) {
      void queryClient.invalidateQueries({
        queryKey: getTicketByIdOptions(ticket?.id.toString()).queryKey,
      });
      setDisabled(false);
    }
  }, [data, status, queryClient]);

  useEffect(() => {
    // delete
    if (deleteMutationStatus === 'success') {
      setDisabled(false);
      void queryClient.invalidateQueries({
        queryKey: getTicketByIdOptions(ticket?.id.toString()).queryKey,
      });
      setDeleteModalOpen(false);
    }
  }, [deleteMutationStatus, setDisabled, setDeleteModalOpen, queryClient]);

  const handleReset = () => {
    setUpdatedValue(Object.assign({}, value));
  };

  const handleSubmit = () => {
    setDisabled(true);
    mutation.mutate({
      ticket: ticket,
      additionalFieldType: type,
      valueOf: updatedValue?.valueOf,
    });
  };

  const handleListSubmit = (val: string): void => {
    setDisabled(true);

    mutation.mutate({
      ticket: ticket,
      additionalFieldType: type,
      valueOf: val,
    });
  };

  const handleDelete = () => {
    setDisabled(true);
    deleteMutation.mutate({
      ticket: ticket,
      additionalFieldType: type,
    });
  };

  return (
    <>
      <ConfirmationModal
        open={deleteModalOpen}
        content={`Confirm delete for ${type.name}?`}
        handleClose={() => {
          setDeleteModalOpen(false);
        }}
        title={'Confirm Delete'}
        disabled={disabled}
        action={'Delete'}
        handleAction={handleDelete}
      />
      {type.display === true && (
        <Stack direction="row">
          {type.type === AdditionalFieldTypeEnum.DATE && (
            <AdditionalFieldDateInput
              id={`ticket-af-input-${type.name}`}
              value={updatedValue}
              type={type}
              setUpdatedValue={setUpdatedValue}
              disabled={disabled || !canEdit}
            />
          )}
          {type.type === AdditionalFieldTypeEnum.NUMBER && (
            <AdditionalFieldNumberInput
              id={`ticket-af-input-${type.name}`}
              value={updatedValue}
              type={type}
              setUpdatedValue={setUpdatedValue}
              disabled={disabled || !canEdit}
            />
          )}
          {type.type === AdditionalFieldTypeEnum.LIST && (
            <AdditionalFieldListInput
              id={`ticket-af-input-${type.name}`}
              value={value}
              type={type}
              handleListSubmit={handleListSubmit}
              disabled={disabled || !canEdit}
              handleDelete={handleDelete}
            />
          )}

          {type.type !== AdditionalFieldTypeEnum.LIST && (
            <>
              <IconButton
                id={`ticket-af-input-${type.name}-save`}
                size="small"
                aria-label="save"
                color="success"
                disabled={!submittable}
                sx={{ mt: 0.25 }}
                onClick={handleSubmit}
              >
                <Done />
              </IconButton>
              <IconButton
                id={`ticket-af-input-${type.name}-reset`}
                size="small"
                aria-label="reset"
                color="error"
                disabled={!submittable}
                sx={{ mt: 0.25 }}
                onClick={handleReset}
              >
                <RestartAlt />
              </IconButton>

              <IconButton
                id={`ticket-af-input-${type.name}-delete`}
                size="small"
                aria-label="delete"
                color="error"
                sx={{ mt: 0.25 }}
                onClick={() => {
                  setDeleteModalOpen(true);
                }}
                disabled={!canEdit || !(initialValue !== undefined)}
              >
                <Delete />
              </IconButton>
            </>
          )}
        </Stack>
      )}
    </>
  );
}

interface AdditionalFieldDateInputProps {
  id: string | undefined;
  value?: AdditionalFieldValueUnversioned;
  type: AdditionalFieldType;
  disabled: boolean;
  setUpdatedValue: (value: AdditionalFieldValueUnversioned | undefined) => void;
}
interface AdditionalFieldTypeInputProps {
  id: string | undefined;
  value?: AdditionalFieldValueUnversioned;
  type: AdditionalFieldType;
  disabled: boolean;
  setUpdatedValue: (value: AdditionalFieldValueUnversioned | undefined) => void;
}

export function AdditionalFieldDateInput({
  id,
  value,
  type,
  disabled,
  setUpdatedValue,
}: AdditionalFieldDateInputProps) {
  const [error, setError] = useState<DateValidationError | null>(null);

  const errorMessage = useMemo(() => {
    switch (error) {
      case 'maxDate': {
        return 'Date is after the maximum reasonable date.';
      }
      case 'minDate': {
        return 'Date is before the minimum reasonable date.';
      }

      case 'invalidDate': {
        return 'Your date is not valid';
      }

      default: {
        return '';
      }
    }
  }, [error]);

  const dateTimeJs = useMemo(() => {
    const newDateTime = dayjs(value?.valueOf);
    if (newDateTime.isValid() && value?.valueOf !== undefined) {
      return newDateTime;
    } else {
      return null;
    }
  }, [value]);

  const [dateTime, setDateTime] = useState<Dayjs | null>(dateTimeJs);

  useEffect(() => {
    setDateTime(dateTimeJs);
  }, [dateTimeJs]);

  const handleDateChange = (newValue: Dayjs | null) => {
    const typeValue = newValue as Dayjs;
    if (typeValue.isValid()) {
      setUpdatedValue(
        value
          ? Object.assign({}, value, { valueOf: typeValue.toISOString() })
          : { additionalFieldType: type, valueOf: typeValue.toISOString() },
      );
    }
  };

  return (
    <>
      <Stack direction="column">
        {dateTime?.isValid() ? (
          <DesktopDatePicker
            disabled={disabled}
            value={dateTime}
            format="DD/MM/YYYY"
            onError={newError => setError(newError)}
            label={type.name}
            onChange={newValue => {
              handleDateChange(newValue);
            }}
            slotProps={{
              textField: {
                helperText: errorMessage,
                inputProps: {
                  id: id,
                },
              },
            }}
          />
        ) : (
          <DesktopDatePicker
            disabled={disabled}
            format="DD/MM/YYYY"
            label={type.name}
            value={dateTime}
            onChange={(newValue: Dayjs | null) => {
              handleDateChange(newValue);
            }}
            onError={newError => setError(newError)}
            slotProps={{
              textField: {
                helperText: errorMessage,
                inputProps: {
                  id: id,
                },
              },
            }}
          />
        )}
      </Stack>
    </>
  );
}

interface AdditionalFieldTypeListInputProps {
  id: string | undefined;
  value?: AdditionalFieldValueUnversioned;
  type: AdditionalFieldType;
  disabled: boolean;
  handleListSubmit: (value: string) => void;
  handleDelete: () => void;
}

export function AdditionalFieldListInput({
  id,
  value,
  type,
  disabled,
  handleListSubmit,
  handleDelete,
}: AdditionalFieldTypeListInputProps) {
  const { additionalFieldTypesOfListType } = useTicketStore();
  const thisTypesValues = getAdditionalFieldListTypeValues(
    type,
    additionalFieldTypesOfListType,
  );

  const handleChange = (event: SelectChangeEvent) => {
    handleListSubmit(event.target.value);
  };

  return (
    <>
      <FormControl fullWidth>
        <InputLabel id={`${type.name}`}>{type.name}</InputLabel>
        <Select
          id={id}
          labelId={`${type.name}`}
          value={value?.valueOf ? value?.valueOf : ''}
          onChange={handleChange}
          sx={{ width: '100%' }}
          disabled={disabled}
          MenuProps={{
            PaperProps: {
              id: `${id}-container`,
            },
          }}
        >
          {thisTypesValues?.values.map(val => (
            <MenuItem
              key={val.valueOf}
              value={val.valueOf}
              onKeyDown={e => e.stopPropagation()}
              onClick={
                value?.valueOf === val.valueOf ? handleDelete : () => null
              }
            >
              {val.valueOf}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
}

export function AdditionalFieldNumberInput({
  id,
  value,
  type,
  disabled,
  setUpdatedValue,
}: AdditionalFieldTypeInputProps) {
  const localVal = useMemo(() => {
    return value?.valueOf;
  }, [value]);

  const handleUpdate = (event: ChangeEvent<HTMLInputElement>) => {
    setUpdatedValue(
      value
        ? Object.assign({}, value, { valueOf: event.target.value })
        : { additionalFieldType: type, valueOf: event.target.value },
    );
  };

  return (
    <TextField
      id={id}
      disabled={disabled}
      label={type.name}
      type="number"
      value={localVal ? localVal : ''}
      onChange={handleUpdate}
    />
  );
}

function mapAdditionalFieldTypeToValue(
  type: AdditionalFieldType,
  additionalFieldsValues: AdditionalFieldValue[] | undefined,
) {
  if (additionalFieldsValues === undefined) return undefined;
  return additionalFieldsValues.find(afv => {
    return afv.additionalFieldType.id === type.id;
  });
}

function getAdditionalFieldListTypeValues(
  type: AdditionalFieldType,
  additionalFieldTypesOfListType: AdditionalFieldTypeOfListType[],
) {
  return additionalFieldTypesOfListType.find(typeList => {
    return typeList.typeId === type.id;
  });
}
