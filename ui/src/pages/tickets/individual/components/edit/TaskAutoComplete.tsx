import { Autocomplete, TextField } from '@mui/material';
import { useState } from 'react';

import { Stack } from '@mui/system';

import { Task } from '../../../../../types/task';
import { useAllTasks } from '../../../../../hooks/api/useAllTasks';

interface TaskAutoCompleteProps {
  handleChange: (task: Task | null) => void;
}

export default function TaskAutoComplete({
  handleChange,
}: TaskAutoCompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { allTasksIsLoading } = useAllTasks();
  const { allTasks } = useAllTasks();

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
      options={allTasks ? allTasks : []}
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
        return option.key + ' ' + option.summary;
      }}
      renderOption={(props, option) => {
        return (
          <li {...props}>
            <Stack direction="row">{option.key + ' ' + option.summary}</Stack>
          </li>
        );
      }}
    ></Autocomplete>
  );
}
