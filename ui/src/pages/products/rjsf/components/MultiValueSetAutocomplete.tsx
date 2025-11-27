import { useState, useEffect, useRef } from 'react';
import { FieldProps } from '@rjsf/utils';
import { Concept } from '../../../../types/concept.ts';
import useApplicationConfigStore from '../../../../stores/ApplicationConfigStore.ts';
import {
  useSearchConceptOntoServerByUrl,
  useValidateConceptsInValueSet,
} from '../../../../hooks/api/products/useSearchConcept.tsx';
import { convertFromValueSetExpansionContainsListToSnowstormConceptMiniList } from '../../../../utils/helpers/getValueSetExpansionContainsPt.ts';
import {
  Autocomplete,
  CircularProgress,
  createFilterOptions,
  TextField,
} from '@mui/material';
import { Tooltip } from '@mui/material';
import { Chip } from '@mui/material';
import { filterOptionsByTermAndCode } from '../../../../utils/helpers/conceptUtils.ts';
import { isSctId } from '../../../../utils/helpers/conceptUtils.ts';

interface MultiValueValueSetAutocompleteProps extends FieldProps {
  label?: string;
  url: string;
  showDefaultOptions?: boolean;
  value: Concept[] | null;
  onChange: (value: Concept[]) => void;
  disabled?: boolean;
  error?: string;
  info?: string;
  codeSystem?: string;
}

export const MultiValueValueSetAutocomplete: React.FC<
  MultiValueValueSetAutocompleteProps
> = ({
  idSchema,
  name,
  label,
  url,
  showDefaultOptions = false,
  value,
  onChange,
  disabled = false,
  error,
  info,
  codeSystem,
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

  const { validationResults, isValidating } = useValidateConceptsInValueSet(
    value,
    url,
    codeSystem,
  );

  // Helper function to check if a concept needs attention
  const conceptNeedsAttention = (concept: Concept) => {
    // Missing conceptId
    if (concept && concept.pt?.term && !concept.conceptId) {
      return true;
    }

    // Non-SCT code that needs validation
    if (concept.conceptId && !isSctId(concept.conceptId) && url) {
      const validationResult = validationResults[concept.conceptId];

      // Needs attention if still validating or validation failed
      if (validationResult) {
        return validationResult.isLoading || !validationResult.isValid;
      }

      // If we don't have a validation result yet, assume it needs attention
      return true;
    }

    return false;
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

      if (value && value.length > 0) {
        const matchingConcepts = uniqueOptions.filter(option =>
          value.some(val => val.conceptId === option.conceptId),
        );
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
    isTypingRef.current = false;
    if (!selectedValue) {
      setSelectedConcept([]);
      onChange([]);
      setInputValue('');
      return;
    }
    setSelectedConcept(selectedValue);
    onChange(selectedValue);
    setInputValue('');
  };

  return (
    <Autocomplete
      multiple
      filterOptions={filterOptionsByTermAndCode}
      disabled={disabled}
      sx={{ width: '100%' }}
      data-testid={idSchema?.$id || name}
      loading={isLoading}
      options={disabled ? [] : options}
      getOptionLabel={option => option?.pt?.term || ''}
      value={selectedConcept}
      inputValue={inputValue}
      onInputChange={(_, newInputValue, reason) => {
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
          const validationResult = option.conceptId
            ? validationResults[option.conceptId]
            : undefined;
          const isValidatingThis = validationResult?.isLoading ?? false;
          const tagProps = getTagProps({ index });

          const conceptId = option.conceptId || 'unknown';
          const term = option.pt?.term || 'No term available';

          let tooltipMessage = `${conceptId} - ${term}`;
          if (isValidatingThis) {
            tooltipMessage += ' (Validating...)';
          } else if (
            needsAttention &&
            validationResult &&
            !validationResult.isValid
          ) {
            tooltipMessage +=
              ' (Invalid code - please search for and select a valid option)';
          } else if (needsAttention) {
            tooltipMessage += ' (Please search for and select a valid option)';
          }

          return (
            <Tooltip
              key={option.conceptId || `concept-${index}`}
              title={tooltipMessage}
            >
              <Chip
                label={term}
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
                ? isValidating
                  ? 'Validating selections...'
                  : 'One or more selections are invalid - please search for and select valid options'
                : info
          }
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading || isValidating ? (
                  <CircularProgress size={20} />
                ) : null}
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
