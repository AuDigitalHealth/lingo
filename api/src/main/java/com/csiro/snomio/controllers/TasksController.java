package com.csiro.snomio.controllers;

import com.csiro.snomio.security.auth.AuthHelper;
import com.csiro.snomio.service.AuthoringServicesRestClient;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.gson.JsonArray;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/api/tasks",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class TasksController {

  @Autowired AuthoringServicesRestClient authoringServicesRestClient;
  @Autowired private AuthHelper authHelper;

  @GetMapping("")
  @ResponseBody
  public JsonArray tasks(HttpServletRequest request) throws JsonProcessingException {
    String cookieValue = authHelper.getCookie();
    JsonArray tasks = authoringServicesRestClient.getUserTasks(cookieValue);
    return tasks;
  }
}
