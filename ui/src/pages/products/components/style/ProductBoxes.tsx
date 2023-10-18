import { styled, useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import { ReactNode } from 'react';

interface BoxProps {
  children?: ReactNode;
  component?: React.ElementType<any> | undefined;
}
export const Level1Box = ({ children, component }: BoxProps) => {
  const theme = useTheme();

  const StyledBox = styled(Box)({
    border: `1px solid ${theme.palette.divider}`,
    color: '#6495ed ',
    fontWeight: 'bold',
    fontSize: 'larger',
  });

  return <StyledBox component={component}>{children}</StyledBox>;
};

export const Level2Box = ({ children, component }: BoxProps) => {
  const theme = useTheme();

  const StyledBox = styled(Box)({
    border: `1px solid ${theme.palette.divider}`,
    color: '#CD7F32',
    fontWeight: 'bold',
    fontSize: 'medium',
  });

  return <StyledBox component={component}>{children}</StyledBox>;
};

export const OuterBox = ({ children, component }: BoxProps) => {
  const theme = useTheme();

  const StyledBox = styled(Box)({
    border: `1px solid ${theme.palette.divider}`,
    color: 'green',
    fontWeight: 'bold',
    fontSize: 'medium',
    marginBottom: '15px',
  });

  return <StyledBox component={component}>{children}</StyledBox>;
};

export const InnerBox = ({ children, component }: BoxProps) => {
  const StyledBox = styled(Box)({
    border: '0 solid #f0f0f0',
    color: '#003665',
    marginTop: '10px',
    marginBottom: '10px',
    fontSize: 'small',
  });

  return <StyledBox component={component}>{children}</StyledBox>;
};
