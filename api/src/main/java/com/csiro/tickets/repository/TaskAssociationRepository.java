package com.csiro.tickets.repository;

import com.csiro.tickets.TaskAssociationDto;
import com.csiro.tickets.models.TaskAssociation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskAssociationRepository extends JpaRepository<TaskAssociation, Long> {

  @Query(
      "SELECT NEW com.csiro.tickets.TaskAssociationDto(ta.id, ta.ticket.id, ta.taskId) from TaskAssociation as ta")
  List<TaskAssociationDto> findAllToDto();

  @Query(value = "select * from TASK_ASSOCIATION where ticket_id = :ticketId", nativeQuery = true)
  Optional<TaskAssociation> findExisting(@Param("ticketId") Long ticketId);
}
