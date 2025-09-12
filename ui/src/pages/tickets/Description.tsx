import { Box, InputLabel, useTheme } from '@mui/material';
import { ThemeMode } from '../../types/config';
import MainCard from '../../components/MainCard';
import { Stack } from '@mui/system';
import { RichTextReadOnly } from 'mui-tiptap';
import useExtensions from './individual/comments/useExtensions';
import { LoadingButton } from '@mui/lab';
import { useCallback, useState } from 'react';
import DescriptionEditor from './individual/components/edit/DescriptionEditor';
import { Ticket } from '../../types/tickets/ticket';
import { useCanEditTicket } from '../../hooks/api/tickets/useCanEditTicket.tsx';
import UnableToEditTicketTooltip from './components/UnableToEditTicketTooltip.tsx';
import { useInternalUsers } from '../../hooks/api/useInitializeJiraUsers';

interface DescriptionProps {
  ticket?: Ticket;
  editable?: boolean;
}

export default function Description({ ticket, editable }: DescriptionProps) {
  const { internalUsers } = useInternalUsers();
  const isInternalUser = !!(
    internalUsers &&
    ticket?.createdBy &&
    internalUsers.some((user: string) => user === ticket?.createdBy)
  );

  const theme = useTheme();
  const extensions = useExtensions();
  const [editMode, setEditMode] = useState(false);
  const setEditModeStable = useCallback((bool: boolean) => {
    setEditMode(bool);
  }, []);
  const { canEdit } = useCanEditTicket(ticket);

  // Disable editing if created by internal user
  const canEditDescription = canEdit && !isInternalUser;

  if (editMode) {
    return <DescriptionEditor ticket={ticket} onCancel={setEditModeStable} />;
  } else {
    return (
      <Stack direction="column" width="100%" marginTop="0.5em">
        <InputLabel sx={{ mt: 0.5 }}>Description:</InputLabel>
        <MainCard
          content={false}
          sx={{
            width: '100%',
            padding: '1rem',
            background:
              theme.palette.mode === ThemeMode.DARK
                ? theme.palette.grey[100]
                : theme.palette.grey[50],
            p: 1.5,
            mt: 1.25,
          }}
        >
          <RichTextReadOnly
            content={ticket?.description}
            extensions={extensions}
          />
          {editable && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Box sx={{ marginLeft: 'auto' }}>
                <UnableToEditTicketTooltip
                  canEdit={canEdit}
                  isInternalUser={isInternalUser}
                >
                  <LoadingButton
                    id="ticket-description-edit"
                    variant="text"
                    size="small"
                    color="info"
                    sx={{ marginLeft: 'auto !important' }}
                    onClick={() => {
                      setEditMode(true);
                    }}
                    disabled={!canEditDescription}
                  >
                    EDIT
                  </LoadingButton>
                </UnableToEditTicketTooltip>
              </Box>
            </Stack>
          )}
        </MainCard>
      </Stack>
    );
  }
}
