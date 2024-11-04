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

// material ui
import { Theme } from '@mui/material/styles';
import {
  ButtonProps,
  ChipProps,
  IconButtonProps,
  SliderProps,
} from '@mui/material';

// ==============================|| EXTENDED COMPONENT - TYPES  ||============================== //

export type ButtonVariantProps =
  | 'contained'
  | 'light'
  | 'outlined'
  | 'dashed'
  | 'text'
  | 'shadow';
export type IconButtonShapeProps = 'rounded' | 'square';
type TooltipColor =
  | 'primary'
  | 'secondary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'default';
export type ColorProps =
  | ChipProps['color']
  | ButtonProps['color']
  | IconButtonProps['color']
  | SliderProps['color']
  | TooltipColor;
export type AvatarTypeProps = 'filled' | 'outlined' | 'combined';
export type SizeProps = 'badge' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ExtendedStyleProps = {
  color: ColorProps;
  theme: Theme;
};
