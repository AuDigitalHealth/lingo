import { useEffect, useState } from 'react';

import {
  getDisplayName,
  mapUserToUserDetail,
} from '../../../utils/helpers/userUtils.ts';
import { ListItemText, MenuItem, Tooltip } from '@mui/material';
import { UserDetails } from '../../../types/task.ts';
import { JiraUser } from '../../../types/JiraUserResponse.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { Stack } from '@mui/system';
import StyledSelect from '../../../components/styled/StyledSelect.tsx';
import GravatarWithTooltip from '../../../components/GravatarWithTooltip.tsx';
import {
  getTaskById,
  useAllTasks,
  useUpdateTask,
} from '../../../hooks/api/useAllTasks.tsx';

interface CustomTaskReviewerSelectionProps {
  id?: string;
  user?: string[];
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

export default function CustomTaskReviewerSelection({
  id,
  user,
  userList,
}: CustomTaskReviewerSelectionProps) {
  const [focused, setFocused] = useState<boolean>(false);
  const [validUserList, setValidUserList] = useState<JiraUser[]>();

  const { allTasks } = useAllTasks();

  const mutation = useUpdateTask('reviewers');

  useEffect(() => {
    const task = getTaskById(id, allTasks);
    if (task === null) return;
    const assigneeIsReviewer = task?.reviewers?.filter(reviewer => {
      return reviewer.email === task?.assignee.email;
    });
    if (assigneeIsReviewer?.length > 0) {
      setValidUserList(userList);
    } else {
      const validUsers = userList.filter(user => {
        return user.name !== task?.assignee.username;
      });
      setValidUserList(validUsers);
    }
  }, [userList, id, allTasks]);

  const updateReviewers = (reviewerList: string[]) => {
    const task = getTaskById(id, allTasks);

    if (task === null) return;
    const reviewers = reviewerList.map(e => {
      const userDetail = mapUserToUserDetail(e, userList);
      if (userDetail) {
        return userDetail;
      } else {
        return task.reviewers.find(reviewer => {
          return reviewer.username === e;
        });
      }
    });

    return mutation.mutate({
      projectKey: task?.projectKey,
      taskKey: task?.key,
      assignee: undefined,
      reviewers: reviewers as UserDetails[],
    });
  };

  const handleChange = (event: SelectChangeEvent<typeof user>) => {
    const {
      target: { value },
    } = event;
    updateReviewers(value as string[]);
  };

  const handleChangeFocus = () => {
    setFocused(!focused);
  };

  return (
    <Select
      multiple
      value={user}
      onChange={handleChange}
      onFocus={handleChangeFocus}
      disabled={mutation.isPending}
      sx={{ width: '100%' }}
      input={<StyledSelect />}
      renderValue={selected => (
        <Stack gap={1} direction="row" flexWrap="wrap">
          {selected.map(value => (
            <Tooltip title={getDisplayName(value, userList)} key={value}>
              <Stack direction="row" spacing={1}>
                <GravatarWithTooltip username={value} />
              </Stack>
            </Tooltip>
          ))}
        </Stack>
      )}
      MenuProps={MenuProps}
    >
      {validUserList?.map(u => (
        <MenuItem key={u.name} value={u.name}>
          <Stack direction="row" spacing={2}>
            <GravatarWithTooltip username={u.name} />
          </Stack>

          <Checkbox checked={user ? user.indexOf(u.name) > -1 : false} />
          <ListItemText primary={u.displayName} />
        </MenuItem>
      ))}
    </Select>
  );
}
