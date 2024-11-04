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

import au.gov.digitalhealth.lingo.service.TaskManagerClient;
import au.gov.digitalhealth.lingo.util.Task;
import com.google.gson.JsonArray;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
public class TasksController {

  private final TaskManagerClient taskManagerClient;

  public TasksController(TaskManagerClient taskManagerClient) {
    this.taskManagerClient = taskManagerClient;
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
}
