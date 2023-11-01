package com.csiro.snomio.controllers;

import com.csiro.snomio.models.JiraUser;
import com.csiro.snomio.service.JiraUserManagerService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class JiraUserController {

  private final JiraUserManagerService jiraUserManagerService;

  @Autowired
  public JiraUserController(JiraUserManagerService jiraUserManagerService) {
    this.jiraUserManagerService = jiraUserManagerService;
  }

  @GetMapping("")
  @ResponseBody
  public List<JiraUser> getAllUsers(HttpServletRequest request) {
    return jiraUserManagerService.getAllJiraUsers();
  }
}
