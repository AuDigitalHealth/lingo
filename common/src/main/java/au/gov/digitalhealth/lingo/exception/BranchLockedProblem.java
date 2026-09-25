/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.lingo.exception;

import org.springframework.http.HttpStatus;

/**
 * A branch could not be written to because it is locked. 423 LOCKED rather than a 5xx: the branch
 * being busy is an expected, transient condition an author can act on, not a server fault, and
 * {@code ClientErrorNoiseFilter} drops 4xx responses from Sentry so it does not report as a fatal.
 */
public class BranchLockedProblem extends LingoProblem {

  /**
   * Snowstorm locks a branch for classification, promotion and rebase, so those are what an author
   * is almost always waiting on.
   */
  private static final String DEFAULT_GUIDANCE =
      "This usually means a classification, promotion or rebase is running on the task. Wait for it"
          + " to finish and try again. Nothing was changed.";

  public BranchLockedProblem(String branch, String lockMessage) {
    this(branch, lockMessage, DEFAULT_GUIDANCE);
  }

  /**
   * @param guidance what the author should do about it, and what this means for anything already
   *     written by the same request - the default wording promises nothing was changed, which only
   *     holds when the lock was detected before any write was attempted.
   */
  public BranchLockedProblem(String branch, String lockMessage, String guidance) {
    super(
        "branch-locked",
        "Branch locked",
        HttpStatus.LOCKED,
        "Branch "
            + branch
            + " is locked"
            + (lockMessage == null ? "" : " with message: " + lockMessage)
            + ". "
            + guidance);
  }
}
