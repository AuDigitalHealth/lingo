package com.csiro.snomio.service;

import com.csiro.snomio.auth.model.ImsUser;
import com.csiro.snomio.exception.OwnershipProblem;
import com.csiro.snomio.exception.TaskActionsLockedProblem;
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

  public void validateTaskState(String branch) {
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
      throw new OwnershipProblem("The task is not owned by the user.");
    }
    if (task.getStatus() != null && task.getStatus().equalsIgnoreCase("Promoted")) {
      throw new TaskActionsLockedProblem("Task has been promoted. No further changes allowed.");
    }
    if (task.getLatestClassificationJson() != null
        && task.getLatestClassificationJson().getStatus() != null
        && task.getLatestClassificationJson().getStatus().equalsIgnoreCase("RUNNING")) {
      throw new TaskActionsLockedProblem("Classification is running");
    }
  }
}
