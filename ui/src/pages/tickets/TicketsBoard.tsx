import { useState } from 'react';
import useTicketStore from '../../stores/TicketStore';
import TicketsService from '../../api/TicketsService';

import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  MouseSensor,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
} from '@dnd-kit/core';
import TicketColumn from './components/TicketColumn';
import { Stack } from '@mui/system';

function TicketsBoard() {
  const { availableStates, getTicketById, mergeTickets } = useTicketStore();

  const [isDropped, setIsDropped] = useState(false);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  });

  const sensors = useSensors(
    useSensor(MouseSensor),
    pointerSensor,
    useSensor(KeyboardSensor),
    useSensor(TouchSensor),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && active.id && over && over.id !== undefined) {
      const ticket = getTicketById(Number(active.id));
      if (ticket !== undefined && ticket.state) {
        ticket.state.id = Number(over.id);
        TicketsService.updateTicketState(ticket)
          .then(updatedTicket => {
            mergeTickets(updatedTicket);
          })
          .catch(err => {
            console.log(isDropped);
            console.log(err);
          });
      }

      setIsDropped(true);
    }
  }

  return (
    <Stack width={'100%'} height={'100%'} gap={3} direction={'row'}>
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        {availableStates.map(state => {
          return <TicketColumn state={state} key={state.id} />;
        })}
      </DndContext>
    </Stack>
  );
}

export default TicketsBoard;
