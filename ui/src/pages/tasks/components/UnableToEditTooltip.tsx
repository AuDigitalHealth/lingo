import { Tooltip } from '@mui/material';
import { ReactNode } from 'react';

interface UnableToEditTooltipProps {
  canEdit?: boolean;
  children: ReactNode;
  lockDescription: string;
}

const UnableToEditTooltip = ({
  canEdit = true,
  children,
  lockDescription,
}: UnableToEditTooltipProps) => {
  return (
    <Tooltip title={!canEdit ? lockDescription : ''}>
      <span>{children}</span>
    </Tooltip>
  );
};

export default UnableToEditTooltip;
