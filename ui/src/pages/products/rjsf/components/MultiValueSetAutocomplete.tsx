import { useState, useEffect, useRef } from 'react';
import { FieldProps } from '@rjsf/utils';
import { Concept } from '../../../../types/concept.ts';
import useApplicationConfigStore from '../../../../stores/ApplicationConfigStore.ts';
import { useSearchConceptOntoServerByUrl } from '../../../../hooks/api/products/useSearchConcept.tsx';
import { convertFromValueSetExpansionContainsListToSnowstormConceptMiniList } from '../../../../utils/helpers/getValueSetExpansionContainsPt.ts';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { Tooltip } from '@mui/material';
import { Chip } from '@mui/material';

interface MultiValueValueSetAutocompleteProps extends FieldProps {
  label?: string;
  url: string;
  showDefaultOptions?: boolean;
  value: Concept[] | null; // Array of Concept objects
  onChange: (value: Concept[]) => void;
  disabled?: boolean;
  error?: string;
  info?: string;
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
  info,
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

  // Helper function to check if a concept needs attention
  const conceptNeedsAttention = (concept: Concept) => {
    return concept && concept.pt?.term && !concept.conceptId;
  };

  // Check if any concept needs attention for overall component error state
  const anyConceptNeedsAttention = selectedConcept.some(conceptNeedsAttention);

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
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const needsAttention = conceptNeedsAttention(option);
          const tagProps = getTagProps({ index });

          return (
            <Tooltip
              key={option.conceptId}
              title={`${option.conceptId} - ${option.pt?.term}${needsAttention ? ' (Please search for and select a valid option)' : ''}`}
            >
              <Chip
                label={option.pt?.term || ''}
                {...tagProps}
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
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        return (
          <li {...otherProps} key={option.conceptId}>
            {/* Code is added to the term, some ValueSets have terms that are only distinquished by the code */}
            {option.conceptId} - {option.pt.term}
          </li>
        );
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          error={!!error || anyConceptNeedsAttention}
          helperText={
            error
              ? error
              : anyConceptNeedsAttention
                ? 'One or more selections need attention - please search for and select valid options'
                : info
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
                error || anyConceptNeedsAttention
                  ? 'error.main'
                  : 'text.secondary',
            },
          }}
        />
      )}
    />
  );
};

export default MultiValueValueSetAutocomplete;
