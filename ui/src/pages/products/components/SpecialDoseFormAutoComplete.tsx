import { Autocomplete, TextField } from '@mui/material';
import React, { FC, useEffect, useState } from 'react';
import { Concept } from '../../../types/concept.ts';
import useDebounce from '../../../hooks/useDebounce.tsx';

import { useSpecialDoseFormSearch } from '../../../hooks/api/useInitializeConcepts.tsx';
import { Control, Controller } from 'react-hook-form';
import { MedicationPackageDetails } from '../../../types/authoring.ts';
interface SpecialDoseFormAutocompleteProps {
  optionValues: Concept[];
  control: Control<MedicationPackageDetails>;

  name: string;
  inputValue: string;
  setInputValue: (val: string) => void;
  ecl: string | undefined;
}
const SpecialDoseFormAutocomplete: FC<SpecialDoseFormAutocompleteProps> = ({
  optionValues,
  inputValue,
  setInputValue,
  control,
  name,
  ecl,

  ...props
}) => {
  const debouncedSearch = useDebounce(inputValue, 1000);
  const [options, setOptions] = useState<Concept[]>(
    optionValues ? optionValues : [],
  );
  const { data } = useSpecialDoseFormSearch(debouncedSearch, ecl);
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
      name={name as 'containedProducts.0.productDetails.specificForm'}
      control={control}
      render={({ field: { onChange, value }, ...props }) => (
        <Autocomplete
          // loading={isLoading}
          options={options}
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
            onChange(data);
          }}
          {...props}
          value={inputValue === '' ? null : (value as Concept)}
        />
      )}
    />
  );
};
export default SpecialDoseFormAutocomplete;
