import useTaskByKey from '../../../../hooks/useTaskByKey.tsx';
import { useFeedbackUnread } from '../../../../hooks/api/task/useConceptsForReview.js';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { Task } from '../../../../types/task.ts';
import { Ticket } from '../../../../types/tickets/ticket.ts';
import {
  ConceptReview,
  ReviewMessage,
  ReviewMessagePost,
  ReviewedList,
} from '../../../../types/ConceptReview.ts';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import MailIcon from '@mui/icons-material/Mail';
import MarkunreadIcon from '@mui/icons-material/Markunread';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BaseModal from '../../../../components/modal/BaseModal.js';
import BaseModalHeader from '../../../../components/modal/BaseModalHeader.js';
import BaseModalBody from '../../../../components/modal/BaseModalBody.js';
import BaseModalFooter from '../../../../components/modal/BaseModalFooter.js';
import useUserStore from '../../../../stores/UserStore.js';
import AvatarWithTooltip from '../../../../components/AvatarWithTooltip.js';
import { useApproveReviewMutation } from '../../../../hooks/api/task/useApproveReviewMutation.js';
import { useConceptsThatHaveBeenReviewed } from '../../../../hooks/api/task/useConceptsThatHaveBeenReviewed.js';
import {
  LinkBubbleMenu,
  MenuButton,
  MenuButtonBold,
  MenuButtonBulletedList,
  MenuButtonItalic,
  MenuButtonOrderedList,
  MenuControlsContainer,
  RichTextEditor,
  RichTextEditorRef,
  TableBubbleMenu,
} from 'mui-tiptap';
import useExtensions from '../../../tickets/individual/comments/useExtensions.ts';
import { ThemeMode } from '../../../../types/config.ts';
import { LoadingButton } from '@mui/lab';
import { Lock, LockOpen, TextFields } from '@mui/icons-material';
import { usePostReviewMessageMutation } from '../../../../hooks/api/task/usePostReviewMessageMutation.tsx';
import { useFeedbackUnreadMutation } from '../../../../hooks/api/task/useFeedbackUnreadMutation.tsx';
import {
  useIsReviewEnabled,
  useShowReviewControls,
} from '../../../../hooks/api/task/useReviews.tsx';
import { usePendingMutations } from './usePendingMutations.tsx';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

interface ConceptReviewsProps {
  conceptReview: ConceptReview | undefined;
  branch: string;
  ticket?: Ticket;
}

