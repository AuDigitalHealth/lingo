import { useEffect, useState } from 'react';

import {
  getDisplayName,
  mapUserToUserDetail,
} from '../../../utils/helpers/userUtils.ts';
import { ListItemText, MenuItem, Tooltip } from '@mui/material';
import { UserDetails } from '../../../types/task.ts';
import { JiraUser } from '../../../types/JiraUserResponse.ts';
import useTaskStore from '../../../stores/TaskStore.ts';
import TasksServices from '../../../api/TasksService.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { Stack } from '@mui/system';
import StyledSelect from '../../../components/styled/StyledSelect.tsx';
import { useSnackbar } from 'notistack';
import GravatarWithTooltip from '../../../components/GravatarWithTooltip.tsx';

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
  const { mergeTasks, getTaskById, allTasks } = useTaskStore();
  const { enqueueSnackbar } = useSnackbar();
  const [userName, setUserName] = useState<string[]>(user as string[]);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);
  const [validUserList, setValidUserList] = useState<JiraUser[]>();

  // const getTaskById = useCallback((taskId: string | undefined) => {
  //   return getTaskById(taskId) as Task;
  // }, []);

  useEffect(() => {
    const task = getTaskById(id);
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
  }, [userList, id, getTaskById, allTasks]);

  const updateReviewers = async (reviewerList: string[], taskId: string) => {
    const task = getTaskById(taskId);

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

    const returnedTask = await TasksServices.updateTask(
      task?.projectKey,
      task?.key,
      undefined,
      reviewers as UserDetails[],
    );
    mergeTasks(returnedTask);
  };

  const handleChange = (event: SelectChangeEvent<typeof userName>) => {
    setDisabled(true);
    const {
      target: { value },
    } = event;
    void updateReviewers(value as string[], id as string)
      .then(() => {
        enqueueSnackbar(`Updated reviewers for task ${id}`, {
          variant: 'success',
          autoHideDuration: 5000,
        });
        setDisabled(false);
      })
      .catch(err => {
        enqueueSnackbar(
          `Update reviewers failed for task ${id} with error ${err}`,
          {
            variant: 'error',
          },
        );
        setDisabled(false);
      });
    setUserName(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleChangeFocus = () => {
    setFocused(!focused);
  };

  return (
    <Select
      multiple
      value={userName}
      onChange={handleChange}
      onFocus={handleChangeFocus}
      disabled={disabled}
      sx={{ width: '100%' }}
      //disableUnderline={true}
      // input={focused ? <OutlinedInput label="Tag" />:<Input />}
      input={<StyledSelect />}
      //renderValue={(selected) => selected.join(', ')}
      renderValue={selected => (
        <Stack gap={1} direction="row" flexWrap="wrap">
          {selected.map(value => (
            <Tooltip title={getDisplayName(value, userList)} key={value}>
              <Stack direction="row" spacing={1}>
                <GravatarWithTooltip username={value} userList={userList} />
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
            <GravatarWithTooltip username={u.name} userList={userList} />
          </Stack>

          <Checkbox checked={userName.indexOf(u.name) > -1} />
          <ListItemText primary={u.displayName} />
        </MenuItem>
      ))}
    </Select>
  );
}
