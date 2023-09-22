import { NavItemType } from '../types/menu';
import { FormattedMessage } from 'react-intl';

import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined';
import AddToQueueIcon from '@mui/icons-material/AddToQueue';
const icons = {
  IntegrationInstructionsOutlinedIcon,
  AddToQueueIcon,
};

const products: NavItemType = {
  id: 'group-products',
  title: <FormattedMessage id="products" />,

  type: 'group',
  children: [
    {
      id: 'product-view',
      title: <FormattedMessage id="product-view" />,
      type: 'item',
      url: '/dashboard/products',
      icon: icons.IntegrationInstructionsOutlinedIcon,
    },
    {
      id: 'product-authoring',
      title: <FormattedMessage id="product-authoring" />,
      type: 'item',
      url: '/dashboard/products/authoring',
      icon: icons.AddToQueueIcon,
    },
  ],
};

export default products;
