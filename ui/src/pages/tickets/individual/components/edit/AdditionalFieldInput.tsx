import { DesktopDatePicker } from '@mui/x-date-pickers';
import {
  AdditionalFieldType,
  AdditionalFieldTypeEnum,
  AdditionalFieldTypeOfListType,
  AdditionalFieldValue,
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
import { ChangeEvent, useEffect, useState } from 'react';
import { Dayjs } from 'dayjs';
import useTicketStore from '../../../../../stores/TicketStore';
import {
  useDeleteAdditionalFields,
  useUpdateAdditionalFields,
} from '../../../../../hooks/api/tickets/useUpdateTicket';
import ConfirmationModal from '../../../../../themes/overrides/ConfirmationModal.tsx';

interface AdditionalFieldInputProps {
  ticket?: Ticket;
  type: AdditionalFieldType;
}
export default function AdditionalFieldInput({
  ticket,
  type,
}: AdditionalFieldInputProps) {
  const [value, setValue] = useState<AdditionalFieldValue | undefined>();
  //   const value = mapAdditionalFieldTypeToValue(
  //     type,
  //     ticket?.['ticket-additional-fields'],
  //   );
  const [updatedValue, setUpdatedValue] = useState(
    value ? Object.assign({}, value) : undefined,
  );
  const [updated, setUpdated] = useState(false);
  const [updatedValueString, setUpdatedValueString] = useState<
    string | undefined
  >('');
  const { mergeTickets } = useTicketStore();
  const [disabled, setDisabled] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const mutation = useUpdateAdditionalFields();
  const deleteMutation = useDeleteAdditionalFields();

  const { data } = mutation;
  const { status } = deleteMutation;

  useEffect(() => {
    const tempValue = mapAdditionalFieldTypeToValue(
      type,
      ticket?.['ticket-additional-fields'],
    );
    setValue(tempValue);
    setUpdatedValue(tempValue);
  }, [ticket, type]);

  useEffect(() => {
    // update
    if (data && ticket !== undefined) {
      const withoutRemoved = removeValueByAdditionalField(
        data.additionalFieldType,
      );
      withoutRemoved?.push(data);
      ticket['ticket-additional-fields'] = withoutRemoved;
      mergeTickets(ticket);
      setDisabled(false);
      setUpdated(false);
    }
  }, [data]);

  useEffect(() => {
    // delete
    if (status === 'success' && ticket !== undefined) {
      const withoutRemoved = removeValueByAdditionalField(type);
      ticket['ticket-additional-fields'] = withoutRemoved;
      setDisabled(false);
      mergeTickets(ticket);
      setDeleteModalOpen(false);
    }
  }, [status]);

  const removeValueByAdditionalField = (
    additionalFieldType: AdditionalFieldType,
  ) => {
    const withoutRemoved = ticket?.['ticket-additional-fields']?.filter(
      additionalField => {
        return (
          additionalField.additionalFieldType.id !== additionalFieldType.id
        );
      },
    );
    return withoutRemoved;
  };

  const handleReset = () => {
    setUpdatedValue(Object.assign({}, value));
    setUpdated(false);
  };

  const handleSubmit = () => {
    setDisabled(true);
    mutation.mutate({
      ticket: ticket,
      additionalFieldType: type,
      valueOf: updatedValueString,
    });
  };

  const handleListSubmit = (val: string) => {
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
      <Stack direction="row">
        {type.type === AdditionalFieldTypeEnum.DATE && (
          <AdditionalFieldDateInput
            value={updatedValue}
            type={type}
            setSubmittable={setUpdated}
            setUpdatedValueString={setUpdatedValueString}
            disabled={disabled}
          />
        )}
        {type.type === AdditionalFieldTypeEnum.NUMBER && (
          <AdditionalFieldNumberInput
            value={updatedValue}
            type={type}
            setSubmittable={setUpdated}
            setUpdatedValueString={setUpdatedValueString}
            disabled={disabled}
          />
        )}
        {type.type === AdditionalFieldTypeEnum.LIST && (
          <AdditionalFieldListInput
            value={value}
            type={type}
            setSubmittable={setUpdated}
            setUpdatedValueString={setUpdatedValueString}
            handleListSubmit={handleListSubmit}
            disabled={disabled}
            handleDelete={handleDelete}
          />
        )}

        {type.type !== AdditionalFieldTypeEnum.LIST && (
          <>
            <IconButton
              size="small"
              aria-label="save"
              color="success"
              disabled={!updated}
              sx={{ mt: 0.25 }}
              onClick={handleSubmit}
            >
              <Done />
            </IconButton>
            <IconButton
              size="small"
              aria-label="reset"
              color="error"
              disabled={!updated}
              sx={{ mt: 0.25 }}
              onClick={handleReset}
            >
              <RestartAlt />
            </IconButton>

            <IconButton
              size="small"
              aria-label="reset"
              color="error"
              sx={{ mt: 0.25 }}
              onClick={() => {
                setDeleteModalOpen(true);
              }}
            >
              <Delete />
            </IconButton>
          </>
        )}
      </Stack>
    </>
  );
}

interface AdditionalFieldDateInputProps {
  value?: AdditionalFieldValue;
  type: AdditionalFieldType;
  disabled: boolean;
  setSubmittable: (submittable: boolean) => void;
  setUpdatedValueString: (value: string | undefined) => void;
}
interface AdditionalFieldTypeInputProps {
  value?: AdditionalFieldValue;
  type: AdditionalFieldType;
  disabled: boolean;
  setSubmittable: (submittable: boolean) => void;
  setUpdatedValueString: (value: string | undefined) => void;
}

export function AdditionalFieldDateInput({
  value,
  type,
  disabled,
  setSubmittable,
  setUpdatedValueString,
}: AdditionalFieldDateInputProps) {
  const [dateTime, setDateTime] = useState<Dayjs | null>(null);

  useEffect(() => {
    const newDateTime = dayjs(value?.valueOf);
    if (newDateTime.isValid() && value?.valueOf !== undefined) {
      setDateTime(newDateTime);
    } else {
      setDateTime(null);
    }
  }, [value]);

  const handleDateChange = (newValue: Dayjs | null) => {
    setDateTime(newValue);
    const typeValue = newValue as Dayjs;
    if (typeValue.isValid()) {
      setUpdatedValueString(newValue?.toISOString());
      setSubmittable(true);
    }
    const oldValue = dayjs(value?.valueOf);
    if (oldValue.isSame(newValue)) {
      setSubmittable(false);
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
            label={type.name}
            onChange={newValue => {
              handleDateChange(newValue);
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
              setDateTime(dayjs(newValue));
            }}
          />
        )}
      </Stack>
    </>
  );
}

