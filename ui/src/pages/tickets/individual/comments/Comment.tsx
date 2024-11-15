import { useTheme } from '@mui/material/styles';
import { Comment, Ticket } from '../../../../types/tickets/ticket';
import MainCard from '../../../../components/MainCard';

import { ThemeMode } from '../../../../types/config';
import { Grid, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import Dot from '../../../../components/@extended/Dot';
import GravatarWithTooltip from '../../../../components/GravatarWithTooltip';

import { RichTextReadOnly } from 'mui-tiptap';
import useExtensions from './useExtensions';
import useUserStore from '../../../../stores/UserStore';
import { LoadingButton } from '@mui/lab';
import { JiraUser } from '../../../../types/JiraUserResponse';
import { useEffect, useState } from 'react';
import { findJiraUserFromList } from '../../../../utils/helpers/userUtils';
import ConfirmationModal from '../../../../themes/overrides/ConfirmationModal';
import {
  removeHtmlTags,
  truncateString,
} from '../../../../utils/helpers/stringUtils';
import { useJiraUsers } from '../../../../hooks/api/useInitializeJiraUsers';
import { useDeleteComment } from '../../../../hooks/api/tickets/useUpdateTicket';
import CommentEditor from './CommentEditor';

interface Props {
  comment: Comment;
  ticket: Ticket;
}

const CommentView = ({ comment, ticket }: Props) => {
  const theme = useTheme();
  const { jiraUsers } = useJiraUsers();
  const { login } = useUserStore();
  const extensions = useExtensions();
  const [author, setAuthor] = useState<JiraUser>();

  const [editMode, setEditMode] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const deleteMutation = useDeleteComment();

  useEffect(() => {
    const createdBy = findJiraUserFromList(comment.createdBy, jiraUsers);
    const modifiedBy = findJiraUserFromList(comment.modifiedBy, jiraUsers);
    setAuthor(modifiedBy || createdBy);
  }, [setAuthor, comment.createdBy, comment.modifiedBy, jiraUsers]);

  const deleteComment = () => {
    deleteMutation.mutate(
      { ticket: ticket, commentId: comment.id },
      {
        onSuccess: () => {
          setDeleteModalOpen(false);
        },
      },
    );
  };

  let defaultUser = comment.createdBy;
  if (!defaultUser) {
    const jiraExport = ticket.labels?.find(
      label => label.name === 'JiraExport',
    );
    if (jiraExport) {
      defaultUser = 'System';
    }
  }
  const { isModified, formattedDate } = getFormattedDate(comment);

  return (
    <>
      <ConfirmationModal
        open={deleteModalOpen}
        content={`Confirm delete for ${removeHtmlTags(
          truncateString(comment.text, 50),
        )}?`}
        handleClose={() => {
          setDeleteModalOpen(false);
        }}
        title={'Confirm Delete'}
        disabled={deleteMutation.isPending}
        action={'Delete'}
        handleAction={deleteComment}
      />
      <MainCard
        content={false}
        sx={{
          background:
            theme.palette.mode === ThemeMode.DARK
              ? theme.palette.grey[100]
              : theme.palette.grey[50],
          p: 1.5,
          mt: 1.25,
        }}
      >
        <Stack direction={'column'} gap={2}>
          <Stack alignItems="centre" direction={'row'} width={'100%'} gap={1}>
            <Stack>
              {author !== undefined && (
                <GravatarWithTooltip username={comment.createdBy} size={25} />
              )}
            </Stack>
            {editMode ? (
              <Stack sx={{ width: '100%' }}>
                <CommentEditor
                  ticket={ticket}
                  comment={comment}
                  setEditMode={setEditMode}
                />
              </Stack>
            ) : (
              <Grid item xs zeroMinWidth>
                <Grid
                  container
                  alignItems="center"
                  spacing={1}
                  justifyContent="space-between"
                >
                  <Grid item>
                    <Typography
                      align="left"
                      variant="subtitle1"
                      component="div"
                    >
                      {author?.displayName ? author.displayName : defaultUser}
                    </Typography>
                  </Grid>

                  <Stack direction="row" alignItems="center" gap={0.5}>
                    {comment.createdBy === login && (
                      <>
                        <LoadingButton
                          data-testid={`ticket-comment-edit-${comment.id}`}
                          variant="text"
                          size="small"
                          color="info"
                          sx={{ height: '20px', fontSize: '0.75em' }}
                          onClick={() => setEditMode(true)}
                        >
                          EDIT
                        </LoadingButton>
                        <LoadingButton
                          data-testid={`ticket-comment-delete-${comment.id}`}
                          variant="text"
                          size="small"
                          color="error"
                          sx={{ height: '20px', fontSize: '0.75em' }}
                          onClick={() => setDeleteModalOpen(true)}
                        >
                          DELETE
                        </LoadingButton>
                      </>
                    )}
                    <Dot size={6} sx={{ mt: -0.25 }} color="secondary" />
                    <Typography variant="caption" color="secondary">
                      {(isModified ? 'Edited ' : '') + formattedDate}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            )}
          </Stack>
          {!editMode && (
            <Stack sx={{ width: '100%' }}>
              <RichTextReadOnly
                content={comment.text}
                extensions={extensions}
              />
            </Stack>
          )}
        </Stack>
      </MainCard>
    </>
  );
};

function getFormattedDate(comment: Comment) {
  const isModified = comment.version && comment?.version > 0;

  const displayedDate = isModified
    ? (comment.modified as string)
    : comment.created;

  const formattedDate = new Date(Date.parse(displayedDate)).toLocaleString(
    'en-AU',
  );

  return {
    formattedDate,
    isModified: isModified,
  };
}

export default CommentView;
