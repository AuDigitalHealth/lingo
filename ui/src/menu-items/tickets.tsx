import { NavItemType } from '../types/menu';
import { FormattedMessage } from 'react-intl';

const tickets: NavItemType = {
  id: 'group-tickets',
  title: <FormattedMessage id="tickets" />,

  type: 'group',
  children: [
    {
      id: 'my-backlog',
      title: <FormattedMessage id="my-backlog" />,
      type: 'item',
      url: '/dashboard/tickets/myBacklog',
      icon: 'assignment_ind',
      tooltip: 'My Backlog',
    },
    {
      id: 'backlog',
      title: <FormattedMessage id="backlog" />,
      type: 'item',
      url: '/dashboard/tickets/backlog',
      icon: 'confirmation_number',
      tooltip: 'Backlog',
    },
    {
      id: 'backlog-tables',
      title: <FormattedMessage id="backlog-tables" />,
      type: 'item',
      url: '/dashboard/tickets/backlog/tables',
      icon: 'table_chart',
      tooltip: 'Backlog Tables',
    },
  ],
};

export default tickets;
