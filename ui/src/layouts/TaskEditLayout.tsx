import { ReactNode, useState } from 'react';
import { Card, Tab, Tabs } from '@mui/material';

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

  const task = useTaskById();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    event.preventDefault();
    setOpenTab(newValue);
  };

  const handleOpenChange = () => {
    setOpen(!open);
  };

  return (
    <>
      <Card
        sx={{
          width: '500px',
          marginLeft: '1em',
          marginTop: '1em',
          padding: '1em',
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
    </>
    // </Drawer>
  );
}

export default TaskEditLayout;
