import { useState, useEffect, useRef } from 'react';
import { FieldProps } from '@rjsf/utils';
import { Concept } from '../../../../types/concept.ts';
import useApplicationConfigStore from '../../../../stores/ApplicationConfigStore.ts';
import { useSearchConceptOntoServerByUrl } from '../../../../hooks/api/products/useSearchConcept.tsx';
import { convertFromValueSetExpansionContainsListToSnowstormConceptMiniList } from '../../../../utils/helpers/getValueSetExpansionContainsPt.ts';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';

interface MultiValueValueSetAutocompleteProps extends FieldProps {
  label?: string;
  url: string;
  showDefaultOptions?: boolean;
  value: Concept[] | null; // Array of Concept objects
  onChange: (value: Concept[]) => void;
  disabled?: boolean;
  error?: string;
}

export const MultiValueValueSetAutocomplete: React.FC<
  MultiValueValueSetAutocompleteProps
> = ({
  idSchema,
  name,
  label,
  url,
  showDefaultOptions = false,
  value, // Array of Concept objects
  onChange,
  disabled = false,
  error,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Concept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<Concept[]>(
    value || [],
  );
  const isTypingRef = useRef(false);
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
        );
      const uniqueOptions = Array.from(
        new Map(concepts.map(item => [item.conceptId, item])).values(),
      );
      setOptions(uniqueOptions);

      // If value exists, prefer matching concepts from options for display
      if (value && value.length > 0) {
        const matchingConcepts = uniqueOptions.filter(option =>
          value.some(val => val.conceptId === option.conceptId),
        );
        // Only update selectedConcept if options provide new matches
        if (matchingConcepts.length > 0) {
          setSelectedConcept(matchingConcepts);
        }
      }
    }
  }, [data, applicationConfig.fhirPreferredForLanguage, value]);

  // Sync selectedConcept with value when value or options change
  useEffect(() => {
    if (!value || value.length === 0) {
      setSelectedConcept([]);
      if (!isTypingRef.current) {
        setInputValue('');
      }
    } else if (
      value.length !== selectedConcept.length ||
      !value.every(val =>
        selectedConcept.some(concept => concept.conceptId === val.conceptId),
      )
    ) {
      // Prefer options for display (e.g., to get pt.term), but fallback to value if no matches
      const matchingConcepts =
        options.length > 0
          ? options.filter(option =>
              value.some(val => val.conceptId === option.conceptId),
            )
          : value;
      setSelectedConcept(matchingConcepts);
    }
  }, [value, options]);

  // Handle selection change
  const handleChange = (selectedValue: Concept[] | null) => {
    isTypingRef.current = false; // Reset typing flag
    if (!selectedValue) {
      setSelectedConcept([]);
      onChange([]);
      setInputValue(''); // Clear input after selection
      return;
    }
    setSelectedConcept(selectedValue);
    onChange(selectedValue);
    setInputValue(''); // Clear input after selection
  };

  return (
    <Autocomplete
      multiple
      disabled={disabled}
      sx={{ width: '100%' }}
      data-testid={idSchema?.$id || name}
      loading={isLoading}
      options={disabled ? [] : options}
      getOptionLabel={option => option?.pt?.term || ''}
      value={selectedConcept} // Controlled by selectedConcept
      inputValue={inputValue} // Controlled input value
      onInputChange={(_, newInputValue, reason) => {
        // Only update inputValue on user input
        if (reason === 'input') {
          isTypingRef.current = true;
          setInputValue(newInputValue);
        }
      }}
      onChange={(_, selectedValue) => handleChange(selectedValue as Concept[])}
      isOptionEqualToValue={(option, val) =>
        option?.conceptId === val?.conceptId ||
        (option?.pt?.term && val?.pt?.term && option.pt.term === val.pt.term)
      }
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        return (
          <li {...otherProps} key={option.conceptId}>
            {option.pt.term}
          </li>
        );
      }}
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

export default MultiValueValueSetAutocomplete;
