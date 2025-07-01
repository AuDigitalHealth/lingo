import React from 'react';
import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ArchiveOutlined, OpenInNew } from '@mui/icons-material';
import { Control, Controller, UseFormSetValue } from 'react-hook-form';
import { Product, ProductSummary } from '../../../types/concept';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore.ts';

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
  branch,
}) => {
  const show =
    product.originalNode !== null && product.newConceptDetails !== null;
  if (!show) return null;

  const theme = useTheme();
  const id = product.originalNode?.node.concept.conceptId;
  const term = product.originalNode?.node.concept.pt.term;
  const reason = product.originalNode?.inactivationReason ?? null;
  const referencedByOtherProducts =
    product.originalNode?.referencedByOtherProducts ?? false;

  const { applicationConfig } = useApplicationConfigStore();
  const snowstormBaseUrl = applicationConfig.apApiBaseUrl;

  const branchParts = branch.split('/');
  const edition = branchParts.slice(0, 3).join('/');
  const release = branchParts[3] || '';

  const conceptBrowserUrl = `${snowstormBaseUrl}/browser/?perspective=full&conceptId1=${id}&edition=${edition}&release=${release}&languages=en`;

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
        <Stack direction="row" spacing={2} alignItems="center">
          <ArchiveOutlined color="action" fontSize="medium" />
          <Tooltip title={id} placement="top" enterDelay={300}>
            <Typography variant="body2" color="textSecondary">
              {term}
            </Typography>
          </Tooltip>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Open in TS Browser" arrow>
              <Link
                href={conceptBrowserUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  ml: 1,
                  color: '#1976d2',
                  '&:hover': {
                    color: '#0f5baa',
                  },
                }}
              >
                <OpenInNew fontSize="small" />
              </Link>
            </Tooltip>
          </div>
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
