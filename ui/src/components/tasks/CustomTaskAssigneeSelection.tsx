import { ReactNode, useEffect, useState } from 'react';

import Gravatar from 'react-gravatar';
import emailUtils, { mapEmailToUserDetail } from '../../utils/helpers/emailUtils.ts';
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
import Checkbox from '@mui/material/Checkbox';
import { Stack } from '@mui/system';

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
  const [emailAddress, setEmailAddress] = useState<string>(user as string);
  const handleChange = (event: SelectChangeEvent<typeof emailAddress>) => {
    const {
      target: { value },
    } = event;
    void updateOwner(value, id as string)
      .catch(err => console.log(err))
      .then(() => console.log('this will succeed'));
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
      input={<OutlinedInput label="Tag" />}
      renderValue={selected => (
        <Stack gap={1} direction="row" flexWrap="wrap">
          <Tooltip title={emailUtils(selected)} key={selected}>
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
        <MenuItem key={u.emailAddress} value={u.emailAddress}>
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

          <Checkbox checked={emailAddress.indexOf(u.emailAddress) > -1} />
          <ListItemText primary={u.displayName} />
        </MenuItem>
      ))}
    </Select>
  );
}
