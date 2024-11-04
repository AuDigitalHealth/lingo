import { Lock, LockOpen, TextFields } from '@mui/icons-material';
import { Box, Stack, useTheme } from '@mui/material';
import { ThemeMode } from '../../../../types/config.ts';
import { Dispatch, SetStateAction, useRef, useState } from 'react';
import {
  LinkBubbleMenu,
  MenuButton,
  RichTextEditor,
  TableBubbleMenu,
  type RichTextEditorRef,
} from 'mui-tiptap';
import EditorMenuControls from './EditorMenuControls.tsx';
import useExtensions from './useExtensions.ts';
import { Ticket, Comment } from '../../../../types/tickets/ticket.ts';
import { LoadingButton } from '@mui/lab';
import UnableToEditTicketTooltip from '../../components/UnableToEditTicketTooltip.tsx';
import { useUpdateComment } from '../../../../hooks/api/tickets/useUpdateTicket.tsx';

interface CommentEditorProps {
  ticket: Ticket;
  comment: Comment;
  setEditMode: Dispatch<SetStateAction<boolean>>;
}
const CommentEditor = ({
  ticket,
  comment,
  setEditMode,
}: CommentEditorProps) => {
  const extensions = useExtensions();
  const rteRef = useRef<RichTextEditorRef>(null);
  const [isEditable, setIsEditable] = useState(true);
  const [showMenuBar, setShowMenuBar] = useState(false);
  const theme = useTheme();

  const mutation = useUpdateComment();

  const handleSubmitEditor = () => {
    // setIsEditable(false);
    const commentValue = rteRef.current?.editor?.getHTML() ?? '';
    // Create a new updatedComment object, with the text field updated
    const updatedComment = { ...comment, text: commentValue };
    // Pass the updatedComment object to the mutation
    mutation.mutate(
      { ticket, comment: updatedComment },
      {
        onSuccess: () => {
          setEditMode(false);
        },
      },
    );
  };

  return (
    <>
      <Box data-testid="ticket-comment-edit">
        <RichTextEditor
          ref={rteRef}
          extensions={extensions}
          content={comment.text}
          editable={isEditable && !mutation.isPending}
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
                <Stack style={{ marginLeft: 'auto' }} direction={'row'} gap={1}>
                  <LoadingButton
                    data-testid="ticket-comment-submit"
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => {
                      setEditMode(false);
                    }}
                    loading={mutation.isPending}
                    disabled={false}
                    sx={{ color: 'white' }}
                  >
                    Cancel
                  </LoadingButton>
                  <UnableToEditTicketTooltip canEdit={true}>
                    <LoadingButton
                      data-testid="ticket-comment-submit"
                      variant="contained"
                      size="small"
                      onClick={handleSubmitEditor}
                      loading={mutation.isPending}
                      disabled={false}
                      sx={{ color: 'white' }}
                    >
                      Update
                    </LoadingButton>
                  </UnableToEditTicketTooltip>
                </Stack>
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
};

export default CommentEditor;
