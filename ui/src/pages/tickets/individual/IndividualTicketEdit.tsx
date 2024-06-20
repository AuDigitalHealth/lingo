import { useParams } from 'react-router-dom';
import { useTicketById } from '../../../hooks/api/tickets/useTicketById';
import { Stack } from '@mui/system';
import { Card, Divider } from '@mui/material';
import Description from '../Description';
import TicketHeader from './components/TicketHeader';
import TicketFields from './components/TicketFields';
import Attachments from './components/Attachments';
import CommentSection from './comments/CommentSection';
import { useState } from 'react';
import TicketAssociationView from './components/TicketAssociationView';

interface IndividualTicketEditProps {
  ticketId?: number;
}
function IndividualTicketEdit({ ticketId }: IndividualTicketEditProps) {
  const { id } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const useTicketQuery = useTicketById(ticketId ? ticketId.toString() : id);

  const refresh = () => {
    setRefreshKey(oldKey => oldKey + 1);
  };

  return (
    <Stack
      key={refreshKey}
      direction="row"
      width="100%"
      justifyContent="center"
      height="100%"
    >
      <Card
        sx={{
          minWidth: '800px',
          maxWidth: '1200px',
          height: '100%',
          padding: '2em',
          overflow: 'scroll',
        }}
      >
        <TicketHeader ticket={useTicketQuery.data} editable={true} />
        <Divider sx={{ marginTop: '1.5em', marginBottom: '1.5em' }} />
        <TicketFields ticket={useTicketQuery.data} editable={true} />
        <Divider sx={{ marginTop: '1.5em', marginBottom: '1.5em' }} />
        <TicketAssociationView ticket={useTicketQuery.data} />
        <Divider sx={{ marginTop: '1.5em', marginBottom: '1.5em' }} />
        <Description ticket={useTicketQuery.data} editable={true} />
        <Attachments ticket={useTicketQuery.data} onRefresh={refresh} />
        <CommentSection ticket={useTicketQuery.data} />
      </Card>
    </Stack>
  );
}

export default IndividualTicketEdit;
