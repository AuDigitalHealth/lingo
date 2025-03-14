import React, { useState, useEffect } from 'react';
import { Autocomplete, CircularProgress, TextField, Box } from '@mui/material';
import { Concept, ConceptMini } from '../../../../types/concept.ts';
import { useSearchConceptOntoServerByUrl } from '../../../../hooks/api/products/useSearchConcept.tsx';
import { convertFromValueSetExpansionContainsListToSnowstormConceptMiniList } from '../../../../utils/helpers/getValueSetExpansionContainsPt.ts';
import useApplicationConfigStore from '../../../../stores/ApplicationConfigStore.ts';
import { useSearchConceptsByEcl } from '../../../../hooks/api/useInitializeConcepts.tsx';

interface EclAutocompleteProps {
  value: ConceptMini | null | undefined;
  onChange: (conceptMini: ConceptMini | null) => void;
  ecl: string;
  branch: string;
  showDefaultOptions: boolean;
  isDisabled: boolean;
  title?: string;
  errorMessage: string;
}

const EclAutocomplete: React.FC<EclAutocompleteProps> = ({
  value,
  onChange,
  ecl,
  branch,
  showDefaultOptions,
  isDisabled,
  title,
  errorMessage,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Concept[]>([]);

  const { isLoading, allData } = useSearchConceptsByEcl(
    inputValue,
    ecl && ecl.length > 0 ? ecl : undefined, // Use extended ECL if `localExtendedEcl` is true, otherwise fallback to ecl
    branch as string,
    showDefaultOptions,
  );

  // Update options when search results change
  useEffect(() => {
    if (allData) {
      const uniqueOptions = Array.from(
        new Map(
          allData.map((item: Concept) => [item.conceptId, item]),
        ).values(),
      ) as Concept[];
      setOptions(uniqueOptions);
    }
  }, [allData]);

  // Sync inputValue based on value or options
  useEffect(() => {
    if (value && options.length > 0) {
      const selectedOption = options.find(
        option => option.conceptId === value.conceptId,
      );
      setInputValue(selectedOption?.pt?.term || value?.pt?.term || '');
    } else if (value) {
      setInputValue(value?.pt?.term || '');
    }
  }, [value, options]);

  // Handle option selection
  const handleProductChange = (selectedProduct: Concept | null) => {
    if (selectedProduct) {
      const conceptMini: ConceptMini = {
        conceptId: selectedProduct.conceptId || '',
        pt: selectedProduct.pt,
        fsn:selectedProduct.fsn
      };
      onChange(conceptMini);
      setInputValue(selectedProduct.pt?.term || '');
    } else {
      onChange(null);
      setInputValue('');
    }
  };

  return (
    <Autocomplete
      loading={isLoading}
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
          error={!!errorMessage}
          helperText={errorMessage}
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
        />
      )}
    />
  );
};

export default EclAutocomplete;
