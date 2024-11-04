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
import { Theme } from '@mui/material/styles';

// ==============================|| OVERRIDES - ICON BUTTON ||============================== //

export default function IconButton(theme: Theme) {
  return {
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
        sizeLarge: {
          width: theme.spacing(5.5),
          height: theme.spacing(5.5),
          fontSize: '1.25rem',
        },
        sizeMedium: {
          width: theme.spacing(4.5),
          height: theme.spacing(4.5),
          fontSize: '1rem',
        },
        sizeSmall: {
          width: theme.spacing(3.75),
          height: theme.spacing(3.75),
          fontSize: '0.75rem',
        },
      },
    },
  };
}
