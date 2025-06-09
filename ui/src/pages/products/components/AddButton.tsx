import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { FieldProps } from '@rjsf/utils';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

interface AddButtonProps extends FieldProps {
  tooltipTitle?: string;
  onClick: () => void;
  isEnabled: boolean;
}

export const AddButton: React.FC<AddButtonProps> = ({
  tooltipTitle = 'Add Item',
  onClick,
  isEnabled,
  sx = {},
}) => {
  return (
    <Tooltip title={tooltipTitle}>
      <span>
        <IconButton
          sx={{ ...sx }}
          onClick={onClick}
          disabled={!isEnabled}
          color="primary"
          size="large"
        >
          <AddCircleOutlineIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
};
