import React, { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useTheme } from '@mui/material/styles';
import { CSSObject } from '@emotion/react';
import { Stack } from '@mui/system';

interface DroppableProps {
  children?: ReactNode;
  id: number;
  sx?: CSSObject;
}

function Droppable({ children, id, sx }: DroppableProps) {
  const theme = useTheme();
  const { isOver, setNodeRef } = useDroppable({
    id: `${id}`,
  });
  const style: CSSObject = {
    backgroundColor: isOver ? theme.palette.grey[300] : 'inherit',
    padding: '1em',
  };

  return (
    <Stack gap={1} ref={setNodeRef} sx={{ ...sx, ...style, width: '100%' }}>
      {children}
    </Stack>
    // <div ref={setNodeRef} style={{width: '100%',...style}}>

    // </div>
  );
}

export default Droppable;
