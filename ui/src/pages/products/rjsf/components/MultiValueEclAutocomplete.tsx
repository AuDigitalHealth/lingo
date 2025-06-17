import React, { useEffect, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { Concept, ConceptMini } from '../../../../types/concept.ts';
import { useSearchConceptsByEcl } from '../../../../hooks/api/useInitializeConcepts.tsx';
import { FieldProps } from '@rjsf/utils';

const MultiValueEclAutocomplete: React.FC<FieldProps<any, any>> = props => {
  const {
    id,
    ecl,
    branch,
    value,
    isDisabled,
    errorMessage,
    sx,
    onChange,
    schema,
    uiSchema,
  } = props;

  const { showDefaultOptions } = (uiSchema && uiSchema['ui:options']) || {};
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Concept[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<ConceptMini[]>(
    value || [],
  );
  const isThisDisabled = isDisabled || props.disabled || false;

  const { isLoading, allData } = useSearchConceptsByEcl(
    inputValue,
    ecl && ecl.length > 0 ? ecl : undefined,
    branch,
    showDefaultOptions as boolean,
  );

  const title = props?.title || schema?.title || uiSchema?.['ui:title'] || '';

  useEffect(() => {
    if (allData) {
      const uniqueOptions = Array.from(
        new Map(allData.map(item => [item.conceptId, item])).values(),
      );
      setOptions(uniqueOptions);
    }
  }, [allData]);

  useEffect(() => {
    if (!value || value.length === 0) {
      setSelectedConcepts([]);
      setInputValue('');
    } else if (
      value.length !== selectedConcepts.length ||
      !value.every(val =>
        selectedConcepts.some(sel => sel.conceptId === val.conceptId),
      )
    ) {
      // Prefer options for display (e.g., to get updated pt.term), fallback to value
      const matching =
        options.length > 0
          ? options.filter(opt =>
              value.some(val => val.conceptId === opt.conceptId),
            )
          : value;
      setSelectedConcepts(matching);
    }
  }, [value, options]);

  const handleChange = (selected: Concept[] | null) => {
    if (!selected) {
      setSelectedConcepts([]);
      onChange([]);
      return;
    }
    const conceptMinis: ConceptMini[] = selected.map(s => ({
      conceptId: s.conceptId,
      pt: s.pt,
      fsn: s.fsn,
    }));
    setSelectedConcepts(conceptMinis);
    onChange(conceptMinis);
  };

  return (
    <span
      data-component-name="MultiValueEclAutocomplete"
      style={{ width: 'inherit' }}
    >
      <Autocomplete
        multiple
        loading={isLoading}
        disabled={isThisDisabled}
        options={isDisabled ? [] : options}
        getOptionLabel={(option: Concept) => option?.pt?.term || ''}
        value={selectedConcepts}
        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
        onChange={(_, selected) => handleChange(selected as Concept[])}
        isOptionEqualToValue={(option: Concept, val: ConceptMini) =>
          option?.conceptId === val?.conceptId
        }
        renderOption={(props, option: Concept) => (
          <li {...props} key={option.conceptId}>
            {option.conceptId + ' - ' + (option?.pt?.term || '')}
          </li>
        )}
        renderInput={params => (
          <TextField
            {...params}
            data-test-id={id}
            label={title}
            error={!!errorMessage}
            helperText={errorMessage}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            sx={{
              '& .MuiFormHelperText-root': {
                m: 0,
                minHeight: '1em',
                color: errorMessage ? 'error.main' : 'text.secondary',
              },
            }}
          />
        )}
        sx={sx || { width: '100%' }}
      />
    </span>
  );
};

export default MultiValueEclAutocomplete;
