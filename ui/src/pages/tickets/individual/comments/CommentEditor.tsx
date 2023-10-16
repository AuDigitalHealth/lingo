import { Lock, LockOpen, TextFields } from '@mui/icons-material';
import { Box, Stack, useTheme } from '@mui/material';
import { ThemeMode } from '../../../../types/config';
import { useRef, useState } from 'react';
import {
  LinkBubbleMenu,
  MenuButton,
  RichTextEditor,
  TableBubbleMenu,
  type RichTextEditorRef,
} from 'mui-tiptap';
import EditorMenuControls from './EditorMenuControls';
import useExtensions from './useExtensions';
import TicketsService from '../../../../api/TicketsService';
import { Ticket } from '../../../../types/tickets/ticket';
import useTicketStore from '../../../../stores/TicketStore';
import { LoadingButton } from '@mui/lab';

const exampleContent = function fileListToImageFiles(
  fileList: FileList,
): File[] {
  // You may want to use a package like attr-accept
  // (https://www.npmjs.com/package/attr-accept) to restrict to certain file
  // types.
  return Array.from(fileList).filter(file => {
    const mimeType = (file.type || '').toLowerCase();
    return mimeType.startsWith('image/');
  });
};

interface CommentEditorProps {
  ticket: Ticket;
}
export default function CommentEditor({ ticket }: CommentEditorProps) {
  const extensions = useExtensions({
    placeholder: 'Add your comment here...',
  });
  const rteRef = useRef<RichTextEditorRef>(null);
  const [isEditable, setIsEditable] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showMenuBar, setShowMenuBar] = useState(false);

  const { mergeTickets } = useTicketStore();
  const theme = useTheme();

  const handleSubmitEditor = () => {
    setIsEditable(false);
    setIsSending(true);
    const commentValue = rteRef.current?.editor?.getHTML() ?? '';
    TicketsService.addTicketComment(ticket.id, commentValue)
      .then(comment => {
        if (comment !== undefined && comment !== null) {
          ticket.comments?.push(comment);
          mergeTickets(ticket);
          setIsEditable(true);
          setIsSending(false);
          rteRef.current?.editor?.commands.clearContent();
        }
      })
      .catch(err => {
        console.log(err);
        setIsEditable(true);
        setIsSending(false);
      });
  };

  return (
    <>
      <Box
        sx={{
          marginTop: '1em',
          // An example of how editor styles can be overridden. In this case,
          // setting where the scroll anchors to when jumping to headings. The
          // scroll margin isn't built in since it will likely vary depending on
          // where the editor itself is rendered (e.g. if there's a sticky nav
          // bar on your site).
          //   "& .ProseMirror": {
          //     "& h1, & h2, & h3, & h4, & h5, & h6": {
          //       scrollMarginTop: showMenuBar ? 50 : 0,
          //     },
          //   },
        }}
      >
        <RichTextEditor
          ref={rteRef}
          extensions={extensions}
          content={exampleContent}
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
                  variant="contained"
                  size="small"
                  sx={{ marginLeft: 'auto !important' }}
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
