package com.csiro.snomio.controllers;

import com.csiro.snomio.service.TaskManagerService;
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

  private final TaskManagerService taskManagerService;

  @Autowired
  public TasksController(TaskManagerService taskManagerService) {
    this.taskManagerService = taskManagerService;
  }

  @GetMapping("")
  @ResponseBody
  public JsonArray tasks(HttpServletRequest request) {
    return taskManagerService.getAllTasks();
  }

  @GetMapping("/myTasks")
  public JsonArray myTasks(HttpServletRequest request) {
    return taskManagerService.getUserTasks();
  }
}
