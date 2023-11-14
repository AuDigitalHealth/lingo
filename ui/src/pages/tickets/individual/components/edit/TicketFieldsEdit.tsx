import { Ticket } from '../../../../../types/tickets/ticket';
import { Typography } from '@mui/material';
import useTicketStore from '../../../../../stores/TicketStore';
import { LoadingButton } from '@mui/lab';
import LabelSelect from './LabelSelect';
import { Stack } from '@mui/system';
import AdditionalFieldInput from './AdditionalFieldInput';
import CustomIterationSelection from '../../../components/grid/CustomIterationSelection';
import CustomStateSelection from '../../../components/grid/CustomStateSelection';
import CustomPrioritySelection from '../../../components/grid/CustomPrioritySelection';
import { useState } from 'react';
import TaskAssociationFieldInput from './TaskAssociationFieldInput';

interface TicketFieldsEditProps {
  ticket?: Ticket;
  setEditMode: (bool: boolean) => void;
}
export default function TicketFieldsEdit({
  ticket,
  setEditMode,
}: TicketFieldsEditProps) {
  const { additionalFieldTypes, iterations, availableStates, priorityBuckets } =
    useTicketStore();

  return (
    <>
      <Stack gap={1} alignItems="normal">
        <Stack flexDirection="row" alignItems="center">
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '150px' }}
          >
            Labels:
          </Typography>
          <LabelSelect ticket={ticket} border={true} />
          {
            <LoadingButton
              variant="text"
              size="small"
              color="info"
              sx={{ marginLeft: 'auto', maxHeight: '2em' }}
              onClick={() => {
                setEditMode(false);
              }}
            >
              Close
            </LoadingButton>
          }
        </Stack>
        <Stack flexDirection="row">
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '150px' }}
          >
            Additional Fields:
          </Typography>
          <Stack
            flexDirection="row"
            width="calc(100% - 150px)"
            gap={2}
            flexWrap={'wrap'}
          >
            {additionalFieldTypes.map(type => (
              <Stack width="300px" key={type.id}>
                <AdditionalFieldInput type={type} ticket={ticket} />
              </Stack>
            ))}
          </Stack>
        </Stack>

        <Stack flexDirection="row">
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '150px' }}
          >
            Iteration:
          </Typography>
          <CustomIterationSelection
            border={true}
            iterationList={iterations}
            id={ticket?.id.toString()}
            iteration={ticket?.iteration}
          />
        </Stack>

        <Stack flexDirection="row">
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '150px' }}
          >
            State:
          </Typography>
          <CustomStateSelection
            border={true}
            stateList={availableStates}
            id={ticket?.id.toString()}
            state={ticket?.state}
          />
        </Stack>
        <Stack flexDirection="row">
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '150px' }}
          >
            Priority:
          </Typography>
          <CustomPrioritySelection
            border={true}
            id={ticket?.id.toString()}
            priorityBucketList={priorityBuckets}
            priorityBucket={ticket?.priorityBucket}
          />
        </Stack>
        <TaskAssociationFieldInput ticket={ticket} />
      </Stack>
    </>
  );
}
