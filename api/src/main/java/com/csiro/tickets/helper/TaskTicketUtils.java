package com.csiro.tickets.helper;

import com.csiro.snomio.util.Task;
import com.csiro.tickets.models.Ticket;
import java.util.List;

public class TaskTicketUtils {

  private TaskTicketUtils() {}

  public static Task findAssociatedTask(Ticket ticket, List<Task> tasks) {
    for (Task task : tasks) {
      if (ticket.getTaskAssociation().getTaskId().equals(task.getKey())) {
        return task;
      }
    }
    return null;
  }
}
