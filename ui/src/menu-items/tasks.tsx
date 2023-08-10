import { NavItemType } from '../types/menu';
import { FormattedMessage } from 'react-intl';

import { CalendarOutlined } from '@ant-design/icons';
import TaskIcon from '@mui/icons-material/Task';
const icons = {
  CalendarOutlined,
  TaskIcon,
};

const tasks: NavItemType = {
  id: 'group-tasks',
  title: <FormattedMessage id="tasks" />,

  type: 'group',
  children: [
    {
      id: 'my-tasks',
      title: <FormattedMessage id="my-tasks" />,
      type: 'item',
      url: '/dashboard/tasks',
      icon: icons.CalendarOutlined,
    },
    {
      id: 'all-tasks',
      title: <FormattedMessage id="all-tasks" />,
      type: 'item',
      url: '/dashboard/tasks/all',
      icon: icons.TaskIcon,
    },
  ],
};

export default tasks;
