import React, { useEffect, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { Concept, ConceptMini } from '../../../../types/concept.ts';
import { useSearchConceptsByEcl } from '../../../../hooks/api/useInitializeConcepts.tsx';
import { FieldProps } from '@rjsf/utils';

const EclAutocomplete: React.FC<FieldProps<any, any>> = props => {
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
    showDefaultOptions,
    uiSchema,
  } = props;

  const [inputValue, setInputValue] = useState<string>(value?.pt?.term || '');
  const [options, setOptions] = useState<Concept[]>(
    value ? [value as Concept] : [],
  );

  const disabled = isDisabled || props.disabled || false;

  // Clear state when disabled
  useEffect(() => {
    if (disabled) {
      setInputValue('');
      setOptions([]);
      if (value) {
        onChange(null);
      }
    }
  }, [disabled, onChange, value]);

  const { isLoading, allData } = useSearchConceptsByEcl(
    inputValue,
    ecl && ecl.length > 0 && !disabled ? ecl : undefined,
    branch,
    (showDefaultOptions as boolean) && !disabled,
  );

  const title = props?.title || schema?.title || uiSchema?.['ui:title'] || '';

  useEffect(() => {
    if (disabled) return;
    let uniqueOptions: Concept[] = [];
    if (allData) {
      uniqueOptions = Array.from(
        new Map(allData.map(item => [item.conceptId, item])).values(),
      );
    }
    if (
      value?.conceptId &&
      !uniqueOptions.some(opt => opt.conceptId === value.conceptId)
    ) {
      uniqueOptions.push(value as Concept);
    }
    setOptions(uniqueOptions);
  }, [allData, disabled, value]);

  useEffect(() => {
    if (disabled || !value) return;
    const newTerm = value?.pt?.term || '';
    setInputValue(prev => (prev !== newTerm ? newTerm : prev));
  }, [value?.conceptId, disabled]);

  const handleProductChange = (selectedProduct: Concept | null) => {
    if (disabled) return;
    if (selectedProduct) {
      const conceptMini: ConceptMini = {
        conceptId: selectedProduct.conceptId || '',
        pt: selectedProduct.pt,
        fsn: selectedProduct.fsn,
      };
      onChange(conceptMini);
      setInputValue(selectedProduct.pt?.term || '');
    } else {
      onChange(null);
      setInputValue('');
    }
  };

  const needsAttention = value && value.pt?.term && !value.conceptId;

  return (
    <span data-component-name="EclAutocomplete" style={{ width: 'inherit' }}>
      <Autocomplete
        loading={isLoading}
        disabled={disabled}
        options={disabled ? [] : options}
        getOptionLabel={(option: Concept) => option?.pt?.term || ''}
        value={
          options.find(option => option.conceptId === value?.conceptId) || null
        }
        inputValue={inputValue}
        onInputChange={(event, newInputValue) =>
          !disabled && setInputValue(newInputValue)
        }
        onChange={(event, selectedValue) =>
          handleProductChange(selectedValue as Concept)
        }
        isOptionEqualToValue={(option, selectedValue) =>
          option?.conceptId === selectedValue?.conceptId
        }
        renderOption={(props, option) => (
          <li {...props} key={option.conceptId}>
            {option.pt.term}
          </li>
        )}
        renderInput={params => (
          <TextField
            {...params}
            data-test-id={id}
            label={title}
            error={!!errorMessage || needsAttention}
            helperText={
              needsAttention
                ? 'Please search for and select a valid option'
                : errorMessage || ''
            }
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            disabled={disabled}
            sx={{
              '& .MuiFormHelperText-root': {
                m: 0,
                minHeight: '1em',
                color:
                  errorMessage || needsAttention
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

export default EclAutocomplete;
