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

import au.gov.digitalhealth.lingo.configuration.TaskStatusProperties;
import au.gov.digitalhealth.lingo.util.Task;
import au.gov.digitalhealth.tickets.models.Comment;
import au.gov.digitalhealth.tickets.models.State;
import au.gov.digitalhealth.tickets.models.TaskAssociation;
import au.gov.digitalhealth.tickets.repository.CommentRepository;
import au.gov.digitalhealth.tickets.repository.StateRepository;
import au.gov.digitalhealth.tickets.repository.TaskAssociationRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Log
public class TaskAssociationCleanupService {

  private static final DateTimeFormatter PROMOTION_DATE_FORMAT =
      DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss 'UTC'").withZone(ZoneOffset.UTC);

  private final TaskAssociationRepository taskAssociationRepository;
  private final TicketRepository ticketRepository;
  private final StateRepository stateRepository;
  private final CommentRepository commentRepository;
  private final TaskStatusProperties taskStatusProperties;

  public TaskAssociationCleanupService(
      TaskAssociationRepository taskAssociationRepository,
      TicketRepository ticketRepository,
      StateRepository stateRepository,
      CommentRepository commentRepository,
      TaskStatusProperties taskStatusProperties) {
    this.taskAssociationRepository = taskAssociationRepository;
    this.ticketRepository = ticketRepository;
    this.stateRepository = stateRepository;
    this.commentRepository = commentRepository;
    this.taskStatusProperties = taskStatusProperties;
  }

  @Transactional
  public void cleanupTerminalTaskAssociations(List<Task> tasks) {
    if (tasks == null || tasks.isEmpty()) {
      return;
    }

    Map<String, Task.Status> taskStatusByKey =
        tasks.stream()
            .filter(t -> t.getKey() != null && t.getStatus() != null)
            .collect(Collectors.toMap(Task::getKey, Task::getStatus, (a, b) -> a));

    Optional<State> closedState = stateRepository.findByLabel("Closed");
    if (closedState.isEmpty()) {
      log.warning("No 'Closed' state found — ticket state will not be updated on task promotion");
    }

    List<TaskAssociation> associations = taskAssociationRepository.findAll();
    for (TaskAssociation association : associations) {
      Task.Status status = taskStatusByKey.get(association.getTaskId());

      if (status != null
          && taskStatusProperties.getCloseTicket().contains(status)
          && closedState.isPresent()) {
        ticketRepository.updateStateByTaskAssociation(association.getId(), closedState.get());
        log.info(
            "Closed ticket for taskId ["
                + association.getTaskId()
                + "] with status ["
                + status
                + "]");
      }

      if (status == null || taskStatusProperties.getRemoveAssociation().contains(status)) {
        Instant now = Instant.now();
        String commentText =
            status != null
                ? "Task association to task ["
                    + association.getTaskId()
                    + "] automatically removed because of task being "
                    + status
                    + " on "
                    + PROMOTION_DATE_FORMAT.format(now)
                    + "."
                : "Task association to task ["
                    + association.getTaskId()
                    + "] automatically removed because the task no longer exists in the authoring platform.";
        Comment comment =
            Comment.builder().ticket(association.getTicket()).text(commentText).build();
        commentRepository.save(comment);
        log.info("Added promotion comment to ticket for taskId [" + association.getTaskId() + "]");
        ticketRepository.clearTaskAssociation(association.getId());
        taskAssociationRepository.delete(association);
        log.info(
            "Removed task association for taskId ["
                + association.getTaskId()
                + "] with status ["
                + status
                + "]");
      }
    }
  }
}
