import { ReactNode, useState } from 'react';
import { Card, Grid, Tab, Tabs } from '@mui/material';

import TaskDetails from '../components/tasks/TaskDetails';
import useTaskById from '../hooks/useTaskById';

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
    component: <div>0</div>,
  },
  {
    component: <div>1</div>,
  },
  {
    component: <div>2</div>,
  },
  {
    component: <TaskDetails />,
  },
];

function TabPanel(props: TabPanelProps) {
  const { value, index } = props;

  return <>{value === index ? <>{tabPanelItems[value].component}</> : <></>}</>;
}

function TaskEditLayout() {
  const [open, setOpen] = useState(true);
  const [openTab, setOpenTab] = useState(3);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    event.preventDefault();
    setOpenTab(newValue);
  };

  return (
    <Grid container sx={{ height: '100%!important' }}>
      <Grid item lg={3} sx={{ height: '100%', maxWidth: '300px' }}>
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '1em',
            maxWidth: '400px',
          }}
        >
          <Tabs
            variant="scrollable"
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
            <Tab label="Search" />
            <Tab label="List" />
            <Tab label="Reviews" />
            <Tab label="Info" />
          </Tabs>

          <TabPanel index={0} value={openTab} />
          <TabPanel index={1} value={openTab} />
          <TabPanel index={2} value={openTab} />
          <TabPanel index={3} value={openTab} />
        </Card>
      </Grid>
    </Grid>
  );
}

export default TaskEditLayout;
