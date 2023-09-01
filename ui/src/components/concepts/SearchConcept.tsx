import React, { useEffect, useState } from 'react';

import { Autocomplete } from '@mui/lab';
import { Grid, TextField } from '@mui/material';
import { Concept } from '../../types/concept.ts';
import useDebounce from '../../hooks/useDebounce.tsx';
import conceptService from '../../api/ConceptService.ts';

export default function SearchConcept() {
  const [results, setResults] = useState<Concept[]>([]);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(inputValue, 500);
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const conceptsResponse = await conceptService.searchConcept(inputValue);
        setResults(conceptsResponse.items);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    }

    if (debouncedSearch && debouncedSearch.length > 2) {
      void fetchData().then(r => r);
    }
  }, [debouncedSearch]);

  return (
    <Grid item xs={12} sm={12} md={12} lg={12}>
      <Autocomplete
        sx={{ width: '400px' }}
        open={open}
        getOptionLabel={option =>
          option.pt.term + '[' + option.conceptId + ']' || ''
        }
        filterOptions={x => x}
        autoComplete
        aria-valuemin={3}
        onOpen={() => {
          // only open when in focus and inputValue is not empty
          if (inputValue) {
            setOpen(true);
          }
        }}
        onClose={() => setOpen(false)}
        inputValue={inputValue}
        onInputChange={(e, value, reason) => {
          setInputValue(value);

          // only open when inputValue is not empty after the user typed something
          if (!value) {
            setOpen(false);
          }
        }}
        options={results}
        renderInput={params => (
          <TextField
            {...params}
            label="Search for a concept"
            variant="outlined"
          />
        )}
      />
    </Grid>
  );
}
