import { ReactNode } from 'react';
import MainCard from '../../../components/MainCard';
import { CSSObject } from '@emotion/react';
import { useSortable } from '@dnd-kit/sortable';
import { UiSearchConfiguration } from '../../../types/tickets/ticket';

interface DraggableProps {
  children?: ReactNode;
  id: number;
  sx?: CSSObject;
  uiSearchConfiguration?: UiSearchConfiguration;
}
function UiConfigurationDraggable({
  children,
  id,
  uiSearchConfiguration,
  sx,
}: DraggableProps) {
  const { setNodeRef, attributes, listeners, transform } = useSortable({
    id: `${id}`,
    data: {
      type: 'Table',
      uiSearchConfiguration,
    },
  });
  const style = transform
    ? {
        opacity: '0.9',
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <MainCard
      ref={setNodeRef}
      style={{
        width: '100%',
        padding: 'none !important',
        ...style,
        ...sx,
      }}
      {...listeners}
      {...attributes}
    >
      {children}
    </MainCard>
  );
}

export default UiConfigurationDraggable;
