import { ReactElement } from 'react';
import { TaskStatus } from '../../types/task';
import { Avatar, Tooltip, styled } from '@mui/material';
import {
  CheckRounded,
  EditNoteRounded,
  FileDownloadDoneRounded,
  HelpCenterRounded,
  PlaylistAddCheckRounded,
  PlaylistAddRounded,
  PlaylistRemoveRounded,
  RuleRounded,
} from '@mui/icons-material';
import { Theme } from '@mui/material/styles';

const StyledAvatar = styled(Avatar, {
  shouldForwardProp: prop => prop !== 'status',
})<{ status?: TaskStatus }>(({ theme, status }) => ({
  width: 'auto',
  height: 'auto',
  padding: '3px',
  borderColor: getColorByStatus(theme, status),
  backgroundColor: getColorByStatus(theme, status),
}));

const getColorByStatus = (theme: Theme, status: TaskStatus | undefined) => {
  switch (status) {
    case TaskStatus.Completed:
    case TaskStatus.Promoted:
    case TaskStatus.ReviewCompleted:
      return theme.palette.success.main;
    case TaskStatus.InProgress:
      return theme.palette.primary.main;
    case TaskStatus.InReview:
    case TaskStatus.New:
      return theme.palette.warning.main;
    case TaskStatus.Deleted:
    case TaskStatus.Unknown:
      return theme.palette.error.main;
    default:
      return theme.palette.grey[500];
  }
};

interface TaskStatusIconProps {
  status?: TaskStatus;
}

export function TaskStatusIcon({ status }: TaskStatusIconProps) {
  const withTooltip = (icon: ReactElement, status: TaskStatus | undefined) => (
    <Tooltip title={status}>
      <StyledAvatar status={status}>{icon}</StyledAvatar>
    </Tooltip>
  );

  const getIconWithTooltip = (status: TaskStatus | undefined) => {
    switch (status) {
      case TaskStatus.Completed:
        return withTooltip(
          <FileDownloadDoneRounded fontSize="small" />,
          TaskStatus.Completed,
        );
      case TaskStatus.Promoted:
        return withTooltip(
          <CheckRounded fontSize="small" />,
          TaskStatus.Promoted,
        );
      case TaskStatus.InProgress:
        return withTooltip(
          <EditNoteRounded fontSize="small" />,
          TaskStatus.InProgress,
        );
      case TaskStatus.InReview:
        return withTooltip(
          <RuleRounded fontSize="small" />,
          TaskStatus.InReview,
        );
      case TaskStatus.ReviewCompleted:
        return withTooltip(
          <PlaylistAddCheckRounded fontSize="small" />,
          TaskStatus.ReviewCompleted,
        );
      case TaskStatus.New:
        return withTooltip(
          <PlaylistAddRounded fontSize="small" />,
          TaskStatus.New,
        );
      case TaskStatus.Deleted:
        return withTooltip(
          <PlaylistRemoveRounded fontSize="small" />,
          TaskStatus.Deleted,
        );
      case TaskStatus.Unknown:
        return withTooltip(
          <HelpCenterRounded fontSize="small" />,
          TaskStatus.Unknown,
        );
      default:
        return withTooltip(
          <PlaylistRemoveRounded fontSize="small" />,
          TaskStatus.Deleted,
        );
    }
  };

  const iconWithTooltip = getIconWithTooltip(status);

  return <>{iconWithTooltip}</>;
}
