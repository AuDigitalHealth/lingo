import React from 'react';
import {
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Tooltip,
  Paper,
  Switch,
  Box,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ArchiveOutlined } from '@mui/icons-material';
import { Controller, useFormContext, UseFormSetValue } from 'react-hook-form';
import { Product, ProductSummary } from '../../../types/concept';
import { Control } from 'react-hook-form';

interface ProductRetireUpdateProps {
  product: Product;
  index: number;
  control: Control<ProductSummary>;
  setValue: UseFormSetValue<ProductSummary>;
}

const inactivationReasonOptions = [
  { value: 'AMBIGUOUS', label: 'Ambiguous' },
  { value: 'DUPLICATE', label: 'Duplicate' },
  { value: 'ERRONEOUS', label: 'Erroneous' },
  { value: 'OUTDATED', label: 'Outdated' },
];

const getIsRetireAndReplace = (product: Product): boolean => {
  return (
    product.newConceptDetails != null &&
    product.originalNode != null &&
    !product.originalNode.referencedByOtherProducts &&
    product.originalNode.inactivationReason != null
  );
};

const getIsConceptEdit = (product: Product): boolean => {
  return (
    product.newConceptDetails != null &&
    product.originalNode != null &&
    !product.originalNode.referencedByOtherProducts &&
    product.originalNode.inactivationReason == null
  );
};

export const ProductRetireUpdate: React.FC<ProductRetireUpdateProps> = ({
  product,
  index,
  control,
  setValue,
}) => {
  const show =
    product.originalNode !== null && product.newConceptDetails !== null;
  if (!show) return null;

  const theme = useTheme();
  const term = product.originalNode?.node.concept.pt.term;
  const reason = product.originalNode?.inactivationReason ?? null;
  const referencedByOtherProducts =
    product.originalNode?.referencedByOtherProducts ?? false;

  const [retireAndReplace, setRetireAndReplace] = React.useState(
    getIsRetireAndReplace(product),
  );
  const [conceptEdit, setConceptEdit] = React.useState(
    getIsConceptEdit(product),
  );

  React.useEffect(() => {
    setRetireAndReplace(getIsRetireAndReplace(product));
    setConceptEdit(getIsConceptEdit(product));
  }, [product]);

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 1,
        backgroundColor: '#ffffff',
        border: '2px solid #e0e0e0',
        borderRadius: 2,
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
        {referencedByOtherProducts ? 'Original Concept' : 'Edit/Retire Concept'}
      </Typography>

      <Stack spacing={2}>
        {/* Retired Concept Display */}
        <Stack direction="row" spacing={1} alignItems="center">
          <ArchiveOutlined color="action" fontSize="medium" />
          <Typography variant="body2" color="textSecondary">
            {term}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 2,
            p: 1,
            backgroundColor: theme.palette.grey[300],
            color: theme.palette.text.primary,
            borderRadius: 1,
            fontSize: '0.875rem',
          }}
        >
          {referencedByOtherProducts
            ? 'This concept is used by other products and cannot be edited. A new concept will be created to apply the changes.'
            : 'This concept is not referenced by other products.'}
        </Box>

        {/* Toggles and Dropdown */}
        {!referencedByOtherProducts && (
          <>
            <Box
              sx={{
                display: 'flex',
                gap: 4,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={retireAndReplace}
                    onChange={e => {
                      const isChecked = e.target.checked;
                      setRetireAndReplace(isChecked);
                      setConceptEdit(!isChecked);

                      setValue(
                        `nodes[${index}].originalNode.inactivationReason`,
                        isChecked ? 'ERRONEOUS' : null,
                      );
                    }}
                    color="primary"
                  />
                }
                label="Retire and Replace"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={conceptEdit}
                    onChange={e => {
                      const isChecked = e.target.checked;
                      setConceptEdit(isChecked);
                      setRetireAndReplace(!isChecked);

                      setValue(
                        `nodes[${index}].originalNode.inactivationReason`,
                        isChecked ? null : 'ERRONEOUS',
                      );
                    }}
                    color="primary"
                  />
                }
                label="Edit in place"
              />
            </Box>

            {/* Inactivation Reason Dropdown (Only when Retire and Replace is ON) */}
            {retireAndReplace && (
              <FormControl fullWidth required>
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
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
};
