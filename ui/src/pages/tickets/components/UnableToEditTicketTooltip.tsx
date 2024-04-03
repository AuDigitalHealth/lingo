import { Tooltip } from '@mui/material';
import { ReactNode } from 'react';

interface UnableToEditTicketTooltipProps {
  canEdit?: boolean;
  children: ReactNode;
}

const UnableToEditTicketTooltip = ({
  canEdit = true,
  children,
}: UnableToEditTicketTooltipProps) => {
  return (
    <Tooltip title={!canEdit ? 'Must be task owner' : ''}>
      <span>{children}</span>
    </Tooltip>
  );
};

export default UnableToEditTicketTooltip;
