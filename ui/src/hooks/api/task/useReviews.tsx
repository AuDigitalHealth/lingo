import useUserStore from '../../../stores/UserStore';
import { TaskStatus, Task } from '../../../types/task';
import { useConceptsForReview } from './useConceptsForReview';

interface UseReviewProps {
  task: Task | null | undefined;
  branch?: string;
}

export function useIsReviewEnabled({ task }: UseReviewProps) {
  const userLogin = useUserStore().login;
  const inReview = task?.status === TaskStatus.InReview;
  const isUserReviewer =
    task?.reviewers?.filter(reviewer => {
      reviewer.username === userLogin;
    }).length !== undefined;
  const isReviewDisabled = !inReview || !isUserReviewer;

  return !isReviewDisabled;
}

export function useShowReviewControls({ task }: UseReviewProps) {
  return (
    task?.status === TaskStatus.InReview ||
    task?.status === TaskStatus.ReviewCompleted ||
    task?.status === TaskStatus.Completed
  );
}

export function useCanCompleteReview({ task, branch }: UseReviewProps) {
  const isReviewEnabled = useIsReviewEnabled({ task });
  const { conceptReviews, isLoadingConceptReviews } =
    useConceptsForReview(branch);

  const allApproved =
    conceptReviews.find(conceptReview => {
      return conceptReview.approved === false;
    }) === undefined;

  return isReviewEnabled && allApproved;
}
