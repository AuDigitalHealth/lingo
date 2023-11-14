import { Autocomplete, TextField } from '@mui/material';
import { useState } from 'react';

import { Stack } from '@mui/system';

import { Task } from '../../../../../types/task';
import { useInitializeAllTasks } from '../../../../../hooks/api/useInitializeTasks';
import useApplicationConfigStore from '../../../../../stores/ApplicationConfigStore';
import useTaskStore from '../../../../../stores/TaskStore';
import { truncateString } from '../../../../../utils/helpers/stringUtils';

interface TaskAutoCompleteProps {
  handleChange: (task: Task | null) => void;
}

export default function TaskAutoComplete({
  handleChange,
}: TaskAutoCompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const { applicationConfig } = useApplicationConfigStore();
  const { allTasksIsLoading } = useInitializeAllTasks(applicationConfig);
  const { allTasks } = useTaskStore();

  console.log('all tasks');
  console.log(allTasks);

  return (
    <Autocomplete
      sx={{ width: '400px' }}
      loading={allTasksIsLoading}
      open={open}
      onOpen={() => {
        setOpen(!open);
      }}
      onClose={() => {
        setOpen(!open);
      }}
      autoComplete
      inputValue={inputValue}
      onInputChange={(e, value) => {
        setInputValue(value);
        if (!value) {
          setOpen(false);
        }
      }}
      onChange={(e, value) => {
        handleChange(value);
      }}
      options={allTasks}
      renderInput={params => (
        <TextField
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '0px 4px 4px 0px',
              height: '36px',
            },
          }}
          {...params}
          label="Search for a task by key"
          variant="outlined"
          size="small"
        />
      )}
      getOptionLabel={option => {
        return option.key + ' ' + truncateString(option.summary, 20) || '';
      }}
      renderOption={(props, option, { selected }) => {
        return (
          <li {...props}>
            <Stack direction="row">
              {option.key + ' ' + truncateString(option.summary, 20)}
            </Stack>
          </li>
        );
      }}
    ></Autocomplete>
  );
}
