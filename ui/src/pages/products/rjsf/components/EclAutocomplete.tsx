import React, {useEffect, useState} from 'react';
import {Autocomplete, CircularProgress, TextField} from '@mui/material';
import {Concept, ConceptMini} from '../../../../types/concept.ts';
import {useSearchConceptsByEcl} from '../../../../hooks/api/useInitializeConcepts.tsx';
import {FieldProps} from '@rjsf/utils';

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
    uiSchema,
  } = props;
  const { showDefaultOptions } = (uiSchema && uiSchema['ui:options']) || {};

  let isThisDisabled = isDisabled || props.disabled || false;
  useEffect(() => {
    isThisDisabled = isDisabled || props.disabled || false;
    // @ts-ignore
    setInputValue(null);
  }, [isDisabled]);

  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Concept[]>([]);
  const { isLoading, allData } = useSearchConceptsByEcl(
    inputValue,
    ecl && ecl?.length > 0 ? ecl : undefined,
    branch,
    showDefaultOptions as boolean,
  );

  const title =
    (props && props.title) ||
    (schema && schema.title) ||
    (uiSchema && uiSchema['ui:title']) ||
    '';

  useEffect(() => {
    if (allData) {
      const uniqueOptions = Array.from(
        new Map(
          allData.map((item: Concept) => [item.conceptId, item]),
        ).values(),
      );
      setOptions(uniqueOptions);
    }
  }, [allData]);

  useEffect(() => {
    if (value && options?.length > 0) {
      const selectedOption = options.find(
        option => option.conceptId === value.conceptId,
      );
      setInputValue(selectedOption?.pt?.term || value?.pt?.term || '');
    } else if (value) {
      setInputValue(value?.pt?.term || '');
    }
  }, [value, options]);

  const handleProductChange = (selectedProduct: Concept | null) => {
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

  return (
    <span data-component-name="EclAutocomplete">
      <Autocomplete
        sx={{ width: '100%' }}
        loading={isLoading}
        disabled={isThisDisabled}
        options={isDisabled ? [] : options}
        getOptionLabel={(option: Concept) => option?.pt?.term || ''}
        value={
          options.find(option => option.conceptId === value?.conceptId) ||
          value ||
          null
        }
        onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
        onChange={(event, selectedValue) =>
          handleProductChange(selectedValue as Concept)
        }
        isOptionEqualToValue={(option: Concept, selectedValue: Concept) =>
          option?.conceptId === selectedValue?.conceptId
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
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            disabled={isThisDisabled}
            sx={{
              '& .MuiFormHelperText-root': {
                m: 0, // Remove margin to keep layout tight
                minHeight: '1em', // Reserve consistent space
                color: errorMessage ? 'error.main' : 'text.secondary', // Change color based on errorMessage
              },
            }}
          />
        )}
        sx={sx} // Pass external styles
      />
    </span>
  );
};

export default EclAutocomplete;
