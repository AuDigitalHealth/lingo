import { DateField } from '@mui/x-date-pickers';
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
import { Done, RestartAlt } from '@mui/icons-material';
import { ChangeEvent, useEffect, useState } from 'react';
import { Dayjs } from 'dayjs';
import useTicketStore from '../../../../../stores/TicketStore';
import { useUpdateAdditionalFields } from '../../../../../hooks/api/tickets/useUpdateTicket';

interface AdditionalFieldInputProps {
  ticket?: Ticket;
  type: AdditionalFieldType;
}
export default function AdditionalFieldInput({
  ticket,
  type,
}: AdditionalFieldInputProps) {
  const value = mapAdditionalFieldTypeToValue(
    type,
    ticket?.['ticket-additional-fields'],
  );
  const [updatedValue, setUpdatedValue] = useState(
    value ? Object.assign({}, value) : undefined,
  );
  const [updated, setUpdated] = useState(false);
  const [updatedValueString, setUpdatedValueString] = useState<
    string | undefined
  >('');
  const { mergeTickets } = useTicketStore();
  const [disabled, setDisabled] = useState(false);
  const mutation = useUpdateAdditionalFields();

  const { data } = mutation;

  useEffect(() => {
    if (data && ticket !== undefined) {
      const withoutRemoved = ticket?.['ticket-additional-fields']?.filter(
        additionalField => {
          return (
            additionalField.additionalFieldType.id !==
            data.additionalFieldType.id
          );
        },
      );
      withoutRemoved?.push(data);
      ticket['ticket-additional-fields'] = withoutRemoved;
      mergeTickets(ticket);
      setDisabled(false);
      setUpdated(false);
    }
  }, [data]);

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

  const handleListSubmit = (value: string) => {
    setDisabled(true);
    mutation.mutate({
      ticket: ticket,
      additionalFieldType: type,
      valueOf: value,
    });
  };

  return (
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
        />
      )}
      {updated && (
        <>
          <IconButton
            size="small"
            aria-label="save"
            color="success"
            sx={{ mt: 0.25 }}
            onClick={handleSubmit}
          >
            <Done />
          </IconButton>
          <IconButton
            size="small"
            aria-label="reset"
            color="error"
            sx={{ mt: 0.25 }}
            onClick={handleReset}
          >
            <RestartAlt />
          </IconButton>
        </>
      )}
    </Stack>
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
    console.log('come here');
    const newDateTime = dayjs(value?.valueOf);
    if (newDateTime.isValid() && value?.valueOf !== undefined) {
      setDateTime(newDateTime);
    } else {
      console.log('its null');
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
          <DateField
            disabled={disabled}
            value={dateTime}
            format="DD/MM/YYYY"
            label={type.name}
            onChange={newValue => {
              handleDateChange(newValue);
            }}
          />
        ) : (
          <DateField
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
}

export function AdditionalFieldListInput({
  value,
  type,
  setUpdatedValueString,
  disabled,
  handleListSubmit,
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
          {thisTypesValues?.values.map(value => (
            <MenuItem
              key={value.valueOf}
              value={value.valueOf}
              onKeyDown={e => e.stopPropagation()}
            >
              {value.valueOf}
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
      value={localValue}
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
