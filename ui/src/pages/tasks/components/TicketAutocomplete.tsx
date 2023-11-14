import { Autocomplete, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { Ticket } from '../../../types/tickets/ticket';
import { Stack } from '@mui/system';
import { useSearchTicketByTitle } from '../../../hooks/api/useInitializeTickets';
import useDebounce from '../../../hooks/useDebounce';
import { truncateString } from '../../../utils/helpers/stringUtils';

interface TicketAutocompleteProps {
  handleChange: (ticket: Ticket | null) => void;
  existingAssociatedTickets: Ticket[];
}

export default function TicketAutocomplete({
  handleChange,
  existingAssociatedTickets,
}: TicketAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Ticket[]>([]);
  const debouncedSearch = useDebounce(inputValue, 1000);
  const { isLoading, data } = useSearchTicketByTitle(
    debouncedSearch,
    '&taskAssociation=null',
  );

  useEffect(() => {
    mapDataToOptions();
  }, [data]);

  const mapDataToOptions = () => {
    if (data?._embedded?.ticketDtoList) {
      const existingIds = new Set(
        existingAssociatedTickets.map(ticket => ticket.id),
      );
      const acceptableOptions = data?._embedded?.ticketDtoList.filter(
        ticket => !existingIds.has(ticket.id),
      );
      setOptions(acceptableOptions);
    }
  };

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
      renderOption={(props, option, { selected }) => {
        return (
          <li {...props}>
            <Stack direction="row">{truncateString(option.title, 50)}</Stack>
          </li>
        );
      }}
    ></Autocomplete>
  );
}
