import React, { useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  Chip,
  CircularProgress,
  TextField,
  Tooltip,
} from '@mui/material';
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
    info,
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

  // Helper function to check if a concept needs attention
  const conceptNeedsAttention = (concept: ConceptMini) => {
    return concept && concept.pt?.term && !concept.conceptId;
  };

  // Check if any concept needs attention for overall component error state
  const anyConceptNeedsAttention = selectedConcepts.some(conceptNeedsAttention);

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
            const needsAttention = conceptNeedsAttention(option);
            const { key, ...chipProps } = getTagProps({ index });

            return (
              <Tooltip
                key={option.conceptId}
                title={`${option.conceptId} - ${option.pt?.term}${needsAttention ? ' (Please search for and select a valid option)' : ''}`}
              >
                <Chip
                  label={option.pt?.term || ''}
                  {...chipProps}
                  color={needsAttention ? 'error' : 'default'}
                  sx={{
                    ...(needsAttention && {
                      backgroundColor: 'error.light',
                      color: 'error.contrastText',
                      '&:hover': {
                        backgroundColor: 'error.main',
                      },
                      '& .MuiChip-deleteIcon': {
                        color: 'error.contrastText',
                        '&:hover': {
                          color: 'error.contrastText',
                        },
                      },
                    }),
                  }}
                />
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
            error={!!errorMessage || anyConceptNeedsAttention}
            helperText={
              errorMessage
                ? errorMessage
                : anyConceptNeedsAttention
                  ? 'One or more selections need attention - please search for and select valid options'
                  : info
            }
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
                color:
                  errorMessage || anyConceptNeedsAttention
                    ? 'error.main'
                    : 'text.secondary',
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
