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
}
export default function LabelSelect({ ticket }: LabelSelectProps) {
  if (ticket === undefined) return <></>;
  const [labels, setLabels] = useState(ticket.labels);
  const { labelTypes, mergeTickets, getLabelByName } = useTicketStore();
  const mutation = useUpdateLabels();
  const { isError, isSuccess, data, isLoading } = mutation;

  const getLabelIsChecked = (labelType: LabelType): boolean => {
    let checked = false;
    labels?.forEach(label => {
      if (Number(label.id) === labelType.id) {
        checked = true;
        return;
      }
    });
    return checked;
  };

  const handleChange = (event: SelectChangeEvent<typeof labels>) => {
    const {
      target: { value },
    } = event;

    if (value === undefined) return;
    console.log('actually here');
    const label = getLabelByName(value[value.length - 1] as string);
    if (label === undefined) return;
    mutation.mutate({ ticket: ticket, label: label });
  };

  useEffect(() => {
    if (data !== undefined) {
      ticket.labels.push(data);
      mergeTickets(ticket);
    }
  }, [data]);
  return (
    <Select
      key={ticket.id}
      multiple={true}
      value={labels}
      onChange={handleChange}
      // onFocus={handleChangeFocus}
      disabled={isLoading}
      sx={{ width: '100%' }}
      input={<StyledSelect />}
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
