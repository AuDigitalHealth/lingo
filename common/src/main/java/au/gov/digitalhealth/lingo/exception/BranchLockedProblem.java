package au.gov.digitalhealth.lingo.exception;

import org.springframework.http.HttpStatus;

public class BranchLockedProblem extends LingoProblem {
  public BranchLockedProblem(String branch, String lockMessage) {
    super(
        "branch-locked",
        "Branch locked",
        HttpStatus.LOCKED,
        "Branch "
            + branch
            + " is locked"
            + (lockMessage == null ? "" : " with message: " + lockMessage));
  }
}
