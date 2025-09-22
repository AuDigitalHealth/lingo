import useUserStore from '../../../stores/UserStore';
import { Task, TaskStatus } from '../../../types/task';

export interface UseReviewProps {
  task: Task | null | undefined;
  branch?: string;
}

export function useIsReviewEnabled({ task }: UseReviewProps) {
  const userLogin = useUserStore().login;
  // const inReview = task?.status === TaskStatus.InReview;
  const inReview =
    task?.status === TaskStatus.InReview ||
    task?.status === TaskStatus.ReviewCompleted;

  const userInReviewList = task?.reviewers?.filter(reviewer => {
    return reviewer.username === userLogin;
  });
  const isUserReviewer =
    userInReviewList !== undefined && userInReviewList.length > 0;

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
