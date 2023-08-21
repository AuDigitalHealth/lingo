import { ReactNode, useEffect, useState } from 'react';

import Gravatar from 'react-gravatar';
import emailUtils, {
  mapEmailToUserDetail,
} from '../../utils/helpers/emailUtils.ts';
import {
  ListItemText,
  MenuItem,
  OutlinedInput,
  TextField,
  Tooltip,
} from '@mui/material';
import { Task, TaskStatus, UserDetails } from '../../types/task.ts';
import { JiraUser, JiraUserSelect } from '../../types/JiraUserResponse.ts';
import useTaskStore from '../../stores/TaskStore.ts';
import TasksServices from '../../api/TasksService.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Stack } from '@mui/system';
import { useSnackbar } from 'notistack';
import emailToName from '../../utils/helpers/emailUtils.ts';

interface CustomTaskAssigneeSelectionProps {
  id?: string;
  user?: string;
  userList: JiraUser[];
}
const ITEM_HEIGHT = 100;
const ITEM_PADDING_TOP = 8;

export default function CustomTaskAssigneeSelection({
  id,
  user,
  userList,
}: CustomTaskAssigneeSelectionProps) {
  const taskStore = useTaskStore();
  const { enqueueSnackbar } = useSnackbar();
  const [emailAddress, setEmailAddress] = useState<string>(user as string);
  const [disabled, setDisabled] = useState<boolean>(false);
  const getTaskById = (taskId: string): Task => {
    return taskStore.getTaskById(taskId) as Task;
  };
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };

  const updateOwner = async (owner: string, taskId: string) => {
    const task: Task = getTaskById(taskId);

    const assignee = mapEmailToUserDetail(owner, userList);

    const returnedTask = await TasksServices.updateTask(
      task?.projectKey,
      task?.key,
      assignee,
      [],
    );
    taskStore.mergeTasks(returnedTask);
  };

  const handleChange = (event: SelectChangeEvent<typeof emailAddress>) => {
    setDisabled(true);
    const {
      target: { value },
    } = event;

    void updateOwner(value, id as string)
      .then(() => {
        enqueueSnackbar(`Updated owner for task ${id}`, {
          variant: 'success',
          autoHideDuration: 5000,
        });
        setDisabled(false);
      })
      .catch(err => {
        enqueueSnackbar(
          `Update owner failed for task ${id} with error ${err}`,
          {
            variant: 'error',
          },
        );
        setDisabled(false);
      });

    setEmailAddress(
      // On autofill we get a stringified value.
      value,
    );
    console.log(value);
  };

  return (
    <Select
      value={emailAddress}
      onChange={handleChange}
      sx={{ width: '100%' }}
      input={<OutlinedInput label="Tag" />}
      disabled={disabled}
      renderValue={selected => (
        <Stack gap={1} direction="row" flexWrap="wrap">
          <Tooltip title={emailToName(selected)} key={selected}>
            <Stack direction="row" spacing={1}>
              <Gravatar
                email={selected}
                rating="pg"
                default="monsterid"
                style={{ borderRadius: '50px' }}
                size={30}
                className="CustomAvatar-image"
                key={selected}
              />
            </Stack>
          </Tooltip>
        </Stack>
      )}
      MenuProps={MenuProps}
    >
      {userList.map(u => (
        <MenuItem
          key={u.emailAddress}
          value={u.emailAddress}
          onKeyDown={e => e.stopPropagation()}
        >
          <Stack direction="row" spacing={2}>
            {/* <Avatar url="/static/logo7.png" alt="food" /> */}
            <Gravatar
              email={u.emailAddress}
              rating="pg"
              default="monsterid"
              style={{ borderRadius: '50px' }}
              size={30}
              className="CustomAvatar-image"
            />
          </Stack>

          <ListItemText primary={u.displayName} />
        </MenuItem>
      ))}
    </Select>
  );
}
