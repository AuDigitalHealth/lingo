// project import
import tasks from './tasks';
import tickets from './tickets';

// types
import { NavItemType } from '../types/menu';
import products from './products.tsx';

// ==============================|| MENU ITEMS ||============================== //

const menuItems: { items: NavItemType[] } = {
  items: [tasks, tickets, products],
};

export default menuItems;
