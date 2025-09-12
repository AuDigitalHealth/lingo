import { Tooltip } from '@mui/material';
import { ReactNode } from 'react';

interface UnableToEditTicketTooltipProps {
  canEdit?: boolean;
  children: ReactNode;
  isInternalUser?: boolean;
}

const UnableToEditTicketTooltip = ({
  canEdit = true,
  children,
  isInternalUser,
}: UnableToEditTicketTooltipProps) => {
  const robotMessage = isInternalUser
    ? 'This Ticket was created by a robot account. '
    : '';
  const closedMessage = !canEdit ? 'Ticket is Closed.' : '';
  const tooltip =
    robotMessage || closedMessage
      ? `${robotMessage}${closedMessage}`
      : undefined;
  if (robotMessage) {
    debugger;
  }
  console.log(tooltip);
  if (tooltip) {
    return (
      <Tooltip title={tooltip}>
        <span>{children}</span>
      </Tooltip>
    );
  }
  return <>{children}</>;
};

export default UnableToEditTicketTooltip;
