import { Autocomplete, TextField, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import { Ticket } from '../../../types/tickets/ticket';
import { Stack } from '@mui/system';
import { useSearchTicketByTitlePost } from '../../../hooks/api/useInitializeTickets';
import useDebounce from '../../../hooks/useDebounce';
import { truncateString } from '../../../utils/helpers/stringUtils';
import { SearchCondition } from '../../../types/tickets/search';

interface TicketAutocompleteProps {
  handleChange: (ticket: Ticket | null) => void;
  defaultConditions?: SearchCondition[];
  isOptionDisabled?: (value: Ticket) => boolean;
  disabledTooltipTitle?: string;
}

export default function TicketAutocomplete({
  handleChange,
  defaultConditions,
  isOptionDisabled,
  disabledTooltipTitle,
}: TicketAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Ticket[]>([]);
  const debouncedSearch = useDebounce(inputValue, 1000);
  const { mutate, isLoading, data } = useSearchTicketByTitlePost();

  useEffect(() => {
    if (debouncedSearch && debouncedSearch !== '') {
      mutate({ title: debouncedSearch, defaultConditions: defaultConditions });
    }
  }, [debouncedSearch, mutate, defaultConditions]);

  useEffect(() => {
    const mapDataToOptions = () => {
      if (data?._embedded?.ticketBacklogDtoList) {
        const acceptableOptions = data?._embedded?.ticketBacklogDtoList.map(
          ticket => ticket,
        );
        setOptions(acceptableOptions);
      }
    };
    mapDataToOptions();
  }, [data, setOptions]);

  return (
    <Autocomplete
      data-testid={'ticket-association-input'}
      getOptionDisabled={option =>
        isOptionDisabled ? isOptionDisabled(option) : false
      }
      isOptionEqualToValue={(option, value) => {
        return option.title === value.title;
      }}
      sx={{
        width: '400px',
        '& .MuiAutocomplete-listbox li[aria-disabled="true"]': {
          pointerEvents: 'inherit !important',
        },
        '& .MuiAutocomplete-listbox li[aria-disabled="true"]:hover, .MuiAutocomplete-listbox li[aria-disabled="true"]:focus':
          {
            background: 'white !important',
          },
        '& .MuiAutocomplete-listbox li[aria-disabled="true"]:active': {
          background: 'white !important',
          pointerEvents: 'none !important',
        },
      }}
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
        const isDisabled = isOptionDisabled ? isOptionDisabled(option) : false;
        return (
          <Tooltip
            title={isDisabled ? disabledTooltipTitle : ''}
            key={option.id}
          >
            <span>
              <li {...props}>
                <Stack direction="row">
                  {truncateString(option.title, 50)}
                </Stack>
              </li>
            </span>
          </Tooltip>
        );
      }}
    ></Autocomplete>
  );
}
