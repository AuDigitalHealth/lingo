import { Stack } from '@mui/system';
import { LabelBasic, Ticket } from '../../../../types/tickets/ticket';
import { Typography } from '@mui/material';
import LabelChip from '../../components/LabelChip';
import useTicketStore from '../../../../stores/TicketStore';

interface TicketFieldsProps {
  ticket?: Ticket;
}
export default function TicketFields({ ticket }: TicketFieldsProps) {
  const { labelTypes } = useTicketStore();

  const createLabelBasic = (name: string, id: number): LabelBasic => {
    return {
      labelTypeId: id.toString(),
      labelTypeName: name,
    };
  };

  return (
    <>
      <Stack direction="row" width="100%" alignItems="center">
        <Typography variant="caption" fontWeight="bold">
          Labels:
        </Typography>
        {ticket?.['ticket-labels']?.map(label => {
          const labelVal = createLabelBasic(label.name, label.id);
          return (
            <div style={{ marginLeft: '1em' }}>
              <LabelChip labelTypeList={labelTypes} labelVal={labelVal} />
            </div>
          );
        })}
      </Stack>
      <Stack direction="row" width="100%" alignItems="center" marginTop="0.5em">
        <Typography variant="caption" fontWeight="bold">
          Additional Fields:
        </Typography>
        {ticket?.['ticket-additional-fields']?.map((item, index) => {
          const type = item.additionalFieldType;
          const length = ticket?.['ticket-additional-fields']?.length || 0;
          const seperator = index !== length - 1 ? ',   ' : ' ';
          const fieldText = ' ' + type?.name + ': ' + item.valueOf + seperator;
          return <Typography variant="body1">{fieldText}</Typography>;
        })}
      </Stack>
      <Stack direction="row" width="100%" alignItems="center" marginTop="0.5em">
        <Typography variant="caption" fontWeight="bold">
          Iteration:
        </Typography>
        <Typography variant="body1">{ticket?.iteration?.name}</Typography>
      </Stack>
      <Stack direction="row" width="100%" alignItems="center" marginTop="0.5em">
        <Typography variant="caption" fontWeight="bold">
          State:
        </Typography>
        <Typography variant="body1">{ticket?.state.label}</Typography>
      </Stack>
    </>
  );
}
