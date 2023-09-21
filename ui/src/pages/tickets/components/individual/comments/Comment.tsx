import { useTheme } from '@mui/material/styles';
import { Comment } from '../../../../../types/tickets/ticket';
import MainCard from '../../../../../components/MainCard';

import { ThemeMode } from '../../../../../types/config';
import { Grid, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import Dot from '../../../../../components/@extended/Dot';
import GravatarWithTooltip from '../../../../../components/GravatarWithTooltip';
import useJiraUserStore from '../../../../../stores/JiraUserStore';
import { timeSince } from '../../../../../utils/helpers/dateUtils';

import { RichTextReadOnly } from 'mui-tiptap';
import useExtensions from './useExtensions';

interface Props {
  comment: Comment;
}

const CommentView = ({ comment }: Props) => {
  const theme = useTheme();
  const { jiraUsers } = useJiraUserStore();
  // const commentHtml = toHTML(commentText);
  // console.log(commentHtml);
  const extensions = useExtensions();
  return (
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
              <GravatarWithTooltip
                username={comment.createdBy}
                userList={jiraUsers}
                size={25}
              />
            </Grid>
            <Grid item xs zeroMinWidth>
              <Grid
                container
                alignItems="center"
                spacing={1}
                justifyContent="space-between"
              >
                <Grid item>
                  <Typography align="left" variant="subtitle1" component="div">
                    cgillespie
                  </Typography>
                </Grid>
                <Grid item>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Dot size={6} sx={{ mt: -0.25 }} color="secondary" />
                    <Typography variant="caption" color="secondary">
                      {timeSince(comment.created)}
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
  );
};

export default CommentView;
