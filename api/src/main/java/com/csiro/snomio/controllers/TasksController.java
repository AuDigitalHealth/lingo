package com.csiro.snomio.controllers;

import com.csiro.snomio.service.TaskManagerClient;
import com.google.gson.JsonArray;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

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
  public JsonArray tasks(HttpServletRequest request) {
    return taskManagerClient.getAllTasks();
  }

  @GetMapping("/myTasks")
  public JsonArray myTasks(HttpServletRequest request) {
    return taskManagerClient.getUserTasks();
  }
}
