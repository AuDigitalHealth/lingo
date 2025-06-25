import React from 'react';
import { Stack, Tooltip } from '@mui/material';
import { ArchiveOutlined } from '@mui/icons-material';
import { Product } from '../../../types/concept';

export interface ProductRetireViewProps {
  product: Product;
  spacing?: number;
}

export const ProductRetireView: React.FC<ProductRetireViewProps> = ({
                                                              product,
                                                              spacing = 0.5,
                                                            }) => {
  const show = product.originalNode !== null && product.newConceptDetails !== null;
  if (!show) return null;

  const term = product.originalNode?.node.concept.pt.term;
  const reason = product.originalNode?.inactivationReason;
  if (!term) return null;

  return (
      <Stack direction="row" spacing={spacing} alignItems="center">
        <Tooltip
            title={
              <>
                <div><strong>Retired concept:</strong> {term}</div>
                <div>
                  <strong>Reason:</strong>{' '}
                  <span>{reason}</span>
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
