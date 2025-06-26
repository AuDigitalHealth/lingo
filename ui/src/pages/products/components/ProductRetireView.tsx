import React from 'react';
import { Stack, Tooltip } from '@mui/material';
import { ArchiveOutlined } from '@mui/icons-material';
import { Product, ProductSummary } from '../../../types/concept';
import { Control, UseFormGetValues, useWatch } from 'react-hook-form';

export interface ProductRetireViewProps {
  product: Product;
  control: Control<ProductSummary>;
  index: number;
  spacing?: number;
}

export const ProductRetireView: React.FC<ProductRetireViewProps> = ({
  product,
  spacing = 0.5,
  control,
  index,
}) => {
  const show =
    product.originalNode !== null && product.newConceptDetails !== null;
  if (!show) return null;

  const term = product.originalNode?.node.concept.pt.term;

  const reason = useWatch({
    control,
    name: `nodes[${index}].originalNode.inactivationReason` as 'nodes.0.originalNode.inactivationReason',
  });
  if (!term) return null;

  return (
    <Stack direction="row" spacing={spacing} alignItems="center">
      <Tooltip
        title={
          <>
            <div>
              <strong>Retired concept:</strong> {term}
            </div>
            <div>
              <strong>Reason:</strong> <span>{reason}</span>
            </div>
          </>
        }
        placement="top"
        enterDelay={300}
      >
        <ArchiveOutlined color="action" fontSize="medium" />
      </Tooltip>
    </Stack>
  );
};
