import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, Chip, CircularProgress, TextField, Tooltip } from '@mui/material';
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
    showDefaultOptions,
  } = props;

  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Concept[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<ConceptMini[]>(
    value || [],
  );
  const isThisDisabled = isDisabled || props.disabled || false;

  const isTypingRef = useRef(false);

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
    const safeValue: ConceptMini[] = value || [];

    // Only update selected concepts if they differ
    const isDifferent =
      safeValue.length !== selectedConcepts.length ||
      !safeValue.every(v =>
        selectedConcepts.some(s => s.conceptId === v.conceptId),
      );

    if (isDifferent) {
      setSelectedConcepts(safeValue);
    }
  }, [value]);

  const handleChange = (selected: Concept[] | null) => {
    isTypingRef.current = false;
    if (!selected) {
      setSelectedConcepts([]);
      onChange([]);
      setInputValue(''); // Clear input value after selection
      return;
    }

    const conceptMinis: ConceptMini[] = selected.map(s => ({
      conceptId: s.conceptId,
      pt: s.pt,
      fsn: s.fsn,
    }));

    setSelectedConcepts(conceptMinis);
    onChange(conceptMinis);
    setInputValue('');
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
        options={isThisDisabled ? [] : options}
        getOptionLabel={(option: Concept) => option?.pt?.term || ''}
        value={selectedConcepts}
        inputValue={inputValue}
        onInputChange={(_, newInputValue, reason) => {
          // Only set typing flag if it's user input
          if (reason === 'input') {
            isTypingRef.current = true;
            setInputValue(newInputValue);
          }
        }}
        onChange={(_, selected) => handleChange(selected as Concept[])}
        isOptionEqualToValue={(option: Concept, val: ConceptMini) =>
          option?.conceptId === val?.conceptId
        }
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...chipProps } = getTagProps({ index });
            return (
              <Tooltip
                key={option.conceptId}
                title={`${option.conceptId} - ${option.pt?.term}`}
              >
                <Chip label={option.pt?.term || ''} {...chipProps} />
              </Tooltip>
            );
          })
        }
        renderOption={(props, option: Concept) => (
          <li {...props} key={option.conceptId}>
            {option.pt.term}
          </li>
        )}
        renderInput={params => (
          <TextField
            {...params}
            data-test-id={id}
            label={title}
            error={!!errorMessage}
            helperText={errorMessage}
            disabled={isThisDisabled}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading && <CircularProgress size={20} />}
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
