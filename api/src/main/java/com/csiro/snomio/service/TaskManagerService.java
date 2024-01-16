package com.csiro.snomio.service;

import com.csiro.snomio.auth.ImsUser;
import com.csiro.snomio.exception.OwnershipProblem;
import com.csiro.snomio.util.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class TaskManagerService {

  @Value("${spring.profiles.active}")
  private String activeProfile;

  private final TaskManagerClient taskManagerClient;

  public TaskManagerService(@Autowired TaskManagerClient taskManagerClient) {
    this.taskManagerClient = taskManagerClient;
  }

  public void checkTaskOwnershipOrThrow(String branch) {
    if (activeProfile.equals("test")) {
      return;
    }
    String[] parts = branch.split("\\|");

    String branchPath = parts[parts.length - 2];
    String key = parts[parts.length - 1];
    Task task = taskManagerClient.getTaskByKey(branchPath, key);
    ImsUser imsUser =
        (ImsUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    if (!task.getAssignee().getUsername().equals(imsUser.getLogin())) {
      throw new OwnershipProblem("User does not have ownership of Task");
    }
  }
}
