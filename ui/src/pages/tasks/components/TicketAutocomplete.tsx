import { Autocomplete, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { Ticket } from '../../../types/tickets/ticket';
import { Stack } from '@mui/system';
import { useSearchTicketByTitle, useSearchTicketByTitlePost } from '../../../hooks/api/useInitializeTickets';
import useDebounce from '../../../hooks/useDebounce';
import { truncateString } from '../../../utils/helpers/stringUtils';
import { SearchCondition } from '../../../types/tickets/search';

interface TicketAutocompleteProps {
  handleChange: (ticket: Ticket | null) => void;
  defaultConditions: SearchCondition[];
}

export default function TicketAutocomplete({
  handleChange,
  defaultConditions
}: TicketAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Ticket[]>([]);
  const debouncedSearch = useDebounce(inputValue, 1000);
  const { mutate, isLoading, data } = useSearchTicketByTitlePost();

  console.log(debouncedSearch);
  console.log(defaultConditions);
  useEffect(() => {
    if(debouncedSearch && debouncedSearch !== ""){
      mutate({title: debouncedSearch, defaultConditions: defaultConditions});
    }
  }, [debouncedSearch])

  useEffect(() => {
    const mapDataToOptions = () => {
      if (data?._embedded?.ticketDtoList) {
        const acceptableOptions = data?._embedded?.ticketDtoList.map(
          ticket => ticket,
        );
        setOptions(acceptableOptions);
      }
    };
    mapDataToOptions();
  }, [data, setOptions]);

  return (
    <Autocomplete
      sx={{ width: '400px' }}
      loading={isLoading}
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
      options={options}
      renderInput={params => (
        <TextField
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '0px 4px 4px 0px',
              height: '36px',
            },
          }}
          {...params}
          label="Search for a ticket by name"
          variant="outlined"
          size="small"
        />
      )}
      getOptionLabel={option => {
        return option.title || '';
      }}
      renderOption={(props, option) => {
        return (
          <li {...props}>
            <Stack direction="row">{truncateString(option.title, 50)}</Stack>
          </li>
        );
      }}
    ></Autocomplete>
  );
}
