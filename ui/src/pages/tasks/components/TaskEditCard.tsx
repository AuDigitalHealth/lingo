import React, { ReactNode, useEffect, useState } from 'react';
import { Card, Tab, Tabs } from '@mui/material';

import TaskDetails from './TaskDetails';
import TaskTicketList from './TaskTicketList';
import { Route, Routes, useLocation, useParams } from 'react-router-dom';

import useTaskByKey from '../../../hooks/useTaskByKey.tsx';
import { Task } from '../../../types/task.ts';
import Loading from '../../../components/Loading.tsx';
import { useFetchAndCreateBranch } from '../../../hooks/api/task/useInitializeBranch.tsx';
import { Stack } from '@mui/material';
import { useNodeModel } from '../../../hooks/api/products/useNodeModel.tsx';
import ProductPreviewSimple from '../../products/components/ProductPreviewSimple.tsx';

interface LocationState {
  openTab: number;
}
interface TabPanelProps {
  children?: ReactNode;
  value: number;
  index: number;
}

interface TabPanelItem {
  component: ReactNode;
}
const tabPanelItems: TabPanelItem[] = [
  {
    component: <TaskDetails />,
  },
  {
    component: <TaskTicketList />,
  },
];

function TabPanel(props: TabPanelProps) {
  const { value, index } = props;

  return <>{value === index ? <>{tabPanelItems[value].component}</> : <></>}</>;
}

interface TaskEditCardProps {
  menuOpen: boolean;
}
function TaskEditCard({ menuOpen }: TaskEditCardProps) {
  const [openTab, setOpenTab] = useState<number>(0);
  const locationState = useLocation().state as LocationState;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    event.preventDefault();
    setOpenTab(newValue);
  };
  const task = useTaskByKey();

  const { isLoading } = useFetchAndCreateBranch(task as Task);

  useEffect(() => {
    setOpenTab(locationState?.openTab ? locationState?.openTab : 0);
  }, [locationState?.openTab]);

  if (isLoading || !task) {
    return <Loading message={`Loading Task details`} />;
  }

  return (
    <>
      {menuOpen && (
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '1em',
            maxWidth: '450px',
            minWidth: '450px',
            overflowY: 'scroll',
          }}
        >
          <Tabs
            variant="fullWidth"
            scrollButtons="auto"
            textColor="primary"
            indicatorColor="primary"
            value={openTab}
            onChange={handleTabChange}
            aria-label="Tabs for individual task"
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Tab label="Info" sx={{ minWidth: '40px' }} />
            <Tab
              data-testid={'tickets-link'}
              label="Tickets"
              sx={{ minWidth: '40px' }}
            />
          </Tabs>

          <TabPanel index={0} value={openTab ? openTab : 0} />
          <TabPanel index={1} value={openTab ? openTab : 0} />
        </Card>
      )}
    </>
  );
}

export function TaskEdit({ menuOpen }: TaskEditCardProps) {
  return (
    <Stack flexDirection="row" sx={{ width: '100%' }} gap={2}>
      <TaskEditCard menuOpen={menuOpen} />
      <Routes>
        <Route path="review/:conceptId/*" element={<TaskEditReview />} />
      </Routes>
    </Stack>
  );
}

export function TaskEditReview() {
  const task = useTaskByKey();
  const branch = task?.branchPath;
  const { conceptId } = useParams();
  const { data, isLoading } = useNodeModel(conceptId, branch);

  if (data && branch) {
    return (
      <Stack flexDirection={'column'} gap={2}>
        <ProductPreviewSimple
          product={data}
          fsnToggle
          isSimpleEdit={false}
          branch={branch}
          activeConcept=""
          expandedConcepts={[]}
        />
      </Stack>
    );
  }

  if (isLoading) {
    return <Loading message={`Loading review for ${conceptId}`} />;
  }
  return <></>;
}

export default TaskEditCard;
