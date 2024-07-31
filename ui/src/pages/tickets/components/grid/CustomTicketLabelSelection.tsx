/* eslint-disable */
import { useEffect, useState } from 'react';

import { Chip, MenuItem, Tooltip } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { Box, Stack } from '@mui/system';
import StyledSelect from '../../../../components/styled/StyledSelect.tsx';
import {
  LabelBasic,
  LabelType,
  Ticket,
  TicketDto,
} from '../../../../types/tickets/ticket.ts';
import useTicketStore from '../../../../stores/TicketStore.ts';
import TicketsService from '../../../../api/TicketsService.ts';
import {
  getLabelByName,
  labelExistsOnTicket,
} from '../../../../utils/helpers/tickets/labelUtils.ts';
import LabelChip from '../LabelChip.tsx';
import { ColorCode } from '../../../../types/ColorCode.ts';
import UnableToEditTicketTooltip from '../UnableToEditTicketTooltip.tsx';
import { useCanEditTicket } from '../../../../hooks/api/tickets/useCanEditTicket.tsx';
import {
  getTicketByIdOptions,
  useTicketById,
} from '../../../../hooks/api/tickets/useTicketById.tsx';
import { useQueryClient } from '@tanstack/react-query';

interface CustomTicketLabelSelectionProps {
  id: string;
  typedLabels?: LabelType[];
  labelTypeList: LabelType[];
  border?: boolean;
  ticket?: Ticket | TicketDto;
}

export default function CustomTicketLabelSelection({
  id,
  typedLabels,
  labelTypeList,
  border,
  ticket,
}: CustomTicketLabelSelectionProps) {
  const { getTicketById } = useTicketStore();
  const [fetchTicket, setFetchTicket] = useState<boolean>(false);
  useTicketById(ticket?.id.toString(), fetchTicket);
  const queryClient = useQueryClient();
  const [disabled, setDisabled] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);
  const { canEdit } = useCanEditTicket(ticket);

  const updateLabels = (labelType: LabelType) => {
    const ticket = getTicketById(Number(id));
    if (ticket === undefined) return;
    const shouldDelete = labelExistsOnTicket(ticket, labelType);
    if (shouldDelete) {
      TicketsService.deleteTicketLabel(id, labelType.id)
        .then(res => {
          setFetchTicket(true);
          void queryClient.invalidateQueries({
            queryKey: getTicketByIdOptions(ticket?.id.toString()).queryKey,
          });
          void queryClient.invalidateQueries({
            queryKey: ['ticketDto', ticket?.id.toString()],
          });
        })
        .catch(err => {
          console.log(err);
        })
        .finally(() => {
          setDisabled(false);
        });
    } else {
      TicketsService.addTicketLabel(id, labelType.id)
        .then(res => {
          setFetchTicket(true);

          void queryClient.invalidateQueries({
            queryKey: getTicketByIdOptions(ticket?.id.toString()).queryKey,
          });
          void queryClient.invalidateQueries({
            queryKey: ['ticketDto', ticket?.id.toString()],
          });
        })
        .catch(err => {
          console.log(err);
        })
        .finally(() => {
          setDisabled(false);
        });
    }
  };

  const getLabelIsChecked = (labelType: LabelType): boolean => {
    let checked = false;
    typedLabels?.forEach(label => {
      // label.
      if (Number(label.id) === labelType.id) {
        checked = true;
        return;
      }
    });
    return checked;
  };

  const handleChange = (event: SelectChangeEvent<typeof typedLabels>) => {
    setDisabled(true);
    const {
      target: { value },
    } = event;
    if (value === undefined) {
      setDisabled(false);
      return;
    }
    const labelValue = value[value.length - 1] as string;
    if (labelValue === undefined) {
      setDisabled(false);
      return;
    }
    let labelType: LabelType | undefined = getLabelByName(
      labelValue as unknown as string,
      labelTypeList,
    );

    if (labelType === undefined) return;
    updateLabels(labelType);
  };

  const handleChangeFocus = () => {
    setFocused(!focused);
  };

  return (
    <UnableToEditTicketTooltip canEdit={canEdit}>
      <Box sx={{ width: '100%' }}>
        <Select
          key={id}
          multiple={true}
          value={typedLabels}
          onChange={handleChange}
          onFocus={handleChangeFocus}
          disabled={disabled || !canEdit}
          sx={{ width: '100%' }}
          input={border ? <Select /> : <StyledSelect />}
          renderValue={selected => (
            <Stack gap={1} direction="row" flexWrap="wrap">
              {selected.map(value => {
                return (
                  <LabelChip
                    label={value}
                    labelTypeList={labelTypeList}
                    key={`${value.id}`}
                  />
                );
              })}
            </Stack>
          )}
        >
          {labelTypeList.map(labelType => (
            <MenuItem key={labelType.id} value={labelType.name}>
              <Stack
                direction="row"
                justifyContent="space-between"
                width="100%"
                alignItems="center"
              >
                <LabelTypeItemDisplay labelType={labelType} />

                <Checkbox checked={getLabelIsChecked(labelType)} />
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </Box>
    </UnableToEditTicketTooltip>
  );
}

interface LabelTypeItemDisplayProps {
  labelType: LabelType;
}

export function LabelTypeItemDisplay({ labelType }: LabelTypeItemDisplayProps) {
  return (
    <Chip
      // color={labelType.displayColor}
      label={labelType.name}
      size="small"
      sx={{ color: 'black', backgroundColor: labelType.displayColor }}
    />
  );
}
