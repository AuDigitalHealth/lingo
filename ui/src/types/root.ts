///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { ComponentClass, FunctionComponent } from 'react';

// material-ui
/* eslint-disable */
import { SvgIconTypeMap } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';

// types
import { AuthProps } from './auth';
import { MenuProps } from './menu';
import { SnackbarProps } from './snackbar';

// ==============================|| ROOT TYPES  ||============================== //

export type RootStateProps = {
  auth: AuthProps;
  menu: MenuProps;
  snackbar: SnackbarProps;
};

export type KeyedObject = {
  [key: string]: string | number | KeyedObject | any;
};

export type OverrideIcon =
  | (OverridableComponent<SvgIconTypeMap<{}, 'svg'>> & {
      muiName: string;
    })
  | ComponentClass<any>
  | FunctionComponent<any>;

export interface GenericCardProps {
  title?: string;
  primary?: string | number | undefined;
  secondary?: string;
  content?: string;
  image?: string;
  dateTime?: string;
  iconPrimary?: OverrideIcon;
  color?: string;
  size?: string;
}
