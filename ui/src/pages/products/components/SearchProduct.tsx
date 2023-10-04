import React, { useEffect, useState } from 'react';

import { Autocomplete } from '@mui/material';
import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  TextField,
} from '@mui/material';
import { Concept } from '../../../types/concept.ts';
import useDebounce from '../../../hooks/useDebounce.tsx';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import MedicationIcon from '@mui/icons-material/Medication';
import { Stack } from '@mui/system';
import IconButton from '../../../components/@extended/IconButton.tsx';
import { Link } from 'react-router-dom';
import { isFsnToggleOn } from '../../../utils/helpers/conceptUtils.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useSearchConcept } from '../../../hooks/api/products/useSearchConcept.tsx';

export default function SearchProduct() {
  const localFsnToggle = isFsnToggleOn;
  const [results, setResults] = useState<Concept[]>([]);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [fsnToggle, setFsnToggle] = useState(localFsnToggle);
  const [searchFilter, setSearchFilter] = useState('Term');
  const filterTypes = ['Term', 'Artg Id', 'Sct Id'];

  const handleTermDisplayToggleChange = () => {
    setFsnToggle(!fsnToggle);
  };
  const handleSearchFilter = (event: SelectChangeEvent) => {
    setSearchFilter(event.target.value);
  };

  const checkItemAlreadyExists = (search: string): boolean => {
    const result = results.filter(
      concept =>
        search.includes(concept.conceptId) ||
        search.includes(concept.pt.term) ||
        search.includes(concept.fsn.term),
    );
    return result.length > 0 ? true : false;
  };
  const getTermDisplay = (concept: Concept): string => {
    return fsnToggle ? concept.fsn.term : concept.pt.term;
  };
  const debouncedSearch = useDebounce(inputValue, 400);
  const { isLoading, data, error } = useSearchConcept(
    searchFilter,
    debouncedSearch,
    checkItemAlreadyExists,
  );

  useEffect(() => {
    if (data !== undefined) {
      localStorage.setItem('fsn_toggle', fsnToggle.toString());
      setResults(data);
    }
  }, [data]);

  return (
    <Grid item xs={12} sm={12} md={12} lg={12}>
      <Stack direction="row" spacing={2} alignItems="center" paddingLeft="1rem">
        <FormControl>
          <InputLabel id="demo-simple-select-label">Search Filter</InputLabel>
          <Select
            sx={{
              width: '120px',
              height: '36px',
              borderRadius: '4px 0px 0px 4px',
            }}
            // size='small'
            labelId="concept-search-filter-label"
            value={searchFilter}
            label="Filter"
            onChange={handleSearchFilter}
          >
            {filterTypes.map(type => (
              <MenuItem
                key={type}
                value={type}
                onKeyDown={e => e.stopPropagation()}
              >
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Autocomplete
          loading={isLoading}
          sx={{
            width: '400px',
            borderRadius: '0px 4px 4px 0px',
            marginLeft: '0px !important',
          }}
          open={open}
          getOptionLabel={option =>
            getTermDisplay(option) + '[' + option.conceptId + ']' || ''
          }
          filterOptions={x => x}
          autoComplete
          aria-valuemin={3}
          onOpen={() => {
            if (inputValue) {
              setOpen(true);
            }
          }}
          onClose={() => setOpen(false)}
          inputValue={inputValue}
          onInputChange={(e, value) => {
            setInputValue(value);
            if (!value) {
              setOpen(false);
              setResults([]);
            }
          }}
          options={results}
          renderInput={params => (
            <TextField
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '0px 4px 4px 0px',
                  height: '36px',
                },
              }}
              {...params}
              label="Search for a concept"
              variant="outlined"
              size="small"
            />
          )}
          renderOption={(props, option, { selected }) => (
            <li {...props}>
              <Link
                to={`/dashboard/products/${option.conceptId}`}
                style={{ textDecoration: 'none', color: '#003665' }}
              >
                <Stack direction="row" spacing={2}>
                  <Box
                    component={MedicationIcon}
                    sx={{
                      width: 20,
                      height: 20,
                      flexShrink: 0,
                      borderRadius: '3px',
                      mr: 1,
                      mt: '2px',
                    }}
                  />
                  <Box
                    sx={{
                      flexGrow: 1,
                      '& span': {
                        color: '#586069',
                      },
                    }}
                  >
                    {getTermDisplay(option)}
                    <br />
                    <span>{option.conceptId}</span>
                  </Box>
                  <Box
                    component={CloseIcon}
                    sx={{ opacity: 0.6, width: 18, height: 18 }}
                    style={{
                      visibility: selected ? 'visible' : 'hidden',
                    }}
                  />
                </Stack>
              </Link>
            </li>
          )}
        />
        <IconButton
          variant={fsnToggle ? 'contained' : 'outlined'}
          color="primary"
          aria-label="toggle-task-menu"
          onClick={handleTermDisplayToggleChange}
        >
          <span style={{ fontSize: 'small' }}>{fsnToggle ? 'FSN' : 'PT'} </span>
        </IconButton>
      </Stack>
    </Grid>
  );
}
