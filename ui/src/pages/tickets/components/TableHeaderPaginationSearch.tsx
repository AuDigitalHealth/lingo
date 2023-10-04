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
import useTicketStore from '../../../stores/TicketStore';
import {
  createQueryStringFromKeyValue,
  validateQueryParams,
} from '../../../utils/helpers/queryUtils';

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

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.value);
    setInputFieldValue(event.target.value);
    const queryString = createQueryStringFromKeyValue(event.target.value);
    setSearchQuery(queryString);
    if (validateQueryParams(queryString)) {
      updateQueryString(queryString);
    } else if (queryString === '') {
      updateQueryString('');
    }
  };

  const clearFields = () => {
    setInputFieldValue('');
    setSearchQuery('');
    updateQueryString('');
  };

  useEffect(() => {
    if (
      !searchQuery.includes('undefined') &&
      searchQuery !== undefined &&
      searchQuery !== ''
    ) {
      updateQueryString(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);
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
          id="standard-adornment-password"
          aria-describedby="ticket-search-helper-text"
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