function ConceptReviews({ conceptReview }: ConceptReviewsProps) {
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const task = useTaskByKey();
  const projectKey = task?.projectKey;
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const taskKey = task?.key;
  const showReviewControls = useShowReviewControls({ task });
  const isReviewEnabled = useIsReviewEnabled({ task });
  const { conceptsReviewed } = useConceptsThatHaveBeenReviewed(
    projectKey,
    taskKey,
    showReviewControls,
  );
  const approveReviewMutation = useApproveReviewMutation();

  const { isAnyMutationPending, addPendingMutation, removePendingMutation } =
    usePendingMutations();
  const conceptId = conceptReview?.concept?.id;

  useEffect(() => {
    if (approveReviewMutation.isPending && conceptId) {
      addPendingMutation(conceptId);
    } else if (conceptId) {
      removePendingMutation(conceptId);
    }
  }, [
    approveReviewMutation.isPending,
    conceptId,
    addPendingMutation,
    removePendingMutation,
  ]);

  // Check if we're on the review route with feedback-open for this concept
  useEffect(() => {
    const reviewConceptId = params.conceptId;
    const isFeedbackRoute = location.pathname.includes('/feedback-open');
    if (
      reviewConceptId === conceptReview?.concept?.conceptId &&
      isFeedbackRoute
    ) {
      setMessageModalOpen(true);
    }
  }, [params.conceptId, conceptReview?.concept?.conceptId, location.pathname]);

  if (!conceptReview) {
    return <></>;
  }

  const messageCount = conceptReview?.reviews?.messages?.length;

  const handleToggleMessageModalOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMessageModalOpen(!messageModalOpen);
  };

  const handleCloseModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMessageModalOpen(false);
    // Navigate back if we're on a feedback-open route
    if (params.conceptId && location.pathname.includes('/feedback-open')) {
      navigate(`/dashboard/tasks/edit/${taskKey}/review/${params.conceptId}`);
    }
  };

  const handleToggleReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    let currentReviewedList = conceptsReviewed;

    if (!conceptReview.concept?.id) {
      console.error('Missing required data for review toggle');
      return;
    }

    const conceptId = conceptReview.concept.id;
    let updatedConceptIds: string[];

    if (!currentReviewedList) {
      currentReviewedList = {
        conceptIds: [],
        approvalDate: new Date().toISOString(),
      };
    }
    if (conceptReview.approved) {
      // If currently approved, remove from the list
      updatedConceptIds = currentReviewedList.conceptIds.filter(
        id => id !== conceptId,
      );
    } else {
      // If not approved, add to the list (avoid duplicates)
      updatedConceptIds = currentReviewedList.conceptIds.includes(conceptId)
        ? currentReviewedList.conceptIds
        : [...currentReviewedList.conceptIds, conceptId];
    }

    const updatedReviewedList: ReviewedList = {
      conceptIds: updatedConceptIds,
      approvalDate: new Date().toISOString(),
    };

    // Call the mutation
    approveReviewMutation.mutate({
      projectKey: projectKey as string,
      taskKey: taskKey as string,
      reviewedList: updatedReviewedList,
    });
  };

  return (
    <>
      {task && messageModalOpen && (
        <ReviewMessageModal
          open={messageModalOpen}
          handleClose={handleCloseModal}
          conceptReview={conceptReview}
          task={task}
        />
      )}

      <Grid container justifyContent="flex-end" alignItems="center">
        {conceptReview.unread ? (
          <Tooltip title="Unread">
            <Badge
              badgeContent="!"
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                },
              }}
            >
              <IconButton onClick={handleToggleMessageModalOpen}>
                <MarkunreadIcon color="primary" />
              </IconButton>
            </Badge>
          </Tooltip>
        ) : (
          <Tooltip title="Read">
            {messageCount ? (
              <Badge
                badgeContent={messageCount}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  },
                }}
              >
                <IconButton onClick={handleToggleMessageModalOpen}>
                  <MailIcon color="action" />
                </IconButton>
              </Badge>
            ) : (
              <IconButton onClick={handleToggleMessageModalOpen}>
                <MailIcon color="action" />
              </IconButton>
            )}
          </Tooltip>
        )}
        {conceptReview.approved ? (
          <Tooltip title="Approved">
            <IconButton
              onClick={handleToggleReview}
              disabled={!isReviewEnabled || isAnyMutationPending}
            >
              <ThumbUpIcon
                color={
                  !isReviewEnabled || isAnyMutationPending
                    ? 'disabled'
                    : 'success'
                }
              />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Not Approved">
            <IconButton
              onClick={handleToggleReview}
              disabled={!isReviewEnabled || isAnyMutationPending}
            >
              <ThumbUpIcon
                color={
                  !isReviewEnabled || isAnyMutationPending
                    ? 'disabled'
                    : 'action'
                }
              />
            </IconButton>
          </Tooltip>
        )}
      </Grid>
    </>
  );
}

interface ReviewMessageModalProps {
  conceptReview: ConceptReview;
  open: boolean;
  handleClose: (e: React.MouseEvent) => void;
  task: Task;
}

function ReviewMessageModal({
  conceptReview,
  open,
  handleClose,
  task,
}: ReviewMessageModalProps) {
  const messages = conceptReview?.reviews?.messages;
  const projectKey = task?.projectKey;
  const taskKey = task?.key;
  const { data: unreadConceptIds, isPending: isFeedUnreadPending } =
    useFeedbackUnread(projectKey, taskKey, true);
  const hasUnread = unreadConceptIds?.includes(
    conceptReview.conceptId as string,
  );

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    const reviewUrl = `/dashboard/tasks/edit/${taskKey}/review/${conceptReview?.concept?.conceptId}/feedback-open`;
    window.open(reviewUrl, '_blank');
  };

  const mutation = useFeedbackUnreadMutation();

  const handleToggleFeedbackRead = () => {
    const tempConceptIds = unreadConceptIds || [];
    const thisConceptId = conceptReview?.conceptId as string;

    const updatedConceptIds = tempConceptIds.includes(thisConceptId)
      ? tempConceptIds.filter(id => id !== thisConceptId)
      : [...tempConceptIds, thisConceptId];

    mutation.mutate({
      projectKey: projectKey as string,
      taskKey: taskKey as string,
      conceptIds: updatedConceptIds,
    });
  };

  useEffect(() => {
    if (hasUnread) {
      const tempConceptIds = unreadConceptIds || [];
      const thisConceptId = conceptReview?.conceptId as string;

      const updatedConceptIds = tempConceptIds.includes(thisConceptId)
        ? tempConceptIds.filter(id => id !== thisConceptId)
        : [...tempConceptIds, thisConceptId];

      mutation.mutate({
        projectKey: projectKey as string,
        taskKey: taskKey as string,
        conceptIds: updatedConceptIds,
      });
    }
    // it is meant to only run once on render
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <BaseModal open={open} handleClose={handleClose}>
        <BaseModalHeader
          title={`Review Messages for ${conceptReview?.concept?.idAndFsnTerm}`}
        />
        <BaseModalBody>
          {messages && messages.length > 0 ? (
            <Stack spacing={2}>
              {messages.map(message => (
                <ReviewMessageRender key={message.id} message={message} />
              ))}
            </Stack>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No messages found for this review.
            </Typography>
          )}
          <ReviewMessageEditor
            conceptId={conceptReview?.concept?.conceptId as string}
          />
        </BaseModalBody>
        <BaseModalFooter
          startChildren={
            <LoadingButton
              sx={{ color: '#fff' }}
              onClick={handleToggleFeedbackRead}
              variant="contained"
              loading={mutation.isPending || isFeedUnreadPending}
            >
              {hasUnread ? 'Mark Feedback Read' : 'Mark Feedback Unread'}
            </LoadingButton>
          }
          endChildren={
            <Stack flexDirection={'row'} gap={1}>
              <Tooltip title="Open review in new tab">
                <IconButton onClick={handleOpenInNewTab}>
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button variant="contained" onClick={handleClose}>
                Close
              </Button>
            </Stack>
          }
        />
      </BaseModal>
    </>
  );
}

