// project import
import tasks from './tasks';
import tickets from './tickets';

// types
import { NavItemType } from '../types/menu';

// ==============================|| MENU ITEMS ||============================== //

const menuItems: { items: NavItemType[] } = {
  items: [tasks, tickets],
};

export default menuItems;
