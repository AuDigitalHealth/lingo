import { NavItemType } from '../types/menu';
import { FormattedMessage } from 'react-intl';

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
      icon: 'patient_list',
      tooltip: 'My Tasks',
    },
    {
      id: 'all-tasks',
      title: <FormattedMessage id="all-tasks" />,
      type: 'item',
      url: '/dashboard/tasks/all',
      icon: 'list',
      tooltip: 'All Tasks',
    },
    {
      id: 'tasks-need-review',
      title: <FormattedMessage id="tasks-need-review" />,
      type: 'item',
      url: '/dashboard/tasks/needReview',
      icon: 'checklist_rtl',
      tooltip: 'Tasks Requiring Review',
    },
  ],
};

export default tasks;
