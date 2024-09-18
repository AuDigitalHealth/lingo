import { NavItemType } from '../types/menu';
import { FormattedMessage } from 'react-intl';

const snodine: NavItemType = {
  id: 'snodine',
  title: <FormattedMessage id="Snodine" />,

  type: 'group',
  children: [
    {
      id: 'snodine',
      title: <FormattedMessage id="Snodine" />,
      type: 'item',
      url: '/dashboard/snodine',
      icon: 'set_meal',
      tooltip: 'Snodine',
    },
  ],
};

export default snodine;
