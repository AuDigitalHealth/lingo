import {Box, Grid, Tooltip} from '@mui/material';
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
    <Tooltip title={!canEdit ? 'Ticket is Closed' : ''}>
      <span>{children}</span>
    </Tooltip>
  );
};

export default UnableToEditTicketTooltip;
