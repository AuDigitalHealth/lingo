import { useGridApiContext } from '@mui/x-data-grid';
import { ReactNode, useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Gravatar from 'react-gravatar';
import emailToName from './emailToName.ts';
import { InputAdornment, TextField } from '@mui/material';
import { Task, UserDetails } from '../../types/task.ts';
import { Autocomplete } from '@mui/lab';
import { JiraUser } from '../../types/JiraUserResponse.ts';
import taskStore from '../../stores/TaskStore.ts';
import useTaskStore from '../../stores/TaskStore.ts';
import TasksServices from '../../api/TasksService.ts';

interface CustomTaskAutoCompleteProps {
  id?: string;
  user?: string;
  userList: JiraUser[];
  // callBack: (jiraUser:JiraUser, task:Task) => void;
}

export default function CustomTaskAutoComplete({
  id,
  user,
  userList,
}: CustomTaskAutoCompleteProps) {
  const taskStore = useTaskStore();
  const getTaskById = (taskId: string): Task => {
    return taskStore.getTaskById(taskId) as Task;
  };
  const updateAssignee = async (jiraUser: JiraUser, taskId: string) => {
    const task: Task = getTaskById(taskId);
    const assignee: UserDetails = {
      email: jiraUser.emailAddress,
      displayName: jiraUser.displayName,
      username: jiraUser.name,
      avatarUrl: '',
    };

    const returnedTask = await TasksServices.updateTask(
      task?.projectKey,
      task?.key,
      assignee,
      [],
    );
    taskStore.mergeTasks(returnedTask);
  };

  const currUser = userList.find(function (u) {
    return u.emailAddress === user;
  });
  const [value, setValue] = useState(currUser);

  return (
    <Autocomplete
      value={value}
      onChange={(event, newValue) => {
        if (newValue && id) {
          setValue(newValue);
          void updateAssignee(newValue, id)
            .catch(err => console.log(err))
            .then(() => console.log('this will succeed'));
          // callBack(newValue, getTaskById(id));
        }
      }}
      id="country-select-demo"
      sx={{ width: 300 }}
      options={userList}
      autoHighlight
      getOptionLabel={option => option.displayName}
      renderOption={(props, option) => (
        <Box
          component="li"
          sx={{ '& > Gravatar': { mr: 2, flexShrink: 0 } }}
          {...props}
        >
          <Gravatar
            email={option.emailAddress}
            rating="pg"
            default="monsterid"
            style={{ borderRadius: '50px' }}
            size={30}
            className="CustomAvatar-image"
          />
          {option.displayName}
        </Box>
      )}
      renderInput={params => {
        return (
          <TextField
            {...params}
            // label="Choose an owner"
            inputProps={{
              ...params.inputProps,
              autoComplete: 'new-password', // disable autocomplete and autofill
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: value ? (
                <InputAdornment position="start">
                  <Gravatar
                    email={value.emailAddress}
                    rating="pg"
                    default="monsterid"
                    style={{ borderRadius: '50px' }}
                    size={30}
                    className="CustomAvatar-image"
                  />
                </InputAdornment>
              ) : (
                value
              ),
            }}
          />
        );
      }}
    />
  );
}
