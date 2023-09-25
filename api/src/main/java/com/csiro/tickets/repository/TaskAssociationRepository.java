package com.csiro.tickets.repository;

import com.csiro.tickets.controllers.dto.TaskAssociationDto;
import com.csiro.tickets.models.TaskAssociation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TaskAssociationRepository extends JpaRepository<TaskAssociation, Long> {

  @Query(
      value = "select id as id, ticket_id as ticketId, task_id as taskId from TASK_ASSOCIATION",
      nativeQuery = true)
  List<TaskAssociationDto> findAllToDto();
}
