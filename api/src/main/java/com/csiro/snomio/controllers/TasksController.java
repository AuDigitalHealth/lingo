package com.csiro.snomio.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.gson.JsonArray;
import com.csiro.snomio.service.AuthoringServicesRestClient;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/tasks", produces = {MediaType.APPLICATION_JSON_VALUE})
public class TasksController {

    @Autowired
    AuthoringServicesRestClient authoringServicesRestClient;

    @GetMapping("")
    @ResponseBody
    public JsonArray tasks(HttpServletRequest request, Authentication authentication) throws JsonProcessingException {
        String cookieValue = (String) authentication.getCredentials();
        JsonArray tasks = authoringServicesRestClient.getUserTasks( cookieValue );
        return tasks;
    }
}