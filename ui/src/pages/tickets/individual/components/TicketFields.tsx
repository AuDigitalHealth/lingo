import {
  AdditionalFieldTypeEnum,
  AdditionalFieldValue,
  LabelBasic,
  Ticket,
} from '../../../../types/tickets/ticket';
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
import { useState } from 'react';
import { LoadingButton } from '@mui/lab';
import TicketFieldsEdit from './edit/TicketFieldsEdit';

interface TicketFieldsProps {
  ticket?: Ticket;
  isCondensed?: boolean;
  editable?: boolean;
}
export default function TicketFields({
  ticket,
  isCondensed,
  editable,
}: TicketFieldsProps) {
  const { labelTypes } = useTicketStore();
  const [editMode, setEditMode] = useState(false);

  const createLabelBasic = (name: string, id: number): LabelBasic => {
    return {
      labelTypeId: id.toString(),
      labelTypeName: name,
    };
  };

  const theXs = isCondensed ? 3.5 : 1.5;
  const theMinWidth = isCondensed ? '400px' : '850px';

  const formatField = (item: AdditionalFieldValue) => {
    return item.additionalFieldType.type === AdditionalFieldTypeEnum.DATE
      ? new Date(Date.parse(item.valueOf)).toLocaleDateString('en-AU')
      : item.valueOf;
  };

  if (editMode) {
    return <TicketFieldsEdit ticket={ticket} setEditMode={setEditMode} />;
  } else {
    return (
      <>
        <Grid
          container
          spacing={2}
          sx={{ marginBottom: '20px', minWidth: theMinWidth }}
          key={'main-container'}
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
              {ticket?.labels?.map((label, index) => {
                const labelVal = createLabelBasic(label.name, label.id);
                return (
                  <Grid item key={index}>
                    <LabelChip labelTypeList={labelTypes} labelVal={labelVal} />
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
          {editable && (
            <LoadingButton
              variant="text"
              size="small"
              color="info"
              sx={{ marginLeft: 'auto', maxHeight: '2em' }}
              onClick={() => {
                setEditMode(true);
              }}
            >
              EDIT
            </LoadingButton>
          )}
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
            <Grid container spacing={2} sx={{ paddingLeft: 1, ml: '-12px' }}>
              {ticket?.['ticket-additional-fields']?.map((item, index) => {
                const title = item.additionalFieldType.description;
                return (
                  <Grid item xs="auto" key={index}>
                    <Card sx={{ padding: '5px' }}>
                      <CardActionArea>
                        <Typography variant="caption" fontWeight="bold">
                          {title}
                        </Typography>
                        <Divider></Divider>
                        <Typography variant="body1" sx={{ paddingTop: '5px' }}>
                          {formatField(item)}
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
          {ticket?.state?.label ? (
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
}
