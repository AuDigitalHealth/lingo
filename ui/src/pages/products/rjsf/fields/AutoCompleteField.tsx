import React, { useState, useEffect } from 'react';
import { FieldProps } from '@rjsf/core';
import {
  Autocomplete,
  CircularProgress,
  TextField,
  Box,
  FormHelperText,
} from '@mui/material';
import { useSearchConceptsByEcl } from '../../../../hooks/api/useInitializeConcepts.tsx';
import { Concept, ConceptMini } from '../../../../types/concept.ts';
import { SetExtendedEclButton } from '../../components/SetExtendedEclButton.tsx'; // Import your button component

const AutoCompleteField = ({
  schema,
  uiSchema,
  formData,
  onChange,
  rawErrors, // Access rawErrors to get validation errors
}: FieldProps) => {
  const { branch, ecl, showDefaultOptions, extendedEcl } =
    uiSchema['ui:options'] || {}; // Get extendedEcl from uiSchema['ui:options']
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Concept[]>([]);
  const [localExtendedEcl, setLocalExtendedEcl] = useState(false); // Local state to toggle extended ECL
  const currentEcl = localExtendedEcl ? extendedEcl : ecl; // Determine which ECL to use

  const { isLoading, allData } = useSearchConceptsByEcl(
    inputValue,
    currentEcl && currentEcl.length > 0 ? currentEcl : undefined, // Use extended ECL if `localExtendedEcl` is true, otherwise fallback to ecl
    branch,
    showDefaultOptions,
  );

  const title = schema.title || uiSchema['ui:title'];
  const isRequired = uiSchema['ui:required'] || schema?.title?.includes('*');
  const isDisabled = uiSchema['ui:options']?.disabled || false;

  let errorMessage = '';

  // Fallback to rawErrors message if schema errorMessage doesn't provide one
  if (rawErrors && rawErrors[0]) {
    errorMessage = rawErrors[0].message || '';
  }

  // Update options when search results change
  useEffect(() => {
    if (allData) {
      const uniqueOptions = Array.from(
        new Map(allData.map(item => [item.conceptId, item])).values(),
      );
      setOptions(uniqueOptions);
    }
  }, [allData]);

  // Sync inputValue and selected option when formData or options change
  useEffect(() => {
    if (formData && options.length > 0) {
      const selectedOption = options.find(
        option => option.conceptId === formData.conceptId,
      );
      setInputValue(selectedOption?.pt.term || formData?.pt?.term || '');
    } else if (formData) {
      // If options are not yet loaded, fallback to formData value
      setInputValue(formData?.pt?.term || '');
    }
  }, [formData, options]);

  // Handle option selection
  const handleProductChange = (selectedProduct: Concept | null) => {
    if (selectedProduct) {
      const conceptMini: ConceptMini = {
        conceptId: selectedProduct.conceptId || '',
        pt: selectedProduct.pt,
      };
      onChange(conceptMini);
      setInputValue(selectedProduct.pt.term);
    } else {
      onChange(null);
      setInputValue('');
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1}>
        {/* Autocomplete with 90% width */}
        <Box flex={50}>
          <Autocomplete
            loading={isLoading}
            options={isDisabled ? [] : options} // Show no options when disabled
            getOptionLabel={option => option?.pt?.term || ''}
            value={
              options.find(
                option => option.conceptId === formData?.conceptId,
              ) ||
              formData ||
              null
            }
            onInputChange={(event, newInputValue) =>
              setInputValue(newInputValue)
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
                error={!!errorMessage} // Apply error styling
                helperText={errorMessage} // Display error message
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
                disabled={isDisabled} // Disable input
              />
            )}
          />
        </Box>

        {/* Conditionally render SetExtendedEclButton based on extendedEcl from uiSchema */}
        {extendedEcl && (
          <Box flex={1}>
            <SetExtendedEclButton
              setExtendedEcl={setLocalExtendedEcl}
              extendedEcl={localExtendedEcl}
              disabled={isDisabled} // Disable button if the field is disabled
            />
          </Box>
        )}
      </Box>

      {/* Error message below Autocomplete */}
      {errorMessage && <FormHelperText error>{errorMessage}</FormHelperText>}
    </Box>
  );
};

export default AutoCompleteField;
