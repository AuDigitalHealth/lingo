import React, { useState, useEffect } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { Concept, ConceptMini } from '../../../../types/concept.ts';
import { useSearchConceptsByEcl } from '../../../../hooks/api/useInitializeConcepts.tsx';
import { FieldProps } from '@rjsf/utils';

const EclAutocomplete: React.FC<FieldProps<any, any>> = (props) => {

  if (!props) {
    return;
  }

  const { id, ecl, branch, value, isDisabled, formData, errorMessage, sx, onChange, schema, uiSchema } = props;
  const { showDefaultOptions } = uiSchema && uiSchema['ui:options'] || {};

  // const [suggestions, setSuggestions] = useState<any[]>([]);
  // const [input, setInput] = useState<string>(formData?.pt?.term || '');

  const [inputValue, setInputValue] = useState<string>(formData?.pt?.term || '');
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const { isLoading, allData } = useSearchConceptsByEcl(
    inputValue,
    ecl && ecl.length > 0 ? ecl : undefined,
    branch,
    showDefaultOptions as boolean,
  );

  const title = (schema && schema.title) || (uiSchema && uiSchema['ui:title']) || '';

  useEffect(() => {
    if (allData) {
      const uniqueOptions = Array.from(
        new Map(
          allData.map((item: Concept) => [item.conceptId, item]),
        ).values(),
      );
      setConcepts(uniqueOptions);
    }
  }, [allData]);

  useEffect(() => {
    if (value && concepts.length > 0) {
      const selectedOption = concepts.find(
          concept => concept.conceptId === value.conceptId,
      );
      setInputValue(selectedOption?.pt?.term || value?.pt?.term || '');
    } else if (value) {
      setInputValue(value?.pt?.term || '');
    }
  }, [value, concepts]);

  const handleProductChange = (selectedProduct: Concept | null) => {
    if (selectedProduct) {
      const conceptMini: ConceptMini = {
        conceptId: selectedProduct.conceptId || '',
        pt: selectedProduct.pt,
        fsn: selectedProduct.fsn,
      };
      setInputValue(selectedProduct.pt?.term || '');
      onChange(conceptMini);
    } else {
      setInputValue('');
      onChange(null);
    }
  };

  return (
      <span data-component-name="EclAutocomplete">
    <Autocomplete
      loading={isLoading}
      options={isDisabled ? [] : concepts}
      getOptionLabel={(concept: Concept) => concept?.pt?.term || ''}
      value={
        concepts.find(concept => concept.conceptId === value?.conceptId) ||
        value ||
        null
      }
      onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
      onChange={(event, selectedValue) =>
        handleProductChange(selectedValue as Concept)
      }
      isOptionEqualToValue={(concept: Concept, selectedValue: Concept) =>
          concept?.conceptId === selectedValue?.conceptId
      }
      renderOption={(props, concept: Concept) => (
        <li {...props} key={concept.conceptId}>
          {concept.pt?.term}
        </li>
      )}
      renderInput={params => (
        <TextField
          {...params}
          // error={!!errorMessage}
          // helperText={errorMessage || ' '} // Reserve space even when no error
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
          disabled={isDisabled}
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
