import { Card, Divider, IconButton, Stack, Typography } from '@mui/material';
import { Link, Route, Routes, useParams } from 'react-router-dom';
import Description from '../../tickets/Description';
import TicketFields from '../../tickets/individual/components/TicketFields';
import { ArrowBack } from '@mui/icons-material';
import { useTicketById } from '../../../hooks/api/tickets/useTicketById.tsx';
import Loading from '../../../components/Loading';
import ProductAuthoring from '../../products/ProductAuthoring';
import useTaskById from '../../../hooks/useTaskById';
import ProductModelReadonly from '../../products/ProductModelReadonly.tsx';

import { useEffect, useState } from 'react';
import ProductAuthoringEdit from '../../products/ProductAuthoringEdit.tsx';
import GravatarWithTooltip from '../../../components/GravatarWithTooltip.tsx';
import TicketProducts from '../../tickets/components/TicketProducts.tsx';
import useAuthoringStore from '../../../stores/AuthoringStore.ts';
import { ActionType } from '../../../types/product.ts';

interface TaskTicketProps {
  menuOpen: boolean;
}
function TaskTicket({ menuOpen }: TaskTicketProps) {
  // These all need to be tied to actions - ? Whatever these actions look like, I really have no idea at the moment.
  // For now, we just have buttons
  const { branchKey, ticketId } = useParams();
  const task = useTaskById();
  const [refreshKey, setRefreshKey] = useState(0);
  const useTicketQuery = useTicketById(ticketId, true);
  const { setSelectedActionType } = useAuthoringStore();

  useEffect(() => {
    if (useTicketQuery.data) {
      setSelectedActionType(ActionType.newMedication); //reset to medication on the beginning
    }
  }, [useTicketQuery.data]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const refresh = () => {
    setRefreshKey(oldKey => oldKey + 1);
  };

  if (useTicketQuery.data === undefined || !task) {
    return <Loading />;
  }
  return (
    <Stack key={refreshKey} flexDirection={'row'} width={'100%'} gap={3}>
      {menuOpen && (
        <Card
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxWidth: '450px',
            minWidth: '450px',
            padding: '2em',
            paddingBottom: '2em',
            overflow: 'scroll',
          }}
        >
          <Stack
            direction={'row'}
            alignItems={'center'}
            sx={{ marginBottom: '1em' }}
            gap={1}
          >
            <Link
              to={`/dashboard/tasks/edit/${branchKey}`}
              state={{ openTab: 1 }}
            >
              <IconButton color="primary" aria-label="back">
                <ArrowBack />
              </IconButton>
            </Link>
            <div
              style={{
                width: '10%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <GravatarWithTooltip
                useFallback={true}
                username={useTicketQuery.data?.assignee}
                size={40}
              />
              <Typography variant="caption" fontWeight="bold">
                Assignee
              </Typography>
            </div>
            <Typography
              align="center"
              variant="subtitle1"
              sx={{ width: '100%' }}
            >
              <Link
                to={`/dashboard/tickets/backlog/individual/${useTicketQuery.data.id}`}
              >
                {useTicketQuery.data.title}
              </Link>
            </Typography>
          </Stack>

          <TicketFields ticket={useTicketQuery.data} isCondensed={true} />
          <Divider />
          <Description ticket={useTicketQuery.data} />
          <Divider />
          <TicketProducts
            ticket={useTicketQuery.data}
            branch={task.branchPath}
          />
        </Card>
      )}
      <Stack sx={{ width: '100%' }}>
        <Routes>
          <Route
            path="product"
            element={
              <ProductAuthoring ticket={useTicketQuery.data} task={task} />
            }
          />
          <Route
            path="product/edit/"
            element={
              <ProductAuthoringEdit ticket={useTicketQuery.data} task={task} />
            }
          />
          <Route
            path="product/view/:conceptId/*"
            element={<ProductModelReadonly branch={task?.branchPath} />}
          />
        </Routes>
      </Stack>
    </Stack>
  );
}

export default TaskTicket;
