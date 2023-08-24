import { useState } from 'react';

import Gravatar from 'react-gravatar';

import {
  getDisplayName,
  getGravatarUrl,
  mapUserToUserDetail,
} from '../../utils/helpers/userUtils.ts';
import { ListItemText, MenuItem, Tooltip } from '@mui/material';
import { Task } from '../../types/task.ts';
import { JiraUser } from '../../types/JiraUserResponse.ts';
import useTaskStore from '../../stores/TaskStore.ts';
import TasksServices from '../../api/TasksService.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Stack } from '@mui/system';
import { useSnackbar } from 'notistack';
import StyledSelect from '../styled/StyledSelect.tsx';

interface CustomTaskAssigneeSelectionProps {
  id?: string;
  user?: string;
  userList: JiraUser[];
}
const ITEM_HEIGHT = 100;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function CustomTaskAssigneeSelection({
  id,
  user,
  userList,
}: CustomTaskAssigneeSelectionProps) {
  const taskStore = useTaskStore();
  const { enqueueSnackbar } = useSnackbar();
  const [userName, setUserName] = useState<string>(user as string);
  const [disabled, setDisabled] = useState<boolean>(false);
  const getTaskById = (taskId: string): Task => {
    return taskStore.getTaskById(taskId) as Task;
  };

  const updateOwner = async (owner: string, taskId: string) => {
    const task: Task = getTaskById(taskId);

    const assignee = mapUserToUserDetail(owner, userList);

    const returnedTask = await TasksServices.updateTask(
      task?.projectKey,
      task?.key,
      assignee,
      [],
    );
    taskStore.mergeTasks(returnedTask);
  };

  const handleChange = (event: SelectChangeEvent<typeof userName>) => {
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

    setUserName(
      // On autofill we get a stringified value.
      value,
    );
  };

  return (
    <Select
      value={userName}
      onChange={handleChange}
      sx={{ width: '100%' }}
      input={<StyledSelect />}
      disabled={disabled}
      renderValue={selected => (
        <Stack gap={1} direction="row" flexWrap="wrap">
          <Tooltip title={getDisplayName(selected, userList)} key={selected}>
            <Stack direction="row" spacing={1}>
              <Gravatar
                src={getGravatarUrl(selected, userList)}
                email={selected}
                //email={selected}
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
          key={u.name}
          value={u.name}
          onKeyDown={e => e.stopPropagation()}
        >
          <Stack direction="row" spacing={2}>
            {/* <Avatar url="/static/logo7.png" alt="food" /> */}
            <Gravatar
              src={getGravatarUrl(u.name, userList)}
              email={u.name}
              rating="pg"
              default="monsterid"
              style={{ borderRadius: '50px' }}
              size={30}
              className="CustomAvatar-image"
            />
            <ListItemText primary={u.displayName} />
          </Stack>
        </MenuItem>
      ))}
    </Select>
  );
}
