import { Autocomplete, TextField } from '@mui/material';
import React, { FC } from 'react';

import { ExternalIdentifier } from '../../../types/product.ts';
import { Control, Controller, FieldError } from 'react-hook-form';
import { generateArtgObj } from '../../../utils/helpers/conceptUtils.ts';
import { sortExternalIdentifiers } from '../../../utils/helpers/tickets/additionalFieldsUtils.ts';

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
      render={({ field: { onChange, value, onBlur }, ...props }) => (
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
          onChange={(e, values: (ExternalIdentifier | string)[]) => {
            const tempValues: ExternalIdentifier[] = [];
            values.map(v => {
              if (typeof v === 'string') {
                const artg: ExternalIdentifier = generateArtgObj(v);
                tempValues.push(artg);
              } else {
                tempValues.push(v);
              }
            });
            const sortedValues = sortExternalIdentifiers(tempValues);
            if (handleChange) {
              handleChange(sortedValues);
            }
            onChange(sortExternalIdentifiers(sortedValues));
          }}
          {...props}
          value={sortExternalIdentifiers(
            ((value as (ExternalIdentifier | string)[]) || []).map(v =>
              typeof v === 'string' ? generateArtgObj(v) : v,
            ),
          )}
        />
      )}
    />
  );
};
export default ArtgAutoComplete;
