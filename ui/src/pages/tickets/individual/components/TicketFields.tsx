import { LabelBasic, Ticket } from '../../../../types/tickets/ticket';
import {
  Card,
  CardActionArea,
  Chip,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import LabelChip from '../../components/LabelChip';
import useTicketStore from '../../../../stores/TicketStore';

interface TicketFieldsProps {
  ticket?: Ticket;
  isCondensed?: boolean;
}
export default function TicketFields({
  ticket,
  isCondensed,
}: TicketFieldsProps) {
  const { labelTypes } = useTicketStore();

  const createLabelBasic = (name: string, id: number): LabelBasic => {
    return {
      labelTypeId: id.toString(),
      labelTypeName: name,
    };
  };

  const theXs = isCondensed ? 3.5 : 1.5;
  const theMinWidth = isCondensed ? '400px' : '850px';

  return (
    <>
      <Grid
        container
        spacing={2}
        sx={{ marginBottom: '20px', minWidth: theMinWidth }}
      >
        <Grid item xs={theXs} key={'label-label'}>
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '120px' }}
          >
            Labels:
          </Typography>
        </Grid>
        <Grid
          item
          xs={8}
          sx={{ padding: '0px !important' }}
          key={'labels-container'}
        >
          <Grid container spacing={2} sx={{ margin: 0, padding: 0 }}>
            {ticket?.labels.map(label => {
              const labelVal = createLabelBasic(label.name, label.id);
              return (
                <Grid item key={label.id}>
                  <LabelChip labelTypeList={labelTypes} labelVal={labelVal} />
                </Grid>
              );
            })}
          </Grid>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
        <Grid item xs={theXs} key={'additionalfields-label'}>
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '120px' }}
          >
            Additional Fields:
          </Typography>
        </Grid>
        <Grid
          item
          xs={8}
          sx={{ ml: '-12px' }}
          key={'additionalfields-container'}
        >
          <Grid container spacing={2} sx={{ paddingLeft: 1 }}>
            {ticket?.['ticket-additional-fields']?.map(item => {
              const type = item.additionalFieldType.name;
              return (
                <Grid item xs="auto" key={item.id}>
                  <Card sx={{ padding: '5px' }}>
                    <CardActionArea>
                      <Typography variant="caption" fontWeight="bold">
                        {type}
                      </Typography>
                      <Divider></Divider>
                      <Typography variant="body1" sx={{ paddingTop: '5px' }}>
                        {item.valueOf}
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
        <Grid item xs={theXs} key={'iteration-label'}>
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '120px' }}
          >
            Iteration:
          </Typography>
        </Grid>
        {ticket?.iteration?.name ? (
          <Grid item key={ticket.iteration?.id}>
            <Chip
              color={'warning'}
              label={ticket?.iteration?.name}
              size="small"
              sx={{ color: 'black' }}
            />
          </Grid>
        ) : (
          <></>
        )}
      </Grid>
      <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
        <Grid item xs={theXs} key={'state-label'}>
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '120px' }}
          >
            State:
          </Typography>
        </Grid>
        {ticket?.state.label ? (
          <Grid item key={ticket?.state.id}>
            <Chip
              color={'primary'}
              label={ticket?.state.label}
              size="small"
              sx={{ color: 'white' }}
            />
          </Grid>
        ) : (
          <></>
        )}
      </Grid>
    </>
  );
}
