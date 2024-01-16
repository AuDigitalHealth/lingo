import { Tooltip } from '@mui/material';
import { ReactNode } from 'react';

interface UnableToEditTooltipProps {
  canEdit?: boolean;
  children: ReactNode;
}

const UnableToEditTooltip = ({
  canEdit = true,
  children,
}: UnableToEditTooltipProps) => {
  return (
    <Tooltip title={!canEdit ? 'Must be task owner' : ''}>
      <span>{children}</span>
    </Tooltip>
  );
};

export default UnableToEditTooltip;
