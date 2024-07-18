import { ExternalIdentifier } from '../../../types/product.ts';
import { Chip, Grid } from '@mui/material';
import React from 'react';

export interface FieldChipsProps {
  items: ExternalIdentifier[];
}
export const FieldChips = ({ items }: FieldChipsProps) => (
  <Grid container spacing={1}>
    {items.map((item, index) => (
      <Grid item key={index}>
        <Chip label={item['identifierValue']} />
      </Grid>
    ))}
  </Grid>
);
