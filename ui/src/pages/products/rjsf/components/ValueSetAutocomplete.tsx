import React, { useState, useEffect } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { Concept } from '../../../../types/concept.ts';
import { useSearchConceptOntoServerByUrl } from '../../../../hooks/api/products/useSearchConcept.tsx';
import { convertFromValueSetExpansionContainsListToSnowstormConceptMiniList } from '../../../../utils/helpers/getValueSetExpansionContainsPt.ts';
import useApplicationConfigStore from '../../../../stores/ApplicationConfigStore.ts';
import {FieldProps} from "@rjsf/utils";

interface ValueSetAutocompleteProps extends FieldProps {
  label?: string;
  url: string;
  showDefaultOptions?: boolean;
  value: string | null; // Concept ID only
  onChange: (value: string | null) => void;
  disabled?: boolean;
  error?: string;
}

const ValueSetAutocomplete: React.FC<ValueSetAutocompleteProps> = ({
  idSchema,
  name,
  label,
  url,
  showDefaultOptions = false,
  value, // Concept ID only
  onChange,
  disabled = false,
  error,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Concept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const { applicationConfig } = useApplicationConfigStore();
  const { isLoading, data } = useSearchConceptOntoServerByUrl(
    inputValue,
    url && url.length > 0 ? url : undefined,
    showDefaultOptions,
  );

  // Update options when search data changes
  useEffect(() => {
    if (data?.expansion?.contains) {
      const concepts =
        convertFromValueSetExpansionContainsListToSnowstormConceptMiniList(
          data.expansion.contains,
          applicationConfig.fhirPreferredForLanguage,
        ); //TODO we may not need this conversion as we only need the code and display
      const uniqueOptions = Array.from(
        new Map(concepts.map(item => [item.conceptId, item])).values(),
      );
      setOptions(uniqueOptions);

      // If value exists and matches a fetched option, set selectedConcept
      if (value && !selectedConcept) {
        const matchingConcept = uniqueOptions.find(
          option => option.conceptId === value,
        );
        if (matchingConcept) {
          setSelectedConcept(matchingConcept);
          setInputValue(matchingConcept.pt.term);
        }
      }
    }
  }, [
    data,
    applicationConfig.fhirPreferredForLanguage,
    value,
    selectedConcept,
  ]);

  // Trigger API search with conceptId when value changes
  useEffect(() => {
    if (value && (!selectedConcept || selectedConcept.conceptId !== value)) {
      setInputValue(value); // Use conceptId as initial search term
    } else if (!value) {
      setSelectedConcept(null);
      setInputValue('');
    }
  }, [value, selectedConcept]);

  // Handle selection change
  const handleChange = (selectedValue: Concept | null) => {
    setSelectedConcept(selectedValue);
    onChange(selectedValue?.conceptId || null);
  };

  return (
    <Autocomplete
      data-testid={idSchema?.$id || name}
      loading={isLoading}
      options={disabled ? [] : options}
      getOptionLabel={option => option?.pt?.term || ''}
      value={selectedConcept} // Controlled by selectedConcept
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      onChange={(_, selectedValue) => handleChange(selectedValue as Concept)}
      isOptionEqualToValue={(option, val) =>
        option?.conceptId === val?.conceptId
      }
      renderOption={(props, option) => (
        <li {...props} key={option.conceptId}>
          {option.pt.term}
        </li>
      )}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          error={!!error}
          helperText={error}
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
        />
      )}
    />
  );
};

export default ValueSetAutocomplete;
