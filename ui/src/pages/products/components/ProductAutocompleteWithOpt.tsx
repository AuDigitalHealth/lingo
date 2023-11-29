import { Autocomplete, TextField } from '@mui/material';
import React, { FC, useEffect, useState } from 'react';
import { Concept } from '../../../types/concept.ts';
import useDebounce from '../../../hooks/useDebounce.tsx';

import { useSearchConcepts } from '../../../hooks/api/useInitializeConcepts.tsx';
import { ConceptSearchType } from '../../../types/conceptSearch.ts';
import { Control, Controller } from 'react-hook-form';
import { filterOptionsForConceptAutocomplete } from '../../../utils/helpers/conceptUtils.ts';
interface ProductAutocompleteWithOptProps {
  control: Control<any>;
  optionValues: Concept[];
  searchType: ConceptSearchType;
  name: string;
  disabled: boolean;
  setDisabled: (val: boolean) => void;
  handleChange?: (concept: Concept | null) => void;
  branch: string;
}
const ProductAutocompleteWithOpt: FC<ProductAutocompleteWithOptProps> = ({
  control,
  optionValues,
  searchType,
  disabled,
  name,
  handleChange,
  branch,
}) => {
  const [inputValue, setInputValue] = useState('');
  const debouncedSearch = useDebounce(inputValue, 1000);
  const [options, setOptions] = useState<Concept[]>(
    optionValues ? optionValues : [],
  );
  const { isLoading, data } = useSearchConcepts(
    debouncedSearch,
    searchType,
    branch,
  );
  const [open, setOpen] = useState(false);
  useEffect(() => {
    mapDataToOptions();
  }, [data]);

  const mapDataToOptions = () => {
    if (data) {
      setOptions(data);
    } else if (optionValues) {
      setOptions(optionValues);
    }
  };
  return (
    <Controller
      name={name as 'productName'}
      control={control}
      render={({ field: { onChange, value }, ...props }) => (
        <Autocomplete
          loading={isLoading}
          options={options.sort((a, b) => -b.pt.term.localeCompare(a.pt.term))}
          disabled={disabled}
          fullWidth
          filterOptions={filterOptionsForConceptAutocomplete}
          getOptionLabel={option => option.pt.term}
          renderInput={params => <TextField {...params} />}
          onOpen={() => {
            if (inputValue) {
              setOpen(true);
            }
          }}
          onInputChange={(e, value) => {
            setInputValue(value);
            if (!value) {
              setOpen(false);
            }
          }}
          inputValue={inputValue}
          onChange={(e, data) => {
            if (handleChange) {
              handleChange(data);
            }

            onChange(data);
          }}
          {...props}
          value={(value as Concept) || null}
        />
      )}
    />
  );
};
export default ProductAutocompleteWithOpt;
