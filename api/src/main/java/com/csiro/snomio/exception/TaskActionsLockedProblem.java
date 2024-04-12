package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class TaskActionsLockedProblem extends SnomioProblem {

  public TaskActionsLockedProblem(String message) {
    super("task-actions-locked-problem", "Forbidden", HttpStatus.FORBIDDEN, message);
  }
}
