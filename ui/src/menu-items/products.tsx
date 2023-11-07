import { NavItemType } from '../types/menu';
import { FormattedMessage } from 'react-intl';

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
      icon: 'admin_meds',
      tooltip: 'Products View',
    },
  ],
};

export default products;
