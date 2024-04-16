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
import TaskAssociationFieldInput from './TaskAssociationFieldInput';
import CustomScheduleSelection from '../../../components/grid/CustomScheduleSelection';

import UnableToEditTicketTooltip from '../../../components/UnableToEditTicketTooltip.tsx';
import { useCanEditTicketById } from '../../../../../hooks/api/tickets/useCanEditTicket.tsx';

interface TicketFieldsEditProps {
  ticket?: Ticket;
  setEditMode: (bool: boolean) => void;
}
export default function TicketFieldsEdit({
  ticket,
  setEditMode,
}: TicketFieldsEditProps) {
  const {
    additionalFieldTypes,
    iterations,
    availableStates,
    priorityBuckets,
    schedules,
  } = useTicketStore();
  const [canEdit] = useCanEditTicketById(ticket?.id.toString());

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
              id="ticket-fields-edit-close"
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
                <AdditionalFieldInput
                  type={type}
                  ticket={ticket}
                  canEdit={canEdit}
                />
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

          <UnableToEditTicketTooltip canEdit={canEdit}>
            <CustomIterationSelection
              border={true}
              iterationList={iterations}
              id={ticket?.id.toString()}
              iteration={ticket?.iteration}
            />
          </UnableToEditTicketTooltip>
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
            ticket={ticket}
            state={ticket?.state}
            refreshCache={true}
          />
        </Stack>
        <Stack flexDirection="row">
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '150px' }}
          >
            Schedule:
          </Typography>
          <CustomScheduleSelection
            ticket={ticket}
            border={true}
            scheduleList={schedules}
            id={ticket?.id.toString()}
            schedule={ticket?.schedule}
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
            ticket={ticket}
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
