import React from 'react';
import { Stack, Tooltip } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { NewReleases, NewReleasesOutlined } from '@mui/icons-material';
import { styled } from '@mui/system';
import { Avatar } from 'antd';
import { hasDescriptionChange, Product } from '../../../types/concept';

export interface ProductStatusProps {
  product: Product;
  spacing?: number;
}

export const ProductStatusIndicators: React.FC<ProductStatusProps> = ({
  product,
  spacing = 0.2,
}) => {
  const SmallAvatar = styled(Avatar)(({ theme }) => ({
    width: 24,
    height: 24,
    fontWeight: 'bold',
    fontSize: '1rem',
  }));

  return (
    <Stack direction="row" spacing={spacing} alignItems="center">
      {product.statedFormChanged && (
        <Tooltip
          title={
            <FormattedMessage
              id="stated-updated"
              defaultMessage="Stated form changed"
            />
          }
        >
          <SmallAvatar>S</SmallAvatar>
        </Tooltip>
      )}

      {product.inferredFormChanged && (
        <Tooltip
          title={
            <FormattedMessage
              id="inferred-updated"
              defaultMessage="Inferred form changed"
            />
          }
        >
          <SmallAvatar>I</SmallAvatar>
        </Tooltip>
      )}

      {hasDescriptionChange(product) && (
        <Tooltip
          title={
            <FormattedMessage
              id="description-updated"
              defaultMessage="Description changed"
            />
          }
        >
          <SmallAvatar>D</SmallAvatar>
        </Tooltip>
      )}

      {product.propertyUpdate && (
        <Tooltip
          title={
            <FormattedMessage
              id="properties-updated"
              defaultMessage="Properties are updated"
            />
          }
        >
          <SmallAvatar>P</SmallAvatar>
        </Tooltip>
      )}

      {product.newInTask && (
        <Tooltip
          title={
            <FormattedMessage
              id="changed-in-task"
              defaultMessage="Unpromoted new concept in the task"
            />
          }
        >
          <NewReleases />
        </Tooltip>
      )}

      {product.newInProject && (
        <Tooltip
          title={
            <FormattedMessage
              id="changed-in-project"
              defaultMessage="Unreleased new concept in the project"
            />
          }
        >
          <NewReleasesOutlined />
        </Tooltip>
      )}
    </Stack>
  );
};
