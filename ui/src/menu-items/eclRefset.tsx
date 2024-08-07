import { NavItemType } from '../types/menu';
import { FormattedMessage } from 'react-intl';

const eclRefsetTool: NavItemType = {
  id: 'ecl-refset-tool',
  title: <FormattedMessage id="ecl-refset-tool" />,

  type: 'group',
  children: [
    {
      id: 'ecl-refset-tool',
      title: <FormattedMessage id="ecl-refset-tool" />,
      type: 'item',
      url: '/dashboard/eclRefsetTool',
      icon: 'edit_note',
      tooltip: 'ECL Refset Tool',
    },
  ],
};

export default eclRefsetTool;
