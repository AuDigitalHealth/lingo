import { useMemo } from 'react';
import { ClassificationStatus, TaskStatus, Task } from '../../../types/task';
import { Activity, ConceptReview } from '../../../types/ConceptReview';
import { useTaskActivities } from './useTaskActivities';

interface PromotionFlag {
  checkTitle: string;
  checkWarning: string | null;
  blocksPromotion: boolean;
}

interface UseCanPromoteTaskProps {
  task: Task | undefined | null;
  conceptReviews: ConceptReview[] | null | undefined;
  hasUnsavedConcepts?: boolean;
  deletedCrsConceptFound?: boolean;
}

interface UseCanPromoteTaskResult {
  promotable: boolean;
  warnings: PromotionFlag[];
  blockingIssues: PromotionFlag[];
}

export function useCanPromoteTask({
  task,
  conceptReviews,
  hasUnsavedConcepts = false,
  deletedCrsConceptFound = false,
}: UseCanPromoteTaskProps): UseCanPromoteTaskResult {
  const activities = useTaskActivities(task?.branchPath, true);

  const result = useMemo(() => {
    const flags: PromotionFlag[] = [];
    if (!task) return { promotable: false, warnings: [], blockingIssues: [] };
    // Early validation checks
    if (!task.branchPath) {
      flags.push({
        checkTitle: 'Branch Not Provided',
        checkWarning:
          'Branch not provided to promotion verification service. This is a fatal error: contact an administrator',
        blocksPromotion: true,
      });
      return { promotable: false, warnings: [], blockingIssues: flags };
    }

    // Check for unsaved concepts
    if (hasUnsavedConcepts) {
      flags.push({
        checkTitle: 'Unsaved concepts found',
        checkWarning:
          'There are some unsaved concepts. Please save them before promoting task automation.',
        blocksPromotion: true,
      });
    }

    // Check branch state
    if (
      task.branchState === 'BEHIND' ||
      task.branchState === 'DIVERGED' ||
      task.branchState === 'STALE'
    ) {
      flags.push({
        checkTitle: 'Task and Project Diverged',
        checkWarning:
          'The task and project are not synchronized. Pull in changes from the project before promotion.',
        blocksPromotion: true,
      });
    }

    if (task.branchState === 'UP_TO_DATE') {
      flags.push({
        checkTitle: 'No Changes To Promote',
        checkWarning:
          'The task is up to date with respect to the project. No changes to promote.',
        blocksPromotion: true,
      });
    }

    // Check task review status
    if (task.status !== 'In Review' && task.status !== 'Review Completed') {
      if (
        !task.feedBackMessageStatus ||
        task.feedBackMessageStatus === 'none'
      ) {
        flags.push({
          checkTitle: 'No review completed',
          checkWarning:
            'No review has been completed on this task, are you sure you would like to promote?',
          blocksPromotion: false,
        });
      }
    }

    if (task.status === 'In Review') {
      flags.push({
        checkTitle: 'Task is still in review',
        checkWarning: 'The task review has not been marked as complete.',
        blocksPromotion: false,
      });
    }

    // Check concept reviews
    const allApproved =
      conceptReviews?.find(
        conceptReview => conceptReview.approved === false,
      ) === undefined;
    if (
      conceptReviews &&
      conceptReviews.length > 0 &&
      !allApproved &&
      task?.status === TaskStatus.InReview
    ) {
      flags.push({
        checkTitle: 'Concepts Not Approved',
        checkWarning: 'Not all concepts have been approved in the review.',
        blocksPromotion: true,
      });
    }

    // Check CRS concepts
    if (deletedCrsConceptFound) {
      flags.push({
        checkTitle: 'Deleted CRS concept',
        checkWarning:
          'A CRS request has been deleted on this task, the associated CRS request has been put back into a state of Accepted',
        blocksPromotion: false,
      });
    }

    // Classification checks
    const classification = task.latestClassificationJson;
    if (!classification) {
      flags.push({
        checkTitle: 'Classification Not Run',
        checkWarning:
          'No classifications were run on this branch. Promote only if you are sure your changes will not affect future classification.',
        blocksPromotion: false,
      });
    } else {
      // Check classification status
      if (
        classification.status === 'COMPLETED' ||
        classification.status === 'SAVING_IN_PROGRESS' ||
        classification.status === 'SAVED'
      ) {
        flags.push({
          checkTitle: 'Classification Run',
          checkWarning: null,
          blocksPromotion: false,
        });
      } else {
        flags.push({
          checkTitle: 'Classification Not Completed',
          checkWarning:
            'Classification was started for this branch, but either failed or has not completed.',
          blocksPromotion: false,
        });
      }

      // Check if classification is current
      if (classification.status === 'COMPLETED') {
        const classificationTime = new Date(
          classification.creationDate,
        ).getTime();
        if (classificationTime >= task?.branchHeadTimeStamp) {
          flags.push({
            checkTitle: 'Classification Current',
            checkWarning: null,
            blocksPromotion: false,
          });
        } else {
          flags.push({
            checkTitle: 'Classification Not Current',
            checkWarning:
              'Classification was run, but modifications were made after the classifier was initiated. Promote only if you are sure any changes will not affect future classification.',
            blocksPromotion: false,
          });
        }
      } else if (classification.status === 'SAVED') {
        if (!classification?.completionDate) {
          flags.push({
            checkTitle: 'Classification May Not Be Current',
            checkWarning:
              'Could not determine whether modifications were made after saving the classification. Promote only if you sure any changes will not affect future classification.',
            blocksPromotion: false,
          });
        } else {
          const isClassificationCurrent = checkIfClassificationSavedCurrent(
            activities.activities,
          );
          if (isClassificationCurrent) {
            flags.push({
              checkTitle: 'Classification Current',
              checkWarning: null,
              blocksPromotion: false,
            });
          } else {
            flags.push({
              checkTitle: 'Classification Not Current',
              checkWarning:
                'Classification was run, but modifications were made to the task afterwards. Promote only if you are sure those changes will not affect future classifications.',
              blocksPromotion: false,
            });
          }
        }
      }

      // Check if classification was saved
      if (classification.status === 'SAVED') {
        flags.push({
          checkTitle: 'Classification Accepted',
          checkWarning: null,
          blocksPromotion: false,
        });
      } else if (
        classification.equivalentConceptsFound ||
        classification.inferredRelationshipChangesFound ||
        classification.redundantStatedRelationshipsFound
      ) {
        flags.push({
          checkTitle: 'Classification Not Accepted',
          checkWarning:
            'Classification results were not accepted to this branch',
          blocksPromotion: false,
        });
      } else {
        flags.push({
          checkTitle: 'Classification Has No Results to Accept',
          checkWarning: null,
          blocksPromotion: false,
        });
      }

      // Check for equivalencies (blocking)
      if (classification.equivalentConceptsFound) {
        flags.push({
          checkTitle: 'Equivalencies Found',
          checkWarning:
            'Classification reports equivalent concepts on this branch. You may not promote until these are resolved',
          blocksPromotion: true,
        });
      }
    }

    // Separate blocking issues from warnings
    const blockingIssues = flags.filter(flag => flag.blocksPromotion);
    const warnings = flags.filter(flag => !flag.blocksPromotion);

    // Determine if promotable
    const promotable = blockingIssues.length === 0;

    return {
      promotable,
      warnings,
      blockingIssues,
    };
  }, [
    task,
    conceptReviews,
    activities,
    hasUnsavedConcepts,
    deletedCrsConceptFound,
  ]);

  return result;
}

// Helper function to check if classification saved is current
function checkIfClassificationSavedCurrent(
  activities: Activity[] | undefined,
): boolean {
  let lastClassificationSaved = 0;
  if (activities === undefined) return false;
  const lastModifiedTime = new Date(
    activities[activities.length - 1]?.commitDate || 0,
  ).getTime();

  activities.forEach(activity => {
    if (activity.activityType === 'CLASSIFICATION_SAVE') {
      lastClassificationSaved = new Date(activity.commitDate).getTime();
    }
  });

  return lastClassificationSaved === lastModifiedTime;
}
