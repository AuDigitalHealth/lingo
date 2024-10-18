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

import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.models.TicketAssociation;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketAssociationRepository extends JpaRepository<TicketAssociation, Long> {

  @Query(
      "SELECT ta FROM TicketAssociation ta WHERE ta.associationSource.id = :ticketId OR ta.associationTarget.id = :ticketId")
  Set<TicketAssociation> findByAssociationSourceIdOrAssociationTargetId(
      @Param("ticketId") Long ticketId);

  List<TicketAssociation> findByAssociationSourceAndAssociationTarget(Ticket source, Ticket target);

  @Query(
      "SELECT ta FROM TicketAssociation ta WHERE (ta.associationSource = :source AND ta.associationTarget = :target) OR (ta.associationSource = :target AND ta.associationTarget = :source)")
  List<TicketAssociation> findBySourceAndTargetFlipped(
      @Param("source") Ticket source, @Param("target") Ticket target);

  void deleteByAssociationSourceId(Long id);

  void deleteByAssociationTargetId(Long id);

  Set<TicketAssociation> findByAssociationSource_IdIn(Collection<Long> ids);
}
