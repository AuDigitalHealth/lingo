import { LabelBasic, Ticket } from '../../../../types/tickets/ticket';
import { Card, CardActionArea, Chip, Divider, Grid, Typography } from '@mui/material';
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
      <Grid container spacing={2} sx={{marginBottom: '20px'}}>
        <Grid item>
          <Typography variant="caption" fontWeight="bold" sx={{display: 'block', width: '120px'}}>
            Labels:
          </Typography>
        </Grid>
        {ticket?.labels.map(label => {
          const labelVal = createLabelBasic(label.name, label.id);
          return (
            <Grid item>
              <LabelChip labelTypeList={labelTypes} labelVal={labelVal} />
            </Grid>
          );
        })}
      </Grid>
      <Grid container spacing={2} sx={{marginBottom: '20px'}}>
        <Grid item>
          <Typography variant="caption" fontWeight="bold" sx={{display: 'block', width: '120px'}}>
              Additional Fields:
          </Typography>
        </Grid>
        {ticket?.['ticket-additional-fields']?.map((item, index) => {
          const type = item.additionalFieldType.name;
          const length = ticket?.['ticket-additional-fields']?.length || 0;
          const seperator = index !== length - 1 ? ',   ' : ' ';
          return <Grid item xs={2}>
                  <Card sx={{padding: '5px'}}>
                    <CardActionArea>
                      <Typography variant="caption" fontWeight="bold">{type}</Typography>
                      <Divider></Divider>
                      <Typography variant="body1" sx={{paddingTop: '5px'}}>{item.valueOf}</Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
        })}
      </Grid>
      <Grid container spacing={2} sx={{marginBottom: '20px'}}>
        <Grid item>
          <Typography variant="caption" fontWeight="bold" sx={{display: 'block', width: '120px'}}>
            Iteration:
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="body1">{ticket?.iteration?.name}</Typography>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{marginBottom: '20px'}}>
        <Grid item>
          <Typography variant="caption" fontWeight="bold" sx={{display: 'block', width: '120px'}}>
            State:
          </Typography>
        </Grid>
        <Grid item>
          <Chip
            color={'primary'}
            label={ticket?.state.label}
            size="small"
            sx={{ color: 'white' }}
          />
        </Grid>
      </Grid>
    </>
  );
}
