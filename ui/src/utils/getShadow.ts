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

// ==============================|| CUSTOM FUNCTION - COLOR SHADOWS ||============================== //

const getShadow = (theme: Theme, shadow: string) => {
  switch (shadow) {
    case 'secondary':
      return theme.customShadows.secondary;
    case 'error':
      return theme.customShadows.error;
    case 'warning':
      return theme.customShadows.warning;
    case 'info':
      return theme.customShadows.info;
    case 'success':
      return theme.customShadows.success;
    case 'primaryButton':
      return theme.customShadows.primaryButton;
    case 'secondaryButton':
      return theme.customShadows.secondaryButton;
    case 'errorButton':
      return theme.customShadows.errorButton;
    case 'warningButton':
      return theme.customShadows.warningButton;
    case 'infoButton':
      return theme.customShadows.infoButton;
    case 'successButton':
      return theme.customShadows.successButton;
    default:
      return theme.customShadows.primary;
  }
};

export default getShadow;
