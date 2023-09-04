import { ReactNode, useEffect, useState } from 'react';

import Gravatar from 'react-gravatar';

import {
  getDisplayName,
  getEmail,
  getGravatarUrl,
  mapUserToUserDetail,
} from '../../utils/helpers/userUtils.ts';
import { Chip, ListItemText, MenuItem, Tooltip } from '@mui/material';
import { Task, UserDetails } from '../../types/task.ts';
import { JiraUser } from '../../types/JiraUserResponse.ts';
import useTaskStore from '../../stores/TaskStore.ts';
import TasksServices from '../../api/TasksService.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { Stack } from '@mui/system';
import StyledSelect from '../styled/StyledSelect.tsx';
import { useSnackbar } from 'notistack';
import { LabelBasic, LabelType, Ticket } from '../../types/tickets/ticket.ts';
import useTicketStore from '../../stores/TicketStore.ts';
import TicketsService from '../../api/TicketsService.ts';
import { labelExistsOnTicket } from '../../utils/helpers/tickets/labelUtils.ts';

interface CustomTicketLabelSelectionProps {
  id: string;
  labels?: LabelBasic[];
  labelTypeList: LabelType[];
}
const ITEM_HEIGHT = 100;
const ITEM_PADDING_TOP = 8;

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

export default function CustomTicketLabelSelection({
  id,
  labels,
  labelTypeList,
}: CustomTicketLabelSelectionProps) {
  const {getTicketById, getLabelByName, mergeTickets} = useTicketStore();
  const [disabled, setDisabled] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);
  const [labelName, setLabelName] = useState<string>();
  

  const updateLabels = async (labelType : LabelType) => {
    const ticket = getTicketById(Number(id));
    if (ticket === undefined) return;
    const shouldDelete = labelExistsOnTicket(ticket, labelType);
    console.log("shouldDelete")
    console.log(shouldDelete);
    if(shouldDelete){
        TicketsService.deleteTicketLabel(id, labelType.id).then( res => {
            updateTicket(res);
        }
        ).catch(err => {

        })
    } else {
        TicketsService.addTicketLabel(id, labelType.id).then( res => {
            updateTicket(res);
        }
        ).catch( err => {

        }

        )
    }
  };

  const updateTicket = (ticket: Ticket) => {
    mergeTickets(ticket);
    setDisabled(false);
  }

  const getLabelInfo = (id: string | undefined) : string => {
    if(id === undefined) return 'info';
    const thisLabelType = labelTypeList.find(labelType => {
        return labelType.id === Number(id);
    })
    return thisLabelType?.displayColor || 'info';
  }

  const getLabelIsChecked = (labelType: LabelType) : boolean => {
    let checked = false;
    labels?.forEach(label => {
        if(Number(label.labelTypeId) === labelType.id){
            checked = true;
            return;
        }
    })
    return checked;
  }

  const handleChange=(event: SelectChangeEvent<typeof labelName>)=>{
    setDisabled(true);
    const {
      target: { value },
    } = event;
    if (value === undefined){
        setDisabled(false);
        return;
    }
    const valueArray = value as unknown as string[];
    const valueString = valueArray.find((valueItem : any) => {
        return typeof valueItem === 'string' || valueItem instanceof String
    })
    if(valueString === undefined) {
        setDisabled(false);
        return;
    }
    const labelType : LabelType | undefined = getLabelByName(valueString);
    if(labelType === undefined) return;
    updateLabels(labelType);
  };

  const handleChangeFocus = () => {
    setFocused(!focused);
  };

  return (
    <Select
      multiple
      value={labels}
      onChange={handleChange}
      onFocus={handleChangeFocus}
      disabled={disabled}
      sx={{ width: '100%' }}
      input={<StyledSelect />}
      renderValue={selected => (
        <Stack gap={1} direction="row" flexWrap="wrap">
          {selected.map(value => (
            <Tooltip title={value.labelTypeName} key={value.id}>
              <Stack direction="row" spacing={1}>
              <Chip color={getLabelInfo(value.labelTypeId)} label={value.labelTypeName} size="small" sx={{ color: 'black' }} />
              </Stack>
            </Tooltip>
          ))}
        </Stack>
      )}
      MenuProps={MenuProps}
    >
      {labelTypeList.map(labelType => (
        <MenuItem key={labelType.id} value={labelType.name}>
          <Stack direction="row" justifyContent='space-between' width='100%' alignItems='center'>
            <Chip color={labelType.displayColor ? labelType.displayColor : 'info'} label={labelType.name} size="small" sx={{ color: 'black' }} />
            <Checkbox checked={getLabelIsChecked(labelType)} />
          </Stack>
        </MenuItem>
      ))}
    </Select>
  );
}
