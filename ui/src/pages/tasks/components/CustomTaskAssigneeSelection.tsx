import { useEffect, useState } from 'react';

import Gravatar from 'react-gravatar';

import {
  getEmail,
  mapUserToUserDetail,
} from '../../../utils/helpers/userUtils.ts';
import { ListItemText, MenuItem } from '@mui/material';
import { Task } from '../../../types/task.ts';
import { JiraUser } from '../../../types/JiraUserResponse.ts';
import useTaskStore from '../../../stores/TaskStore.ts';
import TasksServices from '../../../api/TasksService.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Stack } from '@mui/system';
import { useSnackbar } from 'notistack';
import StyledSelect from '../../../components/styled/StyledSelect.tsx';
import GravatarWithTooltip from '../../../components/GravatarWithTooltip.tsx';

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
  const { mergeTasks, getTaskById, allTasks } = useTaskStore();
  const { enqueueSnackbar } = useSnackbar();
  const [userName, setUserName] = useState<string>(user as string);
  const [disabled, setDisabled] = useState<boolean>(false);

  const [validUsersList, setValidUsersList] = useState<JiraUser[]>();

  useEffect(() => {
    const task = getTaskById(id);

    const users = userList.filter(user => {
      if (task?.reviewers === undefined) return true;

      const foundUserInReviewers = task?.reviewers?.filter(reviewer => {
        return reviewer.username === user.name;
      });

      if (foundUserInReviewers?.length !== 0) {
        return false;
      }
      return true;
    });
    setValidUsersList(users);
  }, [id, userList, getTaskById, allTasks]);

  const updateOwner = async (owner: string, taskId: string) => {
    const task = getTaskById(taskId);

    const assignee = mapUserToUserDetail(owner, userList);

    const returnedTask = await TasksServices.updateTask(
      task?.projectKey,
      task?.key,
      assignee,
      [],
    );
    mergeTasks(returnedTask);
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
        <GravatarWithTooltip username={selected} userList={userList} />
      )}
      MenuProps={MenuProps}
    >
      {validUsersList?.map(u => (
        <MenuItem
          key={u.name}
          value={u.name}
          onKeyDown={e => e.stopPropagation()}
        >
          <Stack direction="row" spacing={2}>
            {/* <Avatar url="/static/logo7.png" alt="food" /> */}
            <Gravatar
              //src={getGravatarUrl(u.name, userList)}
              email={getEmail(u.name, userList)}
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
