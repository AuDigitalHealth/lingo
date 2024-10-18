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

// project import
import Default from './default';
import Theme1 from './theme1';
import Theme2 from './theme2';
import Theme3 from './theme3';
import Theme4 from './theme4';
import Theme5 from './theme5';
import Theme6 from './theme6';
import Theme7 from './theme7';
import Theme8 from './theme8';

// types
import { PaletteThemeProps } from '../../types/theme';
import { PalettesProps } from '@ant-design/colors';
import { ThemeMode, PresetColor } from '../../types/config';

// ==============================|| PRESET THEME - THEME SELECTOR ||============================== //

const Theme = (
  colors: PalettesProps,
  presetColor: PresetColor,
  mode: ThemeMode,
): PaletteThemeProps => {
  switch (presetColor) {
    case 'theme1':
      return Theme1(colors, mode);
    case 'theme2':
      return Theme2(colors, mode);
    case 'theme3':
      return Theme3(colors, mode);
    case 'theme4':
      return Theme4(colors, mode);
    case 'theme5':
      return Theme5(colors, mode);
    case 'theme6':
      return Theme6(colors, mode);
    case 'theme7':
      return Theme7(colors, mode);
    case 'theme8':
      return Theme8(colors, mode);
    default:
      return Default(colors);
  }
};

export default Theme;
