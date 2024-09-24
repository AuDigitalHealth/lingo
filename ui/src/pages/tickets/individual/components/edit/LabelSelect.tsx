/* eslint-disable */
import { useState } from 'react';

import { Chip, MenuItem } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { Box, Stack } from '@mui/system';
import StyledSelect from '../../../../../components/styled/StyledSelect.tsx';
import { LabelType, Ticket } from '../../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../../stores/TicketStore.ts';
import {
  getLabelByName,
  labelExistsOnTicket,
} from '../../../../../utils/helpers/tickets/labelUtils.ts';
import LabelChip from '../../../components/LabelChip.tsx';
import { useUpdateLabels } from '../../../../../hooks/api/tickets/useUpdateTicket.tsx';
import UnableToEditTicketTooltip from '../../../components/UnableToEditTicketTooltip.tsx';
import { useCanEditTicket } from '../../../../../hooks/api/tickets/useCanEditTicket.tsx';
import { useAllLabels } from '../../../../../hooks/api/useInitializeTickets.tsx';

interface LabelSelectProps {
  ticket?: Ticket;
  border?: boolean;
}
export default function LabelSelect({ ticket, border }: LabelSelectProps) {
  if (ticket === undefined) return <></>;
  //   const [labels, setLabels] = useState(ticket.labels);
  const { labels } = useAllLabels();
  const { mergeTicket: mergeTickets } = useTicketStore();
  const mutation = useUpdateLabels();
  const [method, setMethod] = useState('PUT');
  const { isError, isSuccess, data, isPending } = mutation;
  const { canEdit } = useCanEditTicket(ticket);

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
    const label = getLabelByName(value[value.length - 1] as string, labels);
    if (label === undefined) return;
    const shouldDelete = labelExistsOnTicket(ticket, label);

    setMethod(shouldDelete ? 'DELETE' : 'PUT');

    mutation.mutate({
      ticket: ticket,
      label: label,
      method: shouldDelete ? 'DELETE' : 'PUT',
    });
  };

  return (
    <>
      <UnableToEditTicketTooltip canEdit={canEdit}>
        <Box sx={{ width: '100%' }}>
          <Select
            id={`ticket-labels-select-${ticket.id}`}
            key={ticket.id}
            multiple={true}
            value={ticket.labels}
            onChange={handleChange}
            MenuProps={{
              PaperProps: {
                sx: { maxHeight: 400 },
                id: `ticket-labels-select-${ticket.id}-container`,
              },
            }}
            disabled={isPending || !canEdit}
            sx={{ width: border ? 'auto' : '100%' }}
            input={border ? <Select /> : <StyledSelect />}
            renderValue={selected => (
              <Stack gap={1} direction="row" flexWrap="wrap">
                {selected.map(value => {
                  return (
                    <LabelChip
                      label={value}
                      labelTypeList={labels}
                      key={`${value.id}`}
                    />
                  );
                })}
              </Stack>
            )}
          >
            {labels.map(labelType => (
              <MenuItem key={labelType.id} value={labelType.name}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  width="100%"
                  alignItems="center"
                >
                  <Chip
                    // color={labelType.displayColor}
                    label={labelType.name}
                    size="small"
                    sx={{
                      backgroundColor: labelType.displayColor,
                    }}
                  />

                  <Checkbox checked={getLabelIsChecked(labelType)} />
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </Box>
      </UnableToEditTicketTooltip>
    </>
  );
}
