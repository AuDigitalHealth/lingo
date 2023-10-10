import { useState } from 'react';

import { MenuItem } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import {
  AdditionalFieldTypeOfListType,
  AdditionalFieldValueDto,
  TypeValue,
} from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';

interface CustomAdditionalFieldsSelectionProps {
  id?: string;
  additionalFieldValue?: AdditionalFieldValueDto;
  additionalFieldTypeWithValues?: AdditionalFieldTypeOfListType;
}

export default function CustomAdditionalFieldsSelection({
  id,
  additionalFieldValue: additionalFieldValue,
  additionalFieldTypeWithValues,
}: CustomAdditionalFieldsSelectionProps) {
  const [disabled, setDisabled] = useState<boolean>(false);
  const { getTicketById, mergeTickets } = useTicketStore();

  const handleChange = (event: SelectChangeEvent) => {
    setDisabled(true);
    const newAdditionalFieldTypeValue = getAdditionalFieldValue(
      event.target.value,
    );

    const ticket = getTicketById(Number(id));
    if (ticket !== undefined && newAdditionalFieldTypeValue !== undefined) {
      TicketsService.updateAdditionalFieldValue(
        ticket.id,
        newAdditionalFieldTypeValue,
      )
        .then(updatedTicket => {
          mergeTickets(updatedTicket);
          setDisabled(false);
        })
        .catch(() => {
          setDisabled(false);
        });
    }
  };

  function getAdditionalFieldValue(value: string | undefined) {
    const additionalFieldValue: TypeValue | undefined =
      additionalFieldTypeWithValues?.values.find(item => {
        return item.value === value;
      });
    return additionalFieldValue?.value;
  }

  return (
    <Select
      value={additionalFieldValue?.valueOf ? additionalFieldValue?.value : ''}
      onChange={handleChange}
      sx={{ width: '100%' }}
      input={<StyledSelect />}
      disabled={disabled}
    >
      {additionalFieldTypeWithValues?.values.map(values => (
        <MenuItem
          key={values.value}
          value={values.value}
          onKeyDown={e => e.stopPropagation()}
        >
          {values.value}
        </MenuItem>
      ))}
    </Select>
  );
}
