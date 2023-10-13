import { Stack } from '@mui/system';
import { Ticket } from '../../../../types/tickets/ticket';
import GravatarWithTooltip from '../../../../components/GravatarWithTooltip';
import useJiraUserStore from '../../../../stores/JiraUserStore';
import {
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Clear, Done, RestartAlt } from '@mui/icons-material';
import { useUpdateTicket } from '../../../../hooks/api/tickets/useUpdateTicket';
import useTicketStore from '../../../../stores/TicketStore';
import { LoadingButton } from '@mui/lab';
import CustomTicketAssigneeSelection from '../../components/grid/CustomTicketAssigneeSelection';

interface TicketHeaderProps {
  ticket?: Ticket;
  editable?: boolean;
}
export default function TicketHeader({
  ticket,
  editable = false,
}: TicketHeaderProps) {
  const { jiraUsers } = useJiraUserStore();
  const [title, setTitle] = useState(ticket?.title);
  const [editMode, setEditMode] = useState(false);

  const mutation = useUpdateTicket({ ticket });
  const { mergeTickets } = useTicketStore();
  const { isError, isSuccess, data } = mutation;

  const [error, setError] = useState(false);
  const errorMessage = 'Invalid Title';

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
      mutation.mutate(ticket);
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
  }, [data, isSuccess, isError]);

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
              userList={jiraUsers}
              size={40}
            />
            <Typography variant="caption" fontWeight="bold">
              Assignee
            </Typography>
          </div>
        )}
        {editMode ? (
          <>
            <TextField
              id="ticket-title"
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
                    <IconButton>
                      <Done onClick={handleTitleSave} />
                    </IconButton>
                    <IconButton>
                      <RestartAlt
                        onClick={() => {
                          setTitle(ticket?.title);
                        }}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              onChange={e => {
                handleTitleChange(e.target.value);
              }}
            />
            <LoadingButton
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
          <Stack direction="row" width="100%" alignItems="center">
            <Typography variant="h3" sx={{ width: '80%' }}>
              {ticket?.title}
            </Typography>
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
          </Stack>
        )}
      </Stack>
      <Stack direction="row" width="100%" paddingTop="1em">
        <Typography variant="body1">
          Created by {ticket?.createdBy} on{' '}
          {new Date(ticket?.created || 0).toLocaleDateString()}
        </Typography>
      </Stack>
    </>
  );
}
