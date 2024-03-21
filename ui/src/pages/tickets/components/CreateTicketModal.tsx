import { useState } from 'react';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import { TicketDtoMinimal } from '../../../types/tickets/ticket';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';
import { Button, TextField } from '@mui/material';
import TicketsService from '../../../api/TicketsService';
import { useSnackbar } from 'notistack';
import Loading from '../../../components/Loading';
import { Stack } from '@mui/system';
import { useNavigate } from 'react-router-dom';

interface CreateTicketModalProps {
  open: boolean;
  handleClose: () => void;
  title: string;
}
export default function CreateTicketModal({
  open,
  handleClose,
  title,
}: CreateTicketModalProps) {
  const [ticketTitle, setTicketTitle] = useState<string>();
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = () => {
    if (ticketTitle !== undefined && ticketTitle !== '') {
      setLoading(true);
      const ticket: TicketDtoMinimal = { title: ticketTitle };
      TicketsService.createTicket(ticket)
        .then(ticket => {
          navigate(`/dashboard/tickets/individual/${ticket.id}`);
          handleClose();
        })
        .catch(error => {
          enqueueSnackbar(`Error creating ticket: ${error}`, {
            variant: 'error',
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };
  return (
    <BaseModal
      open={open}
      handleClose={!loading ? handleClose : () => null}
      sx={{ minWidth: '400px' }}
    >
      <BaseModalHeader title={title} />
      <BaseModalBody>
        {loading ? (
          <Loading />
        ) : (
          <Stack gap={1} sx={{ padding: '1em', width: '100%' }}>
            <TextField
              sx={{ width: '100%' }}
              label="Title"
              type="text"
              onChange={e => {
                setTicketTitle(e.target.value);
              }}
              variant="standard"
            />
          </Stack>
        )}
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Button
            color="primary"
            size="small"
            variant="contained"
            onClick={handleSubmit}
            disabled={ticketTitle === undefined || ticketTitle === ''}
          >
            Create Ticket
          </Button>
        }
      />
    </BaseModal>
  );
}
