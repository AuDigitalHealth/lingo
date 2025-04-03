import {
  Card,
  Divider,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import Description from '../../tickets/Description';
import TicketFields from '../../tickets/individual/components/TicketFields';
import { ArrowBack } from '@mui/icons-material';
import { useTicketByTicketNumber } from '../../../hooks/api/tickets/useTicketById.tsx';
import Loading from '../../../components/Loading';
import ProductAuthoring from '../../products/ProductAuthoring';
import useTaskById from '../../../hooks/useTaskById';
import ProductModelReadonly from '../../products/ProductModelReadonly.tsx';

import { useEffect, useState } from 'react';
import ProductAuthoringEdit from '../../products/ProductAuthoringEdit.tsx';
import AvatarWithTooltip from '../../../components/AvatarWithTooltip.tsx';
import TicketProducts from '../../tickets/components/TicketProducts.tsx';
import useAuthoringStore from '../../../stores/AuthoringStore.ts';
import { ActionType } from '../../../types/product.ts';
import { Box } from '@mui/system';
import TicketDrawer from '../../tickets/components/grid/TicketDrawer.tsx';
import { queryClient } from '../../../hooks/api/config/useQueryConfig.ts';
import { allTaskAssociationsOptions } from '../../../hooks/api/useInitializeTickets.tsx';
import ProductEditView from '../../../components/editProduct/ProductEditView.tsx';

interface TaskTicketProps {
  menuOpen: boolean;
}
function TaskTicket({ menuOpen }: TaskTicketProps) {
  // These all need to be tied to actions - ? Whatever these actions look like, I really have no idea at the moment.
  // For now, we just have buttons
  const { branchKey, ticketNumber } = useParams();
  const task = useTaskById();
  const [refreshKey, setRefreshKey] = useState(0);
  const useTicketQuery = useTicketByTicketNumber(ticketNumber, true);
  const { setSelectedActionType } = useAuthoringStore();
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const ticketMatch = location.pathname.match(/\/individual\/(.+)/);

  useEffect(() => {
    if (useTicketQuery.data) {
      setSelectedActionType(ActionType.newMedication); //reset to medication on the beginning
    }
  }, [useTicketQuery.data, setSelectedActionType]);

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
              <AvatarWithTooltip
                username={useTicketQuery.data?.assignee}
                size={'md'}
              />
              <Typography variant="caption" fontWeight="bold">
                Assignee
              </Typography>
            </div>

            {/* Align ticket number and title */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                marginLeft: 1,
              }}
            >
              <Typography
                align="left"
                sx={{ marginBottom: 0, color: `${theme.palette.grey[500]}` }}
              >
                {useTicketQuery.data.ticketNumber}
              </Typography>

              <Typography
                align="left"
                variant="subtitle1"
                sx={{ width: '100%' }}
              >
                <Link
                  to={`${location.pathname}/individual/${useTicketQuery.data.ticketNumber}`}
                >
                  {useTicketQuery.data.title}
                </Link>
              </Typography>
            </Box>
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
            path="product/view/update/:updateId"
            element={<ProductEditView ticket={useTicketQuery.data} />}
          />
          <Route
            path="product/view/:conceptId/*"
            element={<ProductModelReadonly branch={task?.branchPath} />}
          />
          <Route
            path="product/edit/*"
            element={
              <ProductAuthoringEdit ticket={useTicketQuery.data} task={task} />
            }
          />
          <Route
            path="product/*"
            element={
              <ProductAuthoring ticket={useTicketQuery.data} task={task} />
            }
          />
        </Routes>
        {ticketMatch && (
          <TicketDrawer
            onDelete={() => {
              // refresh the ticketAssociation list for this task,
              void queryClient.invalidateQueries({
                queryKey: allTaskAssociationsOptions().queryKey,
              });
              // close the ticket
              navigate(`/dashboard/tasks/edit/${branchKey}`);
            }}
          />
        )}
      </Stack>
    </Stack>
  );
}

export default TaskTicket;
