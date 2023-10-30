/* eslint-disable */
import { useEffect, useState } from 'react';

import { Chip, MenuItem, Tooltip } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { Stack } from '@mui/system';
import StyledSelect from '../../../../../components/styled/StyledSelect.tsx';
import {
  LabelBasic,
  LabelType,
  Ticket,
} from '../../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../../stores/TicketStore.ts';
import TicketsService from '../../../../../api/TicketsService.ts';
import { labelExistsOnTicket } from '../../../../../utils/helpers/tickets/labelUtils.ts';
import { ValidationColor } from '../../../../../types/validationColor.ts';
import LabelChip from '../../../components/LabelChip.tsx';
import { useUpdateLabels } from '../../../../../hooks/api/tickets/useUpdateTicket.tsx';

interface LabelSelectProps {
  ticket?: Ticket;
  border?: boolean;
}
export default function LabelSelect({ ticket, border }: LabelSelectProps) {
  if (ticket === undefined) return <></>;
  //   const [labels, setLabels] = useState(ticket.labels);
  const { labelTypes, mergeTickets, getLabelByName } = useTicketStore();
  const mutation = useUpdateLabels();
  const [method, setMethod] = useState('PUT');
  const { isError, isSuccess, data, isLoading } = mutation;

  const getLabelIsChecked = (labelType: LabelType): boolean => {
    let checked = false;
    ticket.labels?.forEach(label => {
      if (Number(label.id) === labelType.id) {
        checked = true;
        return;
      }
    });
    return checked;
  };

  const handleChange = (event: SelectChangeEvent<typeof ticket.labels>) => {
    const {
      target: { value },
    } = event;

    if (value === undefined) return;
    const label = getLabelByName(value[value.length - 1] as string);
    if (label === undefined) return;
    const shouldDelete = labelExistsOnTicket(ticket, label);

    setMethod(shouldDelete ? 'DELETE' : 'PUT');

    mutation.mutate({
      ticket: ticket,
      label: label,
      method: shouldDelete ? 'DELETE' : 'PUT',
    });
  };

  useEffect(() => {
    if (data !== undefined) {
      if (method === 'DELETE') {
        const updatedLabels = ticket.labels.filter(label => {
          return label.id !== data.id;
        });
        ticket.labels = updatedLabels;
      } else {
        console.log('data');
        console.log(data);
        ticket.labels.push(data);
      }

      mergeTickets(ticket);
    }
  }, [data]);

  console.log(ticket.labels);
  return (
    <Select
      key={ticket.id}
      multiple={true}
      value={ticket.labels}
      onChange={handleChange}
      MenuProps={{
        PaperProps: { sx: { maxHeight: 400 } },
      }}
      disabled={isLoading}
      sx={{ width: border ? 'auto' : '100%' }}
      input={border ? <Select /> : <StyledSelect />}
      renderValue={selected => (
        <Stack gap={1} direction="row" flexWrap="wrap">
          {selected.map(value => {
            return (
              <LabelChip
                label={value}
                labelTypeList={labelTypes}
                key={`${value.id}`}
              />
            );
          })}
        </Stack>
      )}
    >
      {labelTypes.map(labelType => (
        <MenuItem key={labelType.id} value={labelType.name}>
          <Stack
            direction="row"
            justifyContent="space-between"
            width="100%"
            alignItems="center"
          >
            <Chip
              color={labelType.displayColor}
              label={labelType.name}
              size="small"
              sx={{ color: 'black' }}
            />

            <Checkbox checked={getLabelIsChecked(labelType)} />
          </Stack>
        </MenuItem>
      ))}
    </Select>
  );
}
