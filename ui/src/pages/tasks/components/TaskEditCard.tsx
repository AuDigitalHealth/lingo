import { ReactNode, useState } from 'react';
import { Card, Tab, Tabs } from '@mui/material';

import TaskDetails from './TaskDetails';
import TaskTicketList from './TaskTicketList';

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

function TaskEditCard() {
  const [openTab, setOpenTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    event.preventDefault();
    setOpenTab(newValue);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '1em',
        maxWidth: '450px',
        minWidth: '450px',
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
        <Tab label="Tickets" sx={{ minWidth: '40px' }} />
      </Tabs>

      <TabPanel index={0} value={openTab} />
      <TabPanel index={1} value={openTab} />
    </Card>
  );
}

export default TaskEditCard;
