import React, { useState, useEffect } from 'react';
import { Autocomplete, CircularProgress, TextField, Box } from '@mui/material';
import { Concept, ConceptMini } from '../../../../types/concept.ts';
import { useSearchConceptOntoServerByUrl } from '../../../../hooks/api/products/useSearchConcept.tsx';
import { convertFromValueSetExpansionContainsListToSnowstormConceptMiniList } from '../../../../utils/helpers/getValueSetExpansionContainsPt.ts';
import useApplicationConfigStore from '../../../../stores/ApplicationConfigStore.ts';

interface ValueSetAutocompleteProps {
  label?: string;
  url: string;
  showDefaultOptions?: boolean;
  value: ConceptMini | null;
  onChange: (value: ConceptMini | null) => void;
  disabled?: boolean;
  error?: string;
}

const ValueSetAutocomplete: React.FC<ValueSetAutocompleteProps> = ({
  label,
  url,
  showDefaultOptions = false,
  value,
  onChange,
  disabled = false,
  error,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Concept[]>([]);
  const [useExtendedEcl, setUseExtendedEcl] = useState(false);
  const { applicationConfig } = useApplicationConfigStore();
  const { isLoading, data } = useSearchConceptOntoServerByUrl(
    inputValue,
    url && url.length > 0 ? url : undefined,
    showDefaultOptions,
  );

  // Update options when search results change
  useEffect(() => {
    if (data && data.expansion?.contains !== undefined) {
      const concepts =
        convertFromValueSetExpansionContainsListToSnowstormConceptMiniList(
          data.expansion?.contains,
          applicationConfig.fhirPreferredForLanguage,
        );
      const uniqueOptions = Array.from(
        new Map(concepts.map(item => [item.conceptId, item])).values(),
      );
      setOptions(uniqueOptions);
    }
  }, [data]);

  // Sync inputValue with value or options
  useEffect(() => {
    if (value && options.length > 0) {
      const selectedOption = options.find(
        option => option.conceptId === value.conceptId,
      );
      setInputValue(selectedOption?.pt.term || value?.pt?.term || '');
    } else if (value) {
      setInputValue(value?.pt?.term || '');
    } else {
      setInputValue('');
    }
  }, [value, options]);

  const handleChange = (selectedValue: Concept | null) => {
    if (selectedValue) {
      const conceptMini: ConceptMini = {
        conceptId: selectedValue.conceptId || '',
        pt: selectedValue.pt,
      };
      onChange(conceptMini);
      setInputValue(selectedValue.pt.term);
    } else {
      onChange(null);
      setInputValue('');
    }
  };

  return (
    <Box paddingTop={1}>
      <Autocomplete
        loading={isLoading}
        options={disabled ? [] : options}
        getOptionLabel={option => option?.pt?.term || ''}
        value={
          options.find(option => option.conceptId === value?.conceptId) ||
          value ||
          null
        }
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
    </Box>
  );
};

export default ValueSetAutocomplete;
