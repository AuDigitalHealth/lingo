import { ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import MainCard from '../../../components/MainCard';
import { CSSObject } from '@emotion/react';

interface DraggableProps {
  children?: ReactNode;
  id: number;
  sx?: CSSObject;
}
function Draggable({ children, id, sx }: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `${id}`,
  });
  const style = transform
    ? {
        opacity: '0.7',
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <MainCard
      ref={setNodeRef}
      style={{ width: '100%', ...style, ...sx }}
      {...listeners}
      {...attributes}
    >
      {children}
    </MainCard>
  );
}

export default Draggable;
