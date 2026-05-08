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
package au.gov.digitalhealth.lingo.controllers;

import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.lingo.promotion.DanglingReferenceSummary;
import au.gov.digitalhealth.lingo.promotion.TidyResult;
import au.gov.digitalhealth.lingo.service.DanglingReferenceService;
import au.gov.digitalhealth.lingo.service.TaskManagerClient;
import au.gov.digitalhealth.lingo.util.Task;
import com.google.gson.JsonArray;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.file.AccessDeniedException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
public class TasksController {

  private final TaskManagerClient taskManagerClient;
  private final DanglingReferenceService danglingReferenceService;

  public TasksController(
      TaskManagerClient taskManagerClient, DanglingReferenceService danglingReferenceService) {
    this.taskManagerClient = taskManagerClient;
    this.danglingReferenceService = danglingReferenceService;
  }

  @GetMapping("")
  public List<Task> tasks(HttpServletRequest request) {
    return taskManagerClient.getAllTasks();
  }

  @GetMapping("/myTasks")
  public JsonArray myTasks(HttpServletRequest request) {
    return taskManagerClient.getUserTasks();
  }

  @PostMapping(value = "", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Task> createTask(@RequestBody Task task) {
    Task createdTask = taskManagerClient.createTask(task);
    return new ResponseEntity<>(createdTask, HttpStatus.OK);
  }

  @GetMapping("/{projectKey}/{taskKey}/dangling-references")
  public DanglingReferenceSummary getDanglingReferences(
      @PathVariable String projectKey, @PathVariable String taskKey) throws AccessDeniedException {
    return danglingReferenceService.detect(resolveBranch(projectKey, taskKey));
  }

  /**
   * Tidies dangling references on the task branch on a best-effort, per-item basis. Always returns
   * 200 with a {@link TidyResult}; the caller MUST inspect {@code failed} — a non-empty list
   * signals partial or total tidy failure and the caller MUST NOT proceed with promotion.
   */
  @PostMapping("/{projectKey}/{taskKey}/dangling-references/tidy")
  public TidyResult tidyDanglingReferences(
      @PathVariable String projectKey, @PathVariable String taskKey) throws AccessDeniedException {
    return danglingReferenceService.tidy(resolveBranch(projectKey, taskKey));
  }

  private String resolveBranch(String projectKey, String taskKey) throws AccessDeniedException {
    Task task = taskManagerClient.getTaskByKey(projectKey, taskKey);
    if (task == null || task.getBranchPath() == null) {
      throw new ResourceNotFoundProblem(
          "No branch found for project " + projectKey + " task " + taskKey);
    }
    return task.getBranchPath();
  }
}
