import { Lock, LockOpen, TextFields } from '@mui/icons-material';
import { Box, Button, Stack, useTheme } from '@mui/material';
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

const exampleContent =
  //   '<h2 style="text-align: center">Hey there 👋</h2><p>This is a <em>basic</em> example of <code>mui-tiptap</code>, which combines <a target="_blank" rel="noopener noreferrer nofollow" href="https://tiptap.dev/">Tiptap</a> with customizable <a target="_blank" rel="noopener noreferrer nofollow" href="https://mui.com/">MUI (Material-UI)</a> styles, plus a suite of additional components and extensions! Sure, there are <strong>all <em>kinds</em> of <s>text</s> <u>formatting</u> options</strong> you’d probably expect from a rich text editor. But wait until you see the <span data-type="mention" data-id="15" data-label="Axl Rose">@Axl Rose</span> mentions and lists:</p><ul><li><p>That’s a bullet list with one …</p></li><li><p>… or two list items.</p></li></ul><p>Isn’t that great? And all of that is editable. <strong><span style="color: #ff9900">But wait, </span><span style="color: #403101"><mark data-color="#ffd699" style="background-color: #ffd699; color: inherit">there’s more!</mark></span></strong> Let’s try a code block:</p><pre><code class="language-css">body {\n  display: none;\n}</code></pre><p></p><p>That’s only the tip of the iceberg. Feel free to add and resize images:</p><img height="auto" src="http://placekitten.com/600/400" alt="kitten" width="350" style="aspect-ratio: 3 / 2"><p></p><p>Organize information in tables:</p><table><tbody><tr><th colspan="1" rowspan="1"><p>Name</p></th><th colspan="1" rowspan="1"><p>Role</p></th><th colspan="1" rowspan="1"><p>Team</p></th></tr><tr><td colspan="1" rowspan="1"><p>Alice</p></td><td colspan="1" rowspan="1"><p>PM</p></td><td colspan="1" rowspan="1"><p>Internal tools</p></td></tr><tr><td colspan="1" rowspan="1"><p>Bob</p></td><td colspan="1" rowspan="1"><p>Software</p></td><td colspan="1" rowspan="1"><p>Infrastructure</p></td></tr></tbody></table><p></p><p>Or write down your groceries:</p><ul data-type="taskList"><li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Milk</p></div></li><li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Eggs</p></div></li><li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Sriracha</p></div></li></ul><blockquote><p>Wow, that’s amazing. Good work! 👏 <br>— Mom</p></blockquote><p>Give it a try and click around!</p>';

  function fileListToImageFiles(fileList: FileList): File[] {
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

  const handleSubmitEditor = async () : Promise<void> => {
    setIsEditable(false);
    setIsSending(true);
    const commentValue = rteRef.current?.editor?.getHTML() ?? '';
    const comment = await TicketsService.addTicketComment(
      ticket.id,
      commentValue,
    );

    if (comment !== undefined && comment !== null) {
      ticket.comments?.push(comment);
      mergeTickets(ticket);
      setIsEditable(true);
      setIsSending(false);
      rteRef.current?.editor?.commands.clearContent();
    }
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

                <Button
                  variant="contained"
                  size="small"
                  sx={{ marginLeft: 'auto !important' }}
                  onClick={handleSubmitEditor}
                >
                  Save
                </Button>
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
