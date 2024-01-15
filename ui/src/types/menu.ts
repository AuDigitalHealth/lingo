import { ReactNode } from 'react';

// material-ui
import { ChipProps } from '@mui/material';
import { LinkProps } from 'react-router-dom';
import { AuthoringPlatformLinkProps } from '../components/AuthoringPlatformLink';

// ==============================|| MENU TYPES  ||============================== //
type CustomLinkComponent = React.ComponentType<AuthoringPlatformLinkProps>;

export type NavItemType = {
  component?: ReactNode | CustomLinkComponent | React.ComponentType<LinkProps>;
  breadcrumbs?: boolean;
  caption?: ReactNode | string;
  children?: NavItemType[];
  elements?: NavItemType[];
  chip?: ChipProps;
  color?: 'primary' | 'secondary' | 'default' | undefined;
  disabled?: boolean;
  external?: boolean;
  icon?: string;
  id?: string;
  search?: string;
  target?: boolean;
  title?: ReactNode | string;
  type?: string;
  url?: string | undefined;
  tooltip?: string | undefined;
};

export type LinkTarget = '_blank' | '_self' | '_parent' | '_top';

export type MenuProps = {
  openItem: string[];
  openComponent: string;
  selectedID: string | null;
  drawerOpen: boolean;
  componentDrawerOpen: boolean;
  menu: NavItemType;
  error: null;
};
