/* eslint-disable */
import { ReactNode } from 'react';

import { createTheme, ThemeProvider, Theme } from '@mui/material/styles';

type ECLBuilderThemeProviderProps = {
  children: ReactNode;
};

export default function ECLBuilderThemeProvider({
  children,
}: ECLBuilderThemeProviderProps) {
  const eclBuilderTheme = (outerTheme: Theme) => {
    return createTheme({
      ...outerTheme,
      components: {
        ...outerTheme.components,
        MuiIconButton: {
          styleOverrides: {
            root: {
              borderRadius: 4,
            },
          },
        },
      },
    });
  };

  return (
    <ThemeProvider theme={(theme: Theme) => eclBuilderTheme(theme)}>
      {children}
    </ThemeProvider>
  );
}
