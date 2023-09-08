import { useState } from 'react';

import { MenuItem } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../components/styled/StyledSelect.tsx';
import {
  AdditionalFieldType,
  AdditionalFieldTypeValue,
} from '../../../types/tickets/ticket.ts';
import useTicketStore from '../../../stores/TicketStore.ts';
import TicketsService from '../../../api/TicketsService.ts';

interface CustomAdditionalFieldsSelectionProps {
  id?: string;
  additionalFieldTypeValue?: AdditionalFieldTypeValue;
  additionalFieldType: AdditionalFieldType;
}

export default function CustomAdditionalFieldsSelection({
  id,
  additionalFieldTypeValue,
  additionalFieldType,
}: CustomAdditionalFieldsSelectionProps) {
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById, mergeTickets } = useTicketStore();

  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newAdditionalFieldTypeValue = getAdditionalFieldTypeValue(
      event.target.value,
    );

    const ticket = getTicketById(Number(id));
    if (ticket !== undefined && newAdditionalFieldTypeValue !== undefined) {
      TicketsService.updateAdditionalFieldTypeValue(
        ticket.id,
        newAdditionalFieldTypeValue.id,
      )
        .then(updatedTicket => {
          console.log(updatedTicket);
          mergeTickets(updatedTicket);
          setDisabled(false);
        })
        .catch(() => {
          setDisabled(false);
        });
    }
  };

  function getAdditionalFieldTypeValue(valueOf: string | undefined) {
    const additionalFieldTypeValue: AdditionalFieldTypeValue | undefined =
      additionalFieldType.additionalFieldTypeValues.find(
        additionalFieldTypeValueItem =>
          additionalFieldTypeValueItem.valueOf === valueOf,
      );
    return additionalFieldTypeValue;
  }

  return (
    <Select
      value={
        additionalFieldTypeValue?.valueOf
          ? additionalFieldTypeValue?.valueOf
          : ''
      }
      onChange={handleChange}
      sx={{ width: '100%' }}
      input={<StyledSelect />}
      disabled={disabled}
    >
      {additionalFieldType.additionalFieldTypeValues.map(values => (
        <MenuItem
          key={values.id}
          value={values.valueOf}
          onKeyDown={e => e.stopPropagation()}
        >
          {values.valueOf}
        </MenuItem>
      ))}
    </Select>
  );
}
