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
package au.gov.digitalhealth.tickets.repository;

import au.gov.digitalhealth.tickets.TaskAssociationDto;
import au.gov.digitalhealth.tickets.models.TaskAssociation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskAssociationRepository extends JpaRepository<TaskAssociation, Long> {

  @Query(
      "SELECT NEW au.gov.digitalhealth.tickets.TaskAssociationDto(ta.id, ta.ticket.id,ta.ticket.ticketNumber, ta.taskId) from TaskAssociation as ta")
  List<TaskAssociationDto> findAllToDto();

  @Query(value = "select * from TASK_ASSOCIATION where ticket_id = :ticketId", nativeQuery = true)
  Optional<TaskAssociation> findExisting(@Param("ticketId") Long ticketId);
}
