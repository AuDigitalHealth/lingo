import { NavItemType } from '../types/menu';
import { FormattedMessage } from 'react-intl';

import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined';
import AddToQueueIcon from '@mui/icons-material/AddToQueue';
const icons = {
  IntegrationInstructionsOutlinedIcon,
  AddToQueueIcon,
};

const tickets: NavItemType = {
  id: 'group-tickets',
  title: <FormattedMessage id="tickets" />,

  type: 'group',
  children: [
    {
      id: 'board',
      title: <FormattedMessage id="board" />,
      type: 'item',
      url: '/dashboard/tickets/board',
      icon: icons.IntegrationInstructionsOutlinedIcon,
    },
    {
      id: 'backlog',
      title: <FormattedMessage id="backlog" />,
      type: 'item',
      url: '/dashboard/tickets/backlog',
      icon: icons.AddToQueueIcon,
    },
  ],
};

export default tickets;
