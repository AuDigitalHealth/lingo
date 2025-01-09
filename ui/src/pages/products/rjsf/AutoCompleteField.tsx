import React, { useState, useEffect } from 'react';
import { FieldProps } from '@rjsf/core';
import {
  Autocomplete,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchConceptsByEcl } from '../../../hooks/api/useInitializeConcepts';
import { Concept } from '../../../types/concept';

const AutoCompleteField = ({
                             schema,
                             uiSchema,
                             formData,
                             onChange,
                           }: FieldProps) => {
  const { branch, ecl, showDefaultOptions } = uiSchema['ui:options'] || {};
  const [inputValue, setInputValue] = useState(''); // For input field text
  const [options, setOptions] = useState<Concept[]>([]); // Options from the search API
  const { isLoading, allData } = useSearchConceptsByEcl(
      inputValue,
      ecl,
      branch,
      showDefaultOptions,
  );

  // Title from schema or uiSchema
  const title = schema.title || uiSchema['ui:title'];

  // Get the disabled option from uiSchema (defaults to false if not specified)
  const isDisabled = uiSchema['ui:options']?.disabled || false;

  // Update options when search results change
  useEffect(() => {
    if (allData) {
      const uniqueOptions = Array.from(
          new Map(allData.map(item => [item.conceptId, item])).values(),
      );
      setOptions(uniqueOptions);
    }
  }, [allData]);

  // Sync inputValue when formData changes
  useEffect(() => {
    if (formData) {
      const selectedOption = options.find(
          option => option.conceptId === formData.conceptId,
      );
      setInputValue(selectedOption?.pt.term || ''); // Set term from selected option
    }
  }, [formData, options]);

  // Handle option selection
  const handleProductChange = (selectedProduct: Concept | null) => {
    if (selectedProduct) {
      onChange(selectedProduct); // Update formData
      setInputValue(selectedProduct.pt.term); // Set input text
    } else {
      onChange(null); // Clear formData
      setInputValue(''); // Clear input field
    }
  };

  return (
      <div>
        {/* Render title */}
        {title && (
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
        )}

        {/* Autocomplete field */}
        <Autocomplete
            loading={isLoading}
            options={options}
            getOptionLabel={option => option?.pt?.term || ''}
            value={
                options.find(option => option.conceptId === formData?.conceptId) ||
                null
            }
            onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
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
                />
            )}
            disabled={isDisabled} // Disable the autocomplete based on the `disabled` flag
        />
      </div>
  );
};

export default AutoCompleteField;
