package com.csiro.snomio.controllers;

import com.csiro.snomio.service.TaskManagerService;
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
@RequestMapping(value = "/api/tasks", produces = {MediaType.APPLICATION_JSON_VALUE})
public class TasksController {

    @Autowired
    private TaskManagerService taskManagerService;


    @GetMapping("")
    @ResponseBody
    public JsonArray tasks(HttpServletRequest request) throws JsonProcessingException {
        JsonArray tasks = taskManagerService.getUserTasks( );
        return tasks;
    }
}