interface ReviewMessageRenderProps {
  message: ReviewMessage;
}

function ReviewMessageRender({ message }: ReviewMessageRenderProps) {
  const user = useUserStore();
  const isCurrentUser = user?.login === message.fromUsername;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        p: 2,
        backgroundColor: isCurrentUser ? 'action.hover' : 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <AvatarWithTooltip username={message.fromUsername} size={'sm'} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {message.fromUsername}
            {isCurrentUser && (
              <Chip
                label="You"
                size="small"
                variant="outlined"
                sx={{ ml: 1, height: 20 }}
              />
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(message.creationDate).toLocaleString()}
          </Typography>
          {message.feedbackRequested && (
            <Chip
              label="Feedback Requested"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 20 }}
            />
          )}
        </Box>

        <Box
          dangerouslySetInnerHTML={{ __html: message.messageHtml }}
          sx={{
            '& *': {
              fontSize: 'inherit',
              lineHeight: 'inherit',
            },
          }}
        />

        {message.subjectConceptIds && message.subjectConceptIds.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Related concepts: {message.subjectConceptIds.join(', ')}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

interface ReviewMessageEditorProps {
  conceptId: string;
}

function ReviewMessageEditor({ conceptId }: ReviewMessageEditorProps) {
  const task = useTaskByKey();
  const projectKey = task?.projectKey;
  const taskKey = task?.key;
  const mutation = usePostReviewMessageMutation({
    projectKey: projectKey as string,
    taskKey: taskKey as string,
  });
  const { isPending: isFeedUnreadPending } = useFeedbackUnread(
    projectKey,
    taskKey,
    true,
  );
  const extensions = useExtensions({
    placeholder: 'Add your comment here...',
  });

  const rteRef = useRef<RichTextEditorRef>(null);

  const [isEditable, setIsEditable] = useState(true);
  const [showMenuBar, setShowMenuBar] = useState(false);
  const [requestFollowUp, setRequestFollowUp] = useState(false);
  const theme = useTheme();

  const handleSubmitEditor = () => {
    const message: ReviewMessagePost = {
      event: 'new',
      feedbackRequested: requestFollowUp,
      messageHtml: rteRef.current?.editor?.getHTML() ?? '',
      subjectConceptIds: [conceptId],
    };

    mutation.mutate(
      {
        projectKey: projectKey as string,
        taskKey: taskKey as string,
        message,
        conceptId,
      },
      {
        onSuccess: () => {
          rteRef.current?.editor?.commands.clearContent();
        },
      },
    );
  };

  return (
    <>
      <Box
        data-testid="ticket-comment-edit"
        sx={{
          marginTop: '1em',
          width: '100%',
        }}
      >
        <RichTextEditor
          ref={rteRef}
          extensions={extensions}
          editable={isEditable}
          editorProps={{}}
          renderControls={() => <ReviewEditorMenuControls />}
          RichTextFieldProps={{
            variant: 'outlined',
            MenuBarProps: {
              hide: !showMenuBar,
            },
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
                <Box style={{ marginLeft: 'auto' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={requestFollowUp}
                        disabled={mutation.isPending || isFeedUnreadPending}
                        onClick={() => {
                          setRequestFollowUp(!requestFollowUp);
                        }}
                      />
                    }
                    label="Request follow-up"
                  />
                  <LoadingButton
                    data-testid="ticket-comment-submit"
                    variant="contained"
                    size="small"
                    onClick={handleSubmitEditor}
                    loading={mutation.isPending || isFeedUnreadPending}
                    disabled={mutation.isPending || isFeedUnreadPending}
                    sx={{ color: 'white' }}
                  >
                    Save
                  </LoadingButton>
                </Box>
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

function ReviewEditorMenuControls() {
  return (
    <MenuControlsContainer>
      <MenuButtonBold />
      <MenuButtonItalic />
      <MenuButtonOrderedList />
      <MenuButtonBulletedList />
    </MenuControlsContainer>
  );
}

export default ConceptReviews;
