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
package au.gov.digitalhealth.lingo.service;

import au.gov.digitalhealth.lingo.auth.model.ImsUser;
import au.gov.digitalhealth.lingo.exception.OwnershipProblem;
import au.gov.digitalhealth.lingo.exception.TaskActionsLockedProblem;
import au.gov.digitalhealth.lingo.util.Task;
import au.gov.digitalhealth.lingo.util.Task.Status;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class TaskManagerService {

  private final TaskManagerClient taskManagerClient;

  @Value("${spring.profiles.active}")
  private String activeProfile;

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
    if (task.getStatus() != null && task.getStatus().equals(Status.PROMOTED)) {
      throw new TaskActionsLockedProblem("Task has been promoted. No further changes allowed.");
    }
    if (task.getLatestClassificationJson() != null
        && task.getLatestClassificationJson().getStatus() != null
        && task.getLatestClassificationJson().getStatus().equalsIgnoreCase("RUNNING")) {
      throw new TaskActionsLockedProblem("Classification is running");
    }
  }
}
