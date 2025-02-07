import { useEffect, useState } from 'react';

import { mapUserToUserDetail } from '../../../utils/helpers/userUtils.ts';
import { ListItemText, MenuItem } from '@mui/material';
import { JiraUser } from '../../../types/JiraUserResponse.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Stack } from '@mui/system';
import StyledSelect from '../../../components/styled/StyledSelect.tsx';
import AvatarWithTooltip from '../../../components/AvatarWithTooltip.tsx';
import {
  getTaskById,
  useAllTasks,
  useUpdateTask,
} from '../../../hooks/api/useAllTasks.tsx';

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
  const { allTasks } = useAllTasks();
  const [userName, setUserName] = useState<string>(user as string);

  const [validUsersList, setValidUsersList] = useState<JiraUser[]>();

  console.log('valid user list');
  console.log(validUsersList);
  const mutation = useUpdateTask('owner');

  useEffect(() => {
    const task = getTaskById(id, allTasks);

    const users = userList.filter(user => {
      if (!task?.reviewers) return true;

      const foundUserInReviewers = task?.reviewers?.filter(reviewer => {
        return reviewer.username === user.name;
      });

      if (
        foundUserInReviewers?.length !== 0 &&
        foundUserInReviewers[0].email !== task.assignee?.email
      ) {
        return false;
      }
      return true;
    });
    setUserName(task?.assignee.username ? task?.assignee.username : '');
    setValidUsersList(users);
  }, [id, userList, allTasks]);

  const updateOwner = (owner: string, taskId: string) => {
    const task = getTaskById(taskId, allTasks);

    const assignee = mapUserToUserDetail(owner, userList);

    return mutation.mutate({
      projectKey: task?.projectKey,
      taskKey: task?.key,
      assignee: assignee,
      reviewers: [],
    });
  };

  const handleChange = (event: SelectChangeEvent<typeof userName>) => {
    const {
      target: { value },
    } = event;

    void updateOwner(value, id as string);
  };

  return (
    <Select
      value={validUsersList ? user : ''}
      onChange={handleChange}
      sx={{ width: '100%' }}
      input={<StyledSelect />}
      disabled={mutation.isPending}
      renderValue={selected => <AvatarWithTooltip username={selected} />}
      MenuProps={MenuProps}
    >
      {validUsersList?.map(u => (
        <MenuItem
          key={u.name}
          value={u.name}
          onKeyDown={e => e.stopPropagation()}
        >
          <Stack direction="row" spacing={2}>
            <AvatarWithTooltip username={u.name} />
            <ListItemText primary={u.displayName} />
          </Stack>
        </MenuItem>
      ))}
    </Select>
  );
}
