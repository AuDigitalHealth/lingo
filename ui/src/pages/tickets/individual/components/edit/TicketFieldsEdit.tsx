import { LabelBasic, Ticket } from '../../../../../types/tickets/ticket';
import {
  Card,
  CardActionArea,
  Chip,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import LabelChip from '../../../components/LabelChip';
import useTicketStore from '../../../../../stores/TicketStore';
import { useState } from 'react';
import { LoadingButton } from '@mui/lab';
import LabelSelect from './LabelSelect';
import { Stack } from '@mui/system';
import AdditionalFieldInput from './AdditionalFieldInput';
import CustomIterationSelection from '../../../components/grid/CustomIterationSelection';

interface TicketFieldsEditProps {
  ticket?: Ticket;
  isCondensed?: boolean;
  setEditMode: (bool: boolean) => void;
}
export default function TicketFieldsEdit({
  ticket,
  isCondensed,
  setEditMode,
}: TicketFieldsEditProps) {
  const { labelTypes, additionalFieldTypes } = useTicketStore();

  const theXs = isCondensed ? 3.5 : 1.5;

  return (
    <>
      <Stack gap={1} alignItems="normal">
        <Stack flexDirection="row" alignItems="center">
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '120px' }}
          >
            Labels:
          </Typography>
          <LabelSelect ticket={ticket} />
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
            sx={{ display: 'block', width: '120px' }}
          >
            Additional Fields:
          </Typography>
          <Grid container columnSpacing={1} rowSpacing={2}>
            {additionalFieldTypes.map(type => (
              <Grid item key={type.id} xl={3} lg={3} xs={6}>
                <AdditionalFieldInput type={type} ticket={ticket} />
              </Grid>
            ))}
          </Grid>
        </Stack>

        <Stack flexDirection="row">
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '120px' }}
          >
            Iteration:
          </Typography>
          <CustomIterationSelection />
        </Stack>

        {/* <Grid container sx={{ marginBottom: '20px' }}>
        <Grid item xs={theXs}>
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '120px' }}
          >
            Additional Fields:
          </Typography>
        </Grid>
        <Grid container spacing={2} xs={8} sx={{ ml: '-12px' }}>
          {ticket?.['ticket-additional-fields']?.map(item => {
            const type = item.additionalFieldType.name;
            return (
              <Grid item>
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
      <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
        <Grid item xs={theXs}>
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '120px' }}
          >
            Iteration:
          </Typography>
        </Grid>
        {ticket?.iteration?.name ? (
          <Grid item>
            <Chip
              color={'warning'}
              label={ticket?.iteration?.name}
              size="small"
              sx={{ color: 'black' }}
            />
          </Grid>
        ) : (
          <div />
        )}
      </Grid>
      <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
        <Grid item xs={theXs}>
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ display: 'block', width: '120px' }}
          >
            State:
          </Typography>
        </Grid>
        {ticket?.state.label ? (
          <Grid item>
            <Chip
              color={'primary'}
              label={ticket?.state.label}
              size="small"
              sx={{ color: 'white' }}
            />
          </Grid>
        ) : (
          <div />
        )}
      </Grid> */}
      </Stack>
    </>
  );
}
