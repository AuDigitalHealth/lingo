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
package au.gov.digitalhealth.lingo.util;

import au.gov.digitalhealth.lingo.exception.LingoProblem;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;

public class BranchPatternMatcher {
  private static final Pattern TASK_PATTERN = Pattern.compile("^[^|]+([|][^|]+){3}$");

  private BranchPatternMatcher() {}

  public static boolean isTaskPattern(String branch) {
    return TASK_PATTERN.matcher(branch).matches();
  }

  public static String getProjectFromTask(String branch) {
    if (!isTaskPattern(branch)) {
      throw new LingoProblem(
          "branch-pattern",
          "Branch " + branch + " is not a task pattern, cannot extract project",
          HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return branch.substring(0, branch.lastIndexOf("|"));
  }
}
