package com.csiro.snomio.controllers;

import com.csiro.snomio.service.TaskManagerClient;
import com.csiro.snomio.util.Task;
import com.google.gson.JsonArray;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
public class TasksController {

  private final TaskManagerClient taskManagerClient;

  @Autowired
  public TasksController(TaskManagerClient taskManagerClient) {
    this.taskManagerClient = taskManagerClient;
  }

  @GetMapping("")
  @ResponseBody
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
