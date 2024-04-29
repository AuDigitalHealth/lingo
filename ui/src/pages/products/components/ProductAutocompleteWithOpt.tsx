import React, { FC, useEffect, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { Concept } from '../../../types/concept.ts';
import useDebounce from '../../../hooks/useDebounce.tsx';
import { useSearchConceptsByEcl } from '../../../hooks/api/useInitializeConcepts.tsx';
import { Control, Controller, FieldError } from 'react-hook-form';
import { filterOptionsForConceptAutocomplete } from '../../../utils/helpers/conceptUtils.ts';

interface ProductAutocompleteWithOptProps {
  control: Control<any>;
  optionValues?: Concept[];
  name: string;
  disabled: boolean;
  setDisabled: (val: boolean) => void;
  ecl: string | undefined;
  dataTestId: string;
  showDefaultOptions?: boolean;
  handleChange?: (concept: Concept | null) => void;
  error?: FieldError;
  branch: string;
  clearValue?: boolean;
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
  error,
  clearValue,
  dataTestId,
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

  useEffect(() => {
    if (clearValue) {
      setInputValue('');
    }
  }, [clearValue]);

  const mapDataToOptions = () => {
    if (data) {
      setOptions(data.items);
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
          data-testid={dataTestId}
          loading={isLoading}
          options={options.sort((a, b) => {
            return b.pt && a.pt ? -b.pt?.term.localeCompare(a.pt?.term) : -1;
          })}
          disabled={disabled}
          fullWidth
          filterOptions={filterOptionsForConceptAutocomplete}
          getOptionLabel={option => option.pt?.term as string}
          renderInput={params => (
            <TextField
              {...params}
              error={!!error}
              helperText={error?.message ? error?.message : ' '}
              data-testid={`${dataTestId}-input`}
            />
          )}
          onOpen={() => {
            if (inputValue && inputValue.length > 0) {
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
            if (!data) {
              setInputValue('');
            }
            onChange(data);
          }}
          {...props}
          value={clearValue === true ? null : (value as Concept) || null}
        />
      )}
    />
  );
};

export default ProductAutocompleteWithOpt;
