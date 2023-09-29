package com.csiro.tickets.repository;

import com.csiro.tickets.controllers.dto.TaskAssociationDto;
import com.csiro.tickets.models.TaskAssociation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskAssociationRepository extends JpaRepository<TaskAssociation, Long> {

  @Query(
      value = "select id as id, ticket_id as ticketId, task_id as taskId from TASK_ASSOCIATION",
      nativeQuery = true)
  List<TaskAssociationDto> findAllToDto();

  @Query(
      value = "select * from TASK_ASSOCIATION where ticket_id = :ticketId AND task_id = :taskId",
      nativeQuery = true)
  Optional<TaskAssociation> findExisting(
      @Param("taskId") String taskId, @Param("ticketId") Long ticketId);
}
