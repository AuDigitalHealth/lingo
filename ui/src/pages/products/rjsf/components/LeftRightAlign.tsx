import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';

interface LeftRightAlignProps {
  left: React.ReactNode;
  right?: React.ReactNode;
  gap?: number;
  sx?: SxProps<Theme>; // container styles
  leftSx?: SxProps<Theme>; // styles applied to left box
  rightSx?: SxProps<Theme>;
  center?: boolean;
}

const LeftRightAlign: React.FC<LeftRightAlignProps> = ({
  left,
  right,
  gap = 1,
  sx = {},
  leftSx = {},
  rightSx = {},
  center = true,
}) => {
  return (
    <Box
      display="flex"
      alignItems={center ? 'center' : 'flex-start'}
      gap={gap}
      sx={{
        width: '100%',
        ...sx,
      }}
    >
      {/* Left content — flexible, supports nested form elements */}
      <Box
        flex={1}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          '& .MuiFormControl-root': {
            width: '100%',
            minWidth: 0,
          },
          '& .MuiInputBase-root': {
            flexWrap: 'wrap',
          },
          ...leftSx, // apply custom left styles
        }}
      >
        {left}
      </Box>

      {right && (
        <Box
          flexShrink={0}
          display="flex"
          alignItems="center"
          justifyContent="flex-end"
          sx={rightSx}
        >
          {right}
        </Box>
      )}
    </Box>
  );
};

export default LeftRightAlign;
