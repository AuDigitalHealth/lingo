import { Lock, LockOpen, TextFields } from '@mui/icons-material';
import { Box, Stack, useTheme } from '@mui/material';
import { ThemeMode } from '../../../../../types/config';
import { useEffect, useRef, useState } from 'react';
import {
  LinkBubbleMenu,
  MenuButton,
  RichTextEditor,
  TableBubbleMenu,
  type RichTextEditorRef,
} from 'mui-tiptap';
import EditorMenuControls from '../../comments/EditorMenuControls';
import useExtensions from '../../comments/useExtensions';
import { Ticket } from '../../../../../types/tickets/ticket';
import useTicketStore from '../../../../../stores/TicketStore';
import { LoadingButton } from '@mui/lab';
import { useUpdateTicket } from '../../../../../hooks/api/tickets/useUpdateTicket';

interface DescriptionEditorProps {
  ticket?: Ticket;
  onCancel?: () => void;
}
export default function DescriptionEditor({
  ticket,
  onCancel,
}: DescriptionEditorProps) {
  const extensions = useExtensions({
    placeholder: 'Add your comment here...',
  });
  const rteRef = useRef<RichTextEditorRef>(null);
  const [isEditable, setIsEditable] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showMenuBar, setShowMenuBar] = useState(false);

  const { mergeTickets } = useTicketStore();
  const theme = useTheme();
  const mutation = useUpdateTicket({ ticket });
  const { data, isError, isSuccess } = mutation;

  const [content, setContent] = useState(ticket?.description);

  useEffect(() => {
    setContent(ticket?.description);
  }, [ticket]);

  const handleSubmitEditor = () => {
    setIsEditable(false);
    setIsSending(true);
    const descriptionValue = rteRef.current?.editor?.getHTML() ?? '';
    if (ticket === undefined) return;
    ticket.description = descriptionValue;
    mutation.mutate(ticket);
  };

  useEffect(() => {
    if (data !== undefined) {
      mergeTickets(data);
    }
    if (isSuccess && onCancel) {
      onCancel();
    }
  }, [data, isSuccess, isError, mergeTickets]);

  return (
    <>
      <Box
        sx={{
          marginTop: '1em',
          width: '100%',
        }}
      >
        <RichTextEditor
          ref={rteRef}
          extensions={extensions}
          content={content}
          editable={isEditable}
          editorProps={{}}
          renderControls={() => <EditorMenuControls />}
          RichTextFieldProps={{
            variant: 'outlined',
            MenuBarProps: {
              hide: !showMenuBar,
            },
            // For toggling the display of the menu bar, and submitting the editor
            footer: (
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  background:
                    theme.palette.mode === ThemeMode.DARK
                      ? theme.palette.grey[100]
                      : theme.palette.grey[50],
                  borderTopStyle: 'solid',
                  borderTopWidth: 1,
                  borderTopColor: theme => theme.palette.divider,
                  py: 1,
                  px: 1.5,
                }}
              >
                <MenuButton
                  value="formatting"
                  tooltipLabel={
                    showMenuBar ? 'Hide formatting' : 'Show formatting'
                  }
                  size="small"
                  onClick={() => setShowMenuBar(currentState => !currentState)}
                  selected={showMenuBar}
                  IconComponent={TextFields}
                />

                <MenuButton
                  value="formatting"
                  tooltipLabel={
                    isEditable
                      ? 'Prevent edits (use read-only mode)'
                      : 'Allow edits'
                  }
                  size="small"
                  onClick={() => setIsEditable(currentState => !currentState)}
                  selected={!isEditable}
                  IconComponent={isEditable ? Lock : LockOpen}
                />
                <LoadingButton
                  variant="text"
                  size="small"
                  color="error"
                  sx={{ marginLeft: 'auto !important' }}
                  onClick={onCancel}
                >
                  Cancel
                </LoadingButton>
                <LoadingButton
                  variant="text"
                  size="small"
                  onClick={handleSubmitEditor}
                  loading={isSending}
                >
                  Save
                </LoadingButton>
              </Stack>
            ),
          }}
        >
          {() => (
            <>
              <LinkBubbleMenu />
              <TableBubbleMenu />
            </>
          )}
        </RichTextEditor>
      </Box>
    </>
  );
}
