import { Autocomplete, TextField } from '@mui/material';
import React, { FC, useEffect, useState } from 'react';
import { Concept } from '../../../types/concept.ts';
import useDebounce from '../../../hooks/useDebounce.tsx';

import { useSearchConceptsByEcl } from '../../../hooks/api/useInitializeConcepts.tsx';

import { Control, Controller } from 'react-hook-form';
import { filterOptionsForConceptAutocomplete } from '../../../utils/helpers/conceptUtils.ts';
interface ProductAutocompleteWithOptProps {
  // eslint-disable-next-line
  control: Control<any>;
  optionValues?: Concept[];
  name: string;
  disabled: boolean;
  setDisabled: (val: boolean) => void;
  ecl: string;
  showDefaultOptions?: boolean;
  handleChange?: (concept: Concept | null) => void;
  branch: string;
}
const ProductAutocompleteWithOpt: FC<ProductAutocompleteWithOptProps> = ({
  control,
  optionValues,
  disabled,
  name,
  handleChange,
  branch,
  ecl,
  showDefaultOptions,
}) => {
  const [inputValue, setInputValue] = useState('');
  const debouncedSearch = useDebounce(inputValue, 1000);
  const [options, setOptions] = useState<Concept[]>(
    optionValues ? optionValues : [],
  );
  const { isLoading, data } = useSearchConceptsByEcl(
    debouncedSearch,
    ecl,
    branch,
    showDefaultOptions && inputValue.length === 0 ? true : false,
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
      render={({ field: { onChange, value, onBlur }, ...props }) => (
        <Autocomplete
          loading={isLoading}
          options={options.sort((a, b) => {
            return b.pt && a.pt ? -b.pt?.term.localeCompare(a.pt?.term) : -1;
          })}
          disabled={disabled}
          fullWidth
          filterOptions={filterOptionsForConceptAutocomplete}
          getOptionLabel={option => option.pt?.term as string}
          renderInput={params => <TextField {...params} />}
          onOpen={() => {
            if (inputValue) {
              setOpen(true);
            }
          }}
          onBlur={onBlur}
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
