import { ReactElement } from 'react';
import { BranchState } from '../../types/task';
import { Avatar, Tooltip, styled } from '@mui/material';
import { RefreshOutlined } from '@mui/icons-material';
import { Theme } from '@mui/material/styles';

const StyledAvatar = styled(Avatar, {
  shouldForwardProp: prop => prop !== 'status',
})<{ branchState?: BranchState }>(({ theme, branchState }) => ({
  width: 'auto',
  height: 'auto',
  padding: '3px',
  borderColor: getColorByStatus(theme, branchState),
  backgroundColor: getColorByStatus(theme, branchState),
}));

const getColorByStatus = (theme: Theme, status: BranchState | undefined) => {
  switch (status) {
    case BranchState.Behind:
    case BranchState.Diverged:
      return theme.palette.warning.main;
    case BranchState.Stale:
      return theme.palette.error.main;
    default:
      return theme.palette.grey[500];
  }
};

interface RebaseIconProps {
  branchState?: BranchState;
}

export function RebaseIcon({ branchState }: RebaseIconProps) {
  const withTooltip = (
    icon: ReactElement,
    branchState: BranchState | undefined,
  ) => (
    <Tooltip title={branchState}>
      <StyledAvatar branchState={branchState}>{icon}</StyledAvatar>
    </Tooltip>
  );

  const getIconWithTooltip = (status: BranchState | undefined) => {
    switch (status) {
      case BranchState.Behind:
        return withTooltip(
          <RefreshOutlined fontSize="small" />,
          BranchState.Behind,
        );
      case BranchState.Stale:
        return withTooltip(
          <RefreshOutlined fontSize="small" />,
          BranchState.Stale,
        );
      case BranchState.Diverged:
        return withTooltip(
          <RefreshOutlined fontSize="small" />,
          BranchState.Diverged,
        );
      default:
        return <></>;
    }
  };

  const iconWithTooltip = getIconWithTooltip(branchState);

  return <>{iconWithTooltip}</>;
}