interface AdditionalFieldTypeListInputProps {
  value?: AdditionalFieldValue;
  type: AdditionalFieldType;
  disabled: boolean;
  setSubmittable: (submittable: boolean) => void;
  setUpdatedValueString: (value: string | undefined) => void;
  handleListSubmit: (value: string) => void;
  handleDelete: () => void;
}

export function AdditionalFieldListInput({
  value,
  type,
  setUpdatedValueString,
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
    setUpdatedValueString(event.target.value);
    handleListSubmit(event.target.value);
  };

  return (
    <>
      <FormControl fullWidth>
        <InputLabel id={`${type.name}`}>{type.name}</InputLabel>
        <Select
          labelId={`${type.name}`}
          value={value?.valueOf ? value?.valueOf : ''}
          onChange={handleChange}
          sx={{ width: '100%' }}
          disabled={disabled}
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
  value,
  type,
  disabled,
  setSubmittable,
  setUpdatedValueString,
}: AdditionalFieldTypeInputProps) {
  const [localValue, setLocalValue] = useState(value?.valueOf);

  const handleUpdate = (event: ChangeEvent<HTMLInputElement>) => {
    setLocalValue(event.target.value);
    setUpdatedValueString(event.target.value);
    if (value?.valueOf === event.target.value) {
      setSubmittable(false);
    } else {
      setSubmittable(true);
    }
  };

  useEffect(() => {
    setLocalValue(value?.valueOf);
  }, [value]);

  return (
    <TextField
      disabled={disabled}
      label={type.name}
      type="number"
      value={localValue ? localValue : ''}
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
