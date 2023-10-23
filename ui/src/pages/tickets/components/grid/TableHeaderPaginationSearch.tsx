import { CSSObject } from '@emotion/react';
import { Clear, Search } from '@mui/icons-material';
import {
  Typography,
  Stack,
  Box,
  InputAdornment,
  Input,
  FormControl,
  FormHelperText,
  IconButton,
} from '@mui/material';
import { ChangeEvent, useEffect, useState } from 'react';
import useTicketStore from '../../../../stores/TicketStore';
import {
  createQueryStringFromKeyValue,
  validateQueryParams,
} from '../../../../utils/helpers/queryUtils';
import useDebounce from '../../../../hooks/useDebounce';

interface TableHeadersPaginationSearchProps {
  tableName: string;
}
export function TableHeadersPaginationSearch({
  tableName,
}: TableHeadersPaginationSearchProps) {
  return (
    <Stack direction={'row'} sx={{ padding: '1.5rem', alignItems: 'center' }}>
      <Typography
        variant="h1"
        sx={{ paddingRight: '1em', fontSize: '1.25rem' }}
      >
        {tableName}
      </Typography>
      <SearchBar sx={{ marginLeft: 'auto' }} />
    </Stack>
  );
}

function SearchBar(sx: CSSObject) {
  const { updateQueryString } = useTicketStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [inputFieldValue, setInputFieldValue] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 1000);

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setInputFieldValue(event.target.value);
    const queryString = createQueryStringFromKeyValue(event.target.value);
    // setSearchQuery(queryString);
    if (validateQueryParams(queryString)) {
      setSearchQuery(queryString);
    } else {
      setSearchQuery('');
    }
  };

  const clearFields = () => {
    setInputFieldValue('');
    setSearchQuery('');
    updateQueryString('');
  };

  useEffect(() => {
    if (
      !debouncedSearch.includes('undefined') &&
      debouncedSearch !== undefined
    ) {
      updateQueryString(debouncedSearch);
    }
    if (debouncedSearch === '') {
      updateQueryString(debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);
  return (
    <Box
      sx={{
        p: 0.5,
        pb: 0,
        marginLeft: 'auto',
      }}
    >
      <FormControl variant="standard" sx={{ m: 1, mt: 3, width: '50ch' }}>
        <Input
          id="ticket-search"
          aria-describedby="ticket-search-helper-text"
          placeholder="title:paracetamol, state.label:to do"
          startAdornment={
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              <IconButton onClick={clearFields}>
                <Clear />
              </IconButton>
            </InputAdornment>
          }
          type="text"
          onChange={handleSearch}
          value={inputFieldValue}
        />
        <FormHelperText id="ticket-search-helper-text">
          {searchQuery !== '' ? searchQuery : 'Search'}
        </FormHelperText>
      </FormControl>
    </Box>
  );
}
