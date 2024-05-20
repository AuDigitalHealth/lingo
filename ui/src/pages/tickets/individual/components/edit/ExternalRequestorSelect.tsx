/* eslint-disable */
import { useEffect, useState } from 'react';

import { Chip, MenuItem, Tooltip } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { Box, Stack } from '@mui/system';
import StyledSelect from '../../../../../components/styled/StyledSelect.tsx';
import {
  ExternalRequestor,
  LabelBasic,
  LabelType,
  Ticket,
} from '../../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../../stores/TicketStore.ts';
import TicketsService from '../../../../../api/TicketsService.ts';
import {
  externalRequestorExistsOnTicket,
  labelExistsOnTicket,
} from '../../../../../utils/helpers/tickets/labelUtils.ts';
import { ValidationColor } from '../../../../../types/validationColor.ts';
import LabelChip from '../../../components/LabelChip.tsx';
import {
  useUpdateExternalRequestors,
  useUpdateLabels,
} from '../../../../../hooks/api/tickets/useUpdateTicket.tsx';
import UnableToEditTicketTooltip from '../../../components/UnableToEditTicketTooltip.tsx';
import { useCanEditTicketById } from '../../../../../hooks/api/tickets/useCanEditTicket.tsx';
import ExternalRequestorChip from '../../../components/ExternalRequestorChip.tsx';

interface ExternalRequestorSelectProps {
  ticket?: Ticket;
  border?: boolean;
}
export default function ExternalRequestorSelect({
  ticket,
  border,
}: ExternalRequestorSelectProps) {
  if (ticket === undefined) return <></>;
  //   const [labels, setLabels] = useState(ticket.labels);
  const { externalRequestors, mergeTickets, getExternalRequestorByName } =
    useTicketStore();
  const mutation = useUpdateExternalRequestors();
  const [method, setMethod] = useState('PUT');
  const { isError, isSuccess, data, isLoading } = mutation;
  const [canEdit] = useCanEditTicketById(ticket.id.toString());

  const getExternalRequestorIsChecked = (
    externalRequestorType: ExternalRequestor,
  ): boolean => {
    let checked = false;
    ticket.externalRequestors?.forEach(externalRequestor => {
      if (Number(externalRequestor.id) === externalRequestorType.id) {
        checked = true;
        return;
      }
    });
    return checked;
  };

  const handleChange = (
    event: SelectChangeEvent<typeof ticket.externalRequestors>,
  ) => {
    const {
      target: { value },
    } = event;

    if (value === undefined) return;
    const externalRequestor = getExternalRequestorByName(
      value[value.length - 1] as string,
    );
    if (externalRequestor === undefined) return;
    const shouldDelete = externalRequestorExistsOnTicket(
      ticket,
      externalRequestor,
    );

    setMethod(shouldDelete ? 'DELETE' : 'PUT');

    mutation.mutate({
      ticket: ticket,
      externalRequestor: externalRequestor,
      method: shouldDelete ? 'DELETE' : 'PUT',
    });
  };

  useEffect(() => {
    if (data !== undefined) {
      if (method === 'DELETE') {
        const updatedLabels = ticket.externalRequestors.filter(label => {
          return label.id !== data.id;
        });
        ticket.externalRequestors = updatedLabels;
      } else {
        ticket.externalRequestors.push(data);
      }

      mergeTickets(ticket);
    }
  }, [data]);

  return (
    <UnableToEditTicketTooltip canEdit={canEdit}>
      <Box sx={{ width: '100%' }}>
        <Select
          id={`ticket-external-requestors-select-${ticket.id}`}
          key={ticket.id}
          multiple={true}
          value={ticket.externalRequestors}
          onChange={handleChange}
          MenuProps={{
            PaperProps: {
              sx: { maxHeight: 400 },
              id: `ticket-labels-select-${ticket.id}-container`,
            },
          }}
          disabled={isLoading || !canEdit}
          sx={{ width: border ? 'auto' : '100%' }}
          input={border ? <Select /> : <StyledSelect />}
          renderValue={selected => (
            <Stack gap={1} direction="row" flexWrap="wrap">
              {selected.map(value => {
                return (
                  <ExternalRequestorChip
                    externalRequestor={value}
                    externalRequestorList={externalRequestors}
                    key={`${value.id}`}
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
                  // color={labelType.displayColor}
                  label={externalRequestorType.name}
                  size="small"
                  sx={{
                    color: 'black',
                    backgroundColor: externalRequestorType.displayColor,
                  }}
                />

                <Checkbox
                  checked={getExternalRequestorIsChecked(externalRequestorType)}
                />
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </Box>
    </UnableToEditTicketTooltip>
  );
}
