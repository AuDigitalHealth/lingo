import React from 'react';
import {
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Paper,
} from '@mui/material';
import { ArchiveOutlined } from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { Product, ProductSummary } from '../../../types/concept';
import { Control } from 'react-hook-form';

interface ProductRetireUpdateProps {
  product: Product;
  index: number;
  control: Control<ProductSummary>;
}

const inactivationReasonOptions = [
  { value: null, label: 'None' },
  { value: 'AMBIGUOUS', label: 'Ambiguous' },
  { value: 'DUPLICATE', label: 'Duplicate' },
  { value: 'ERRONEOUS', label: 'Erroneous' },
  { value: 'OUTDATED', label: 'Outdated' },
];

export const ProductRetireUpdate: React.FC<ProductRetireUpdateProps> = ({
  product,
  index,
  control,
}) => {
  const show =
    product.originalNode !== null && product.newConceptDetails !== null;
  if (!show) return null;

  const term = product.originalNode?.node.concept.pt.term;
  const reason = product.originalNode?.inactivationReason ?? null;
  const referencedByOtherProducts =
    product.originalNode?.referencedByOtherProducts ?? false;

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        pb: 3, // bottom padding
        backgroundColor: '#ffffff',
        border: '2px solid #e0e0e0',
        borderRadius: 3,
        position: 'relative',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 'bold',
          mb: 2,
          color: 'text.primary',
        }}
      >
        Retired Concept
      </Typography>

      <Stack spacing={2}>
        {/* Retired Concept Display */}
        <Stack direction="row" spacing={1} alignItems="center">
          <ArchiveOutlined color="action" fontSize="medium" />
          <Typography variant="body2" color="textSecondary">
            {term}
          </Typography>
        </Stack>

        {/* Readonly Referenced by Other Products */}
        <FormControlLabel
          control={
            <Checkbox
              checked={!!referencedByOtherProducts}
              color="primary"
              disabled
              readOnly
            />
          }
          label="Referenced by other products"
        />

        {/* Inactivation Reason Dropdown */}
        <FormControl fullWidth>
          <InputLabel id={`inactivation-reason-label-${index}`}>
            Inactivation Reason
          </InputLabel>
          <Controller
            name={`nodes[${index}].originalNode.inactivationReason`}
            control={control}
            defaultValue={reason}
            render={({ field }) => (
              <Tooltip
                title={
                  referencedByOtherProducts
                    ? 'Inactivation reason is locked because this product is referenced by others.'
                    : ''
                }
              >
                <span>
                  <Select
                    {...field}
                    labelId={`inactivation-reason-label-${index}`}
                    label="Inactivation Reason"
                    fullWidth
                    disabled={referencedByOtherProducts}
                    value={field.value ?? ''}
                    onChange={e => {
                      const selected = e.target.value;
                      field.onChange(selected === '' ? null : selected);
                    }}
                  >
                    {inactivationReasonOptions.map(option => (
                      <MenuItem
                        key={String(option.value)}
                        value={option.value ?? ''}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </span>
              </Tooltip>
            )}
          />
        </FormControl>
      </Stack>
    </Paper>
  );
};
