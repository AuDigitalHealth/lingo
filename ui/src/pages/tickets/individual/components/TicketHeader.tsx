import { Stack } from '@mui/system';
import { Ticket } from '../../../../types/tickets/ticket';
import GravatarWithTooltip from '../../../../components/GravatarWithTooltip';
import {
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Done, RestartAlt } from '@mui/icons-material';
import { usePatchTicket } from '../../../../hooks/api/tickets/useUpdateTicket';
import useTicketStore from '../../../../stores/TicketStore';
import { LoadingButton } from '@mui/lab';
import CustomTicketAssigneeSelection from '../../components/grid/CustomTicketAssigneeSelection';
import { useCanEditTicketById } from '../../../../hooks/api/tickets/useCanEditTicket';
import { useJiraUsers } from '../../../../hooks/api/useInitializeJiraUsers';

interface TicketHeaderProps {
  ticket?: Ticket;
  editable?: boolean;
}
export default function TicketHeader({
  ticket,
  editable = false,
}: TicketHeaderProps) {
  const { jiraUsers } = useJiraUsers();
  const [title, setTitle] = useState(ticket?.title);
  const [editMode, setEditMode] = useState(false);
  const { canEdit } = useCanEditTicketById(ticket?.id.toString());

  const patchTicketMutation = usePatchTicket();
  const { mergeTicket: mergeTickets } = useTicketStore();
  const { isError, isSuccess, data } = patchTicketMutation;

  const [error, setError] = useState(false);
  const errorMessage = 'Invalid Title';
  const theme = useTheme();

  useEffect(() => {
    setTitle(ticket?.title);
  }, [ticket, editMode]);

  const handleTitleChange = (newTitle: string) => {
    const titleWithoutWithspace = newTitle?.trim();
    if (titleWithoutWithspace === '' || titleWithoutWithspace === undefined) {
      setError(true);
    } else {
      setError(false);
    }
    setTitle(newTitle);
  };

  const handleTitleSave = () => {
    const titleWithoutWithspace = title?.trim();
    if (titleWithoutWithspace !== '' && titleWithoutWithspace !== undefined) {
      if (ticket === undefined) return;
      ticket.title = titleWithoutWithspace;
      patchTicketMutation.mutate({ updatedTicket: ticket });
    } else {
      setError(true);
    }
  };

  useEffect(() => {
    if (data !== undefined) {
      mergeTickets(data);
    }
    if (isSuccess) {
      setEditMode(false);
    }
  }, [data, isSuccess, isError, mergeTickets, setEditMode]);

  return (
    <>
      <Stack direction="row" width="100%" alignItems="center" gap={'1em'}>
        {editMode ? (
          <div
            style={{
              width: '10%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <CustomTicketAssigneeSelection
              id={ticket?.id.toString()}
              userList={jiraUsers}
              user={ticket?.assignee}
              outlined={true}
              label={true}
            />
          </div>
        ) : (
          <div
            style={{
              width: '10%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <GravatarWithTooltip
              useFallback={true}
              username={ticket?.assignee}
              size={40}
            />
            <Typography variant="caption" fontWeight="bold">
              Assignee
            </Typography>
          </div>
        )}
        {editMode && canEdit ? (
          <>
            <TextField
              id="ticket-title-edit"
              label="Title"
              variant="standard"
              value={title}
              fullWidth
              sx={{ padding: '0px 1em' }}
              error={error}
              helperText={error ? errorMessage : ''}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      id="ticket-title-save"
                      onClick={handleTitleSave}
                    >
                      <Done />
                    </IconButton>
                    <IconButton
                      id="ticket-title-save-cancel"
                      onClick={() => {
                        setTitle(ticket?.title);
                      }}
                    >
                      <RestartAlt />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              onChange={e => {
                handleTitleChange(e.target.value);
              }}
            />
            <LoadingButton
              id="ticket-header-edit-close"
              variant="text"
              size="small"
              color="info"
              sx={{ marginLeft: 'auto', maxHeight: '2em' }}
              onClick={() => {
                setEditMode(false);
              }}
            >
              CLOSE
            </LoadingButton>
          </>
        ) : (
          <Stack
            direction="column"
            width="100%"
            alignItems="flex-start"
            spacing={0.5}
          >
            <Typography
              id="ticket-number"
              sx={{ color: `${theme.palette.grey[500]}` }}
            >
              {ticket?.ticketNumber}
            </Typography>
            <Typography variant="h3" id="ticket-title">
              {ticket?.title}
            </Typography>
            {editable && (
              <LoadingButton
                id="ticket-header-edit"
                variant="text"
                size="small"
                color="info"
                sx={{ alignSelf: 'flex-end', maxHeight: '2em' }}
                onClick={() => {
                  setEditMode(true);
                }}
              >
                EDIT
              </LoadingButton>
            )}
          </Stack>
        )}
      </Stack>
      <Stack direction="row" width="100%" paddingTop="1em">
        <Typography
          variant="body1"
          sx={{ color: `${theme.palette.grey[500]}` }}
        >
          Created by {ticket?.createdBy} on{' '}
          {new Date(ticket?.created || 0).toLocaleDateString()}
          {ticket?.modifiedBy
            ? `, Last updated by ${ticket.modifiedBy} on ${new Date(ticket.modified || 0).toLocaleDateString()} `
            : ''}
        </Typography>
      </Stack>
    </>
  );
}
