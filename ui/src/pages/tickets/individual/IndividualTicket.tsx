import { Link, useParams } from 'react-router-dom';
import useTicketById from '../../../hooks/useTicketById';
import { Stack } from '@mui/system';
import { Button, Card, Divider } from '@mui/material';
import CommentSection from './comments/CommentSection';
import Description from '../Description';
import TicketHeader from './components/TicketHeader';
import TicketFields from './components/TicketFields';
import Attachments from './components/Attachments';

function IndividualTicket() {
  const { id } = useParams();
  const ticket = useTicketById(id, true);

  return (
    <Stack direction="row" width="100%" justifyContent="center" height="100%">
      <Card
        sx={{
          minWidth: '800px',
          maxWidth: '1200px',
          height: '100%',
          padding: '2em',
          overflow: 'scroll',
        }}
      >
        <TicketHeader ticket={ticket} />
        <Divider sx={{ marginTop: '1.5em', marginBottom: '1.5em' }} />
        <TicketFields ticket={ticket} />
        <Divider sx={{ marginTop: '1.5em', marginBottom: '1.5em' }} />
        <Description ticket={ticket} />
        <Attachments attachments={ticket?.attachments} />
        <CommentSection ticket={ticket} />
      </Card>
      <Link to={'edit'}>
        <Button
          sx={{
            position: 'relative',
            width: '40px',
            height: '40px',
            top: 0,
            right: 0,
          }}
          variant="contained"
        >
          Edit
        </Button>
      </Link>
    </Stack>
  );
}

export default IndividualTicket;
