import BaseModal from '../../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../../components/modal/BaseModalHeader.tsx';

import { TicketFilter } from '../../../../types/tickets/ticket.ts';
import TicketFilterUpdate from './TicketFilterUpdate.tsx';

interface TicketFilterSettingsModalProps {
  open: boolean;
  handleClose: () => void;
  ticketFilter?: TicketFilter;
}
export default function TicketFilterSettingsModal({
  open,
  handleClose,
  ticketFilter,
}: TicketFilterSettingsModalProps) {
  return (
    <BaseModal open={open} handleClose={handleClose} sx={{ minWidth: '400px' }}>
      <BaseModalHeader title={`Update Ticket Filter ${ticketFilter?.name}`} />
      <BaseModalBody>
        <TicketFilterUpdate
          ticketFilter={ticketFilter}
          handleClose={handleClose}
        />
      </BaseModalBody>
    </BaseModal>
  );
}
