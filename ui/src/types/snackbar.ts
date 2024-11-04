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

// material-ui
import { AlertProps, SnackbarOrigin } from '@mui/material';

// ==============================|| SNACKBAR TYPES  ||============================== //

export type SnackbarActionProps = {
  payload?: SnackbarProps;
};

export interface SnackbarProps {
  action: boolean;
  open: boolean;
  message: string;
  anchorOrigin: SnackbarOrigin;
  variant: string;
  alert: AlertProps;
  transition: string;
  close: boolean;
  actionButton: boolean;
  dense: boolean;
  maxStack: number;
  iconVariant: string;
}
