import { Autocomplete, TextField } from '@mui/material';
import React, { FC } from 'react';

import { ExternalIdentifier } from '../../../types/product.ts';
import { Control, Controller } from 'react-hook-form';

interface ArtgAutoCompleteProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  optionValues: ExternalIdentifier[];
  name: string;
}
const ArtgAutoComplete: FC<ArtgAutoCompleteProps> = ({
  control,
  optionValues,
  name,
}) => {
  return (
    <Controller
      name={name as 'externalIdentifiers'}
      control={control}
      render={({ field: { onChange, value }, ...props }) => (
        <Autocomplete
          options={optionValues}
          multiple
          freeSolo
          getOptionLabel={(option: ExternalIdentifier | string) => {
            if (typeof option === 'string') {
              return option;
            } else {
              return option.identifierValue;
            }
          }}
          renderInput={params => <TextField {...params} />}
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
