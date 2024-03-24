import { ReactNode } from 'react';
import { useTheme } from '@mui/material/styles';
import { CSSObject } from '@emotion/react';
import { Stack } from '@mui/system';
import { UiSearchConfiguration } from '../../../types/tickets/ticket';

import { useSortable } from '@dnd-kit/sortable';
import { useFilterExists } from '../../../types/tickets/table';

interface DroppableProps {
  children?: ReactNode;
  id: number;
  sx?: CSSObject;
  uiSearchConfiguration:
    | UiSearchConfiguration
    | { id: number; grouping: number };
}

function Droppable({
  children,
  id,
  sx,
  uiSearchConfiguration,
}: DroppableProps) {
  const theme = useTheme();
  const filterExists = useFilterExists(uiSearchConfiguration);
  const { isOver, setNodeRef } = useSortable({
    id: `${id}`,
    data: {
      type: filterExists ? 'Table' : 'none',
      uiSearchConfiguration: filterExists ? uiSearchConfiguration : undefined,
    },
  });

  const style: CSSObject = {
    backgroundColor: isOver ? theme.palette.grey[300] : 'inherit',
    padding: '1em',
  };

  return (
    <Stack ref={setNodeRef} sx={{ ...sx, ...style, width: '100%' }}>
      {children}
    </Stack>
  );
}

export default Droppable;
