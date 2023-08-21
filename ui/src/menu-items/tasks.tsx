import { NavItemType } from '../types/menu';
import { FormattedMessage } from 'react-intl';

import { CalendarOutlined } from '@ant-design/icons';
import TaskIcon from '@mui/icons-material/Task';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ExploreIcon from '@mui/icons-material/Explore';
const icons = {
  CalendarOutlined,
  TaskIcon,
  AssignmentIndIcon,
  ExploreIcon,
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
    {
      id: 'tasks-need-review',
      title: <FormattedMessage id="tasks-need-review" />,
      type: 'item',
      url: '/dashboard/tasks/needReview',
      icon: icons.ExploreIcon,
    },
    {
      id: 'tasks-requested-review',
      title: <FormattedMessage id="tasks-requested-review" />,
      type: 'item',
      url: '/dashboard/tasks/reviewRequested',
      icon: icons.AssignmentIndIcon,
    },
  ],
};

export default tasks;
