package com.csiro.snomio.util;

import com.csiro.snomio.exception.SnomioProblem;
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
      throw new SnomioProblem(
          "branch-pattern",
          "Branch " + branch + " is not a task pattern, cannot extract project",
          HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return branch.substring(0, branch.lastIndexOf("|"));
  }
}
