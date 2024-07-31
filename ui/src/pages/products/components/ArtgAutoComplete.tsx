import { Autocomplete, TextField } from '@mui/material';
import React, { FC } from 'react';

import { ExternalIdentifier } from '../../../types/product.ts';
import { Control, Controller, FieldError } from 'react-hook-form';

interface ArtgAutoCompleteProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  optionValues: ExternalIdentifier[];
  dataTestId: string;
  name: string;
  error?: FieldError;
  handleChange?: (artgs: ExternalIdentifier[] | null) => void;
}
const ArtgAutoComplete: FC<ArtgAutoCompleteProps> = ({
  control,
  optionValues,
  name,
  error,
  dataTestId,
  handleChange,
}) => {
  return (
    <Controller
      name={name as 'externalIdentifiers'}
      control={control}
      render={({
        field: { onChange, value, onBlur },
        formState,
        fieldState,
        ...props
      }) => (
        <Autocomplete
          options={optionValues}
          data-testid={dataTestId}
          multiple
          autoSelect={true}
          freeSolo
          onBlur={onBlur}
          getOptionLabel={(option: ExternalIdentifier | string) => {
            if (typeof option === 'string') {
              return option;
            } else {
              return option.identifierValue;
            }
          }}
          renderInput={params => (
            <TextField
              error={!!error}
              helperText={error?.message ? error?.message : ' '}
              {...params}
              data-testid={`${dataTestId}-input`}
            />
          )}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(e, values: any[]) => {
            const tempValues: ExternalIdentifier[] = [];
            values.map(v => {
              if (typeof v === 'string') {
                const artg: ExternalIdentifier = {
                  identifierScheme: 'https://www.tga.gov.au/artg',
                  identifierValue: v,
                };
                tempValues.push(artg);
              } else {
                tempValues.push(v as ExternalIdentifier);
              }
            });
            if (handleChange) {
              handleChange(tempValues);
            }
            onChange(tempValues);
          }}
          {...props}
          value={(value as any[]) || []}
        />
      )}
    />
  );
};
export default ArtgAutoComplete;
