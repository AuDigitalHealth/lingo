import { useTheme } from '@mui/material/styles';
import { Comment, Ticket } from '../../../../types/tickets/ticket';
import MainCard from '../../../../components/MainCard';

import { ThemeMode } from '../../../../types/config';
import { Grid, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import Dot from '../../../../components/@extended/Dot';
import GravatarWithTooltip from '../../../../components/GravatarWithTooltip';
import useJiraUserStore from '../../../../stores/JiraUserStore';

import { RichTextReadOnly } from 'mui-tiptap';
import useExtensions from './useExtensions';
import useUserStore from '../../../../stores/UserStore';
import { LoadingButton } from '@mui/lab';
import TicketsService from '../../../../api/TicketsService';
import useTicketStore from '../../../../stores/TicketStore';
import { JiraUser } from '../../../../types/JiraUserResponse';
import { useEffect, useState } from 'react';
import { findJiraUserFromList } from '../../../../utils/helpers/userUtils';
import ConfirmationModal from '../../../../themes/overrides/ConfirmationModal';
import {
  removeHtmlTags,
  truncateString,
} from '../../../../utils/helpers/stringUtils';

interface Props {
  comment: Comment;
  ticket: Ticket;
}

const CommentView = ({ comment, ticket }: Props) => {
  const theme = useTheme();
  const { jiraUsers } = useJiraUserStore();
  const { login } = useUserStore();
  const extensions = useExtensions();
  const [author, setAuthor] = useState<JiraUser>();
  const { mergeTickets } = useTicketStore();

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const createdBy = findJiraUserFromList(comment.createdBy, jiraUsers);
    const modifiedBy = findJiraUserFromList(comment.modifiedBy, jiraUsers);
    setAuthor(modifiedBy || createdBy);
  });

  const deleteComment = () => {
    setDeleteLoading(true);
    TicketsService.deleteTicketComment(comment.id, ticket.id)
      .then(res => {
        if (res.status === 200) {
          const tempComments = ticket.comments?.filter(tempComment => {
            return tempComment.id !== comment.id;
          });
          ticket.comments = tempComments;
          mergeTickets(ticket);
        }
      })
      .catch(err => console.log(err))
      .finally(() => setDeleteLoading(false));
  };

  let defaultUser = ticket.assignee;
  if (!defaultUser) {
    const jiraExport = ticket.labels?.find(
      label => label.name === 'JiraExport',
    );
    if (jiraExport) {
      defaultUser = 'System';
    }
  }
  const createdDate =
    comment.jiraCreated || comment.modified || comment.created;
  const created = new Date(Date.parse(createdDate)).toLocaleString('en-AU');
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
        disabled={deleteLoading}
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
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Grid container wrap="nowrap" alignItems="center" spacing={1}>
              <Grid item>
                {author !== undefined && (
                  <GravatarWithTooltip
                    username={comment.createdBy}
                    userList={jiraUsers}
                    size={25}
                  />
                )}
              </Grid>
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
                  <Grid item>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {comment.createdBy === login && (
                        <LoadingButton
                          variant="text"
                          size="small"
                          color="error"
                          sx={{ height: '20px', fontSize: '0.75em' }}
                          onClick={() => setDeleteModalOpen(true)}
                        >
                          DELETE
                        </LoadingButton>
                      )}
                      <Dot size={6} sx={{ mt: -0.25 }} color="secondary" />
                      <Typography
                        variant="caption"
                        color="secondary"
                        sx={{ textTransform: 'uppercase' }}
                      >
                        {created}
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} sx={{ '&.MuiGrid-root': { pt: 1.5 } }}>
            <RichTextReadOnly content={comment.text} extensions={extensions} />
          </Grid>
        </Grid>
      </MainCard>
    </>
  );
};

export default CommentView;